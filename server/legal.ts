import { getSupabaseClient } from './supabase';
import { logActivityAsync } from './auth_db';
import { Request, Response } from 'express';
import pg from 'pg';

const { Client } = pg;

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9-_]+$/;

function isValidUUID(uuid: any): boolean {
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

function isValidSlug(slug: any): boolean {
  return typeof slug === 'string' && SLUG_REGEX.test(slug);
}

function getRequestMetadata(req: Request) {
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return { ip, userAgent };
}

function isPrivilegedUser(user: any): boolean {
  return user && ['owner', 'admin', 'manager', 'staff', 'editor'].includes((user.role || '').toLowerCase());
}

function internalServerError(res: Response, publicMessage: string) {
  return res.status(500).json({ error: publicMessage });
}

export async function getLegalDocuments(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return internalServerError(res, 'Legal service unavailable.');

  try {
    const user = (req as any).user;
    const isPrivileged = isPrivilegedUser(user);

    const { data: documents, error } = await supabase
      .from('zoal_legal_documents')
      .select('*, zoal_legal_document_versions(*)');

    if (error) {
      console.error('Legal document list query failed:', error);
      return internalServerError(res, 'Failed to retrieve legal documents.');
    }

    const sanitizedDocuments = (documents || []).map(doc => {
      let versions = doc.zoal_legal_document_versions || [];
      if (!isPrivileged) {
        versions = versions.filter((v: any) => v.status === 'Published');
      }
      versions.sort((a: any, b: any) => b.version_number - a.version_number);
      return {
        ...doc,
        zoal_legal_document_versions: versions
      };
    });

    const finalDocuments = isPrivileged
      ? sanitizedDocuments
      : sanitizedDocuments.filter(doc => doc.zoal_legal_document_versions.length > 0);

    return res.json(finalDocuments);
  } catch (err: any) {
    console.error('Legal document list failed:', err);
    return internalServerError(res, 'Failed to retrieve legal documents.');
  }
}

export async function getLegalDocumentBySlugOrId(req: Request, res: Response) {
  const { slugOrId } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return internalServerError(res, 'Legal service unavailable.');

  const isUUID = isValidUUID(slugOrId);
  const isSlug = isValidSlug(slugOrId);

  if (!isUUID && !isSlug) {
    return res.status(400).json({ error: 'Invalid document identifier format.' });
  }

  try {
    const user = (req as any).user;
    const isPrivileged = isPrivilegedUser(user);

    let query = supabase.from('zoal_legal_documents').select('*, zoal_legal_document_versions(*)');
    if (isUUID) {
      query = query.eq('id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }

    const { data: doc, error } = await query.maybeSingle();

    if (error) {
      console.error('Legal document lookup failed:', error);
      return internalServerError(res, 'Failed to retrieve legal document.');
    }

    if (!doc) {
      return res.status(404).json({ error: 'Legal document not found.' });
    }

    let versions = doc.zoal_legal_document_versions || [];
    if (!isPrivileged) {
      versions = versions.filter((v: any) => v.status === 'Published');
    }

    if (!isPrivileged && versions.length === 0) {
      return res.status(404).json({ error: 'Legal document content is currently unavailable or unpublished.' });
    }

    versions.sort((a: any, b: any) => b.version_number - a.version_number);

    return res.json({
      ...doc,
      zoal_legal_document_versions: versions,
      current_version: versions.find((v: any) => v.id === doc.current_version_id) || versions[0] || null
    });
  } catch (err: any) {
    console.error('Legal document lookup failed:', err);
    return internalServerError(res, 'Failed to retrieve legal document.');
  }
}

export async function createDocument(req: Request, res: Response) {
  const { slug, title, content, status } = req.body;
  const user = (req as any).user;

  if (!isPrivilegedUser(user)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
  }

  if (!slug || typeof slug !== 'string' || !isValidSlug(slug)) {
    return res.status(400).json({ error: 'Invalid input payload.', message: 'Slug is required and must use lowercase alphanumeric characters, hyphens, or underscores only.' });
  }
  if (slug.length > 160) {
    return res.status(400).json({ error: 'Invalid input payload.', message: 'Slug is too long.' });
  }
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Invalid input payload.', message: 'Title is required.' });
  }
  if (title.length > 500) {
    return res.status(400).json({ error: 'Invalid input payload.', message: 'Title is too long.' });
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Invalid input payload.', message: 'Content body is required.' });
  }

  const normalizedStatus = status === 'Published' ? 'Published' : 'Draft';
  const pgClient = getPgClient();
  if (!pgClient) return internalServerError(res, 'Database transaction service unavailable.');

  const { ip, userAgent } = getRequestMetadata(req);

  try {
    await pgClient.connect();
    await pgClient.query('BEGIN');

    const slugCheck = await pgClient.query('SELECT 1 FROM zoal_legal_documents WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      await pgClient.query('ROLLBACK');
      return res.status(409).json({ error: 'Conflict', message: 'A legal document with this slug already exists.' });
    }

    const docRes = await pgClient.query(
      'INSERT INTO zoal_legal_documents (slug, title) VALUES ($1, $2) RETURNING *',
      [slug, title.trim()]
    );
    const doc = docRes.rows[0];

    const verRes = await pgClient.query(
      `INSERT INTO zoal_legal_document_versions (document_id, content, version_number, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [doc.id, content, 1, normalizedStatus]
    );
    const version = verRes.rows[0];

    if (normalizedStatus === 'Published') {
      await pgClient.query(
        'UPDATE zoal_legal_documents SET current_version_id = $1, updated_at = NOW() WHERE id = $2',
        [version.id, doc.id]
      );
      doc.current_version_id = version.id;
    }

    await pgClient.query('COMMIT');

    await logActivityAsync(
      user.id,
      user.email,
      `[Legal Compliance] Created legal document "${title}" (Slug: ${slug}) with initial v1 version in "${normalizedStatus}" status.`,
      ip,
      userAgent
    );

    return res.status(201).json({
      ...doc,
      zoal_legal_document_versions: [version],
      current_version: version
    });
  } catch (err: any) {
    try { await pgClient.query('ROLLBACK'); } catch {}
    console.error('Error creating legal document transaction:', err);
    return internalServerError(res, 'Failed to create legal document.');
  } finally {
    await pgClient.end();
  }
}

export async function createVersion(req: Request, res: Response) {
  const { id } = req.params;
  const { content, status } = req.body;
  const user = (req as any).user;

  if (!isPrivilegedUser(user)) return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
  if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid parameter.', message: 'Document ID must be a valid UUID.' });
  if (!content || typeof content !== 'string' || content.trim() === '') return res.status(400).json({ error: 'Invalid input payload.', message: 'Content body is required.' });

  const normalizedStatus = status === 'Published' ? 'Published' : 'Draft';
  const pgClient = getPgClient();
  if (!pgClient) return internalServerError(res, 'Database transaction service unavailable.');
  const { ip, userAgent } = getRequestMetadata(req);

  try {
    await pgClient.connect();
    await pgClient.query('BEGIN');

    const docCheck = await pgClient.query('SELECT * FROM zoal_legal_documents WHERE id = $1 FOR UPDATE', [id]);
    if (docCheck.rows.length === 0) {
      await pgClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Legal document not found.' });
    }
    const doc = docCheck.rows[0];

    const maxVerCheck = await pgClient.query(
      'SELECT COALESCE(MAX(version_number), 0) as max_version FROM zoal_legal_document_versions WHERE document_id = $1',
      [id]
    );
    const nextVersionNumber = parseInt(maxVerCheck.rows[0].max_version || '0', 10) + 1;

    const verRes = await pgClient.query(
      `INSERT INTO zoal_legal_document_versions (document_id, content, version_number, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, content, nextVersionNumber, normalizedStatus]
    );
    const version = verRes.rows[0];

    if (normalizedStatus === 'Published') {
      await pgClient.query(
        'UPDATE zoal_legal_documents SET current_version_id = $1, updated_at = NOW() WHERE id = $2',
        [version.id, id]
      );
      doc.current_version_id = version.id;
    }

    await pgClient.query('COMMIT');

    await logActivityAsync(
      user.id,
      user.email,
      `[Legal Compliance] Created version v${nextVersionNumber} for document "${doc.title}" (ID: ${id}) with status "${normalizedStatus}".`,
      ip,
      userAgent
    );

    return res.status(201).json(version);
  } catch (err: any) {
    try { await pgClient.query('ROLLBACK'); } catch {}
    console.error('Error creating legal version transaction:', err);
    return internalServerError(res, 'Failed to create new legal version.');
  } finally {
    await pgClient.end();
  }
}

export async function updateDraftVersion(req: Request, res: Response) {
  const { versionId } = req.params;
  const { content, status } = req.body;
  const user = (req as any).user;

  if (!isPrivilegedUser(user)) return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
  if (!isValidUUID(versionId)) return res.status(400).json({ error: 'Invalid parameter.', message: 'Version ID must be a valid UUID.' });
  if (!content || typeof content !== 'string' || content.trim() === '') return res.status(400).json({ error: 'Invalid input payload.', message: 'Content body is required.' });

  const pgClient = getPgClient();
  if (!pgClient) return internalServerError(res, 'Database transaction service unavailable.');
  const { ip, userAgent } = getRequestMetadata(req);

  try {
    await pgClient.connect();
    await pgClient.query('BEGIN');

    const verCheck = await pgClient.query('SELECT * FROM zoal_legal_document_versions WHERE id = $1 FOR UPDATE', [versionId]);
    if (verCheck.rows.length === 0) {
      await pgClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Legal document version not found.' });
    }
    const existingVersion = verCheck.rows[0];

    if (existingVersion.status === 'Published') {
      await pgClient.query('ROLLBACK');
      return res.status(409).json({ error: 'Conflict', message: 'Published legal versions are immutable. Create a new version instead.' });
    }

    const nextStatus = status === 'Published' ? 'Published' : 'Draft';
    const updateRes = await pgClient.query(
      'UPDATE zoal_legal_document_versions SET content = $1, status = $2 WHERE id = $3 RETURNING *',
      [content, nextStatus, versionId]
    );
    const updatedVersion = updateRes.rows[0];

    if (nextStatus === 'Published') {
      await pgClient.query(
        'UPDATE zoal_legal_documents SET current_version_id = $1, updated_at = NOW() WHERE id = $2',
        [versionId, existingVersion.document_id]
      );
    }

    await pgClient.query('COMMIT');

    await logActivityAsync(
      user.id,
      user.email,
      `[Legal Compliance] Updated legal draft version v${existingVersion.version_number} (ID: ${versionId})${nextStatus === 'Published' ? ' and published it.' : '.'}`,
      ip,
      userAgent
    );

    return res.json(updatedVersion);
  } catch (err: any) {
    try { await pgClient.query('ROLLBACK'); } catch {}
    console.error('Error updating legal draft version:', err);
    return internalServerError(res, 'Failed to update legal version.');
  } finally {
    await pgClient.end();
  }
}

export async function publishVersion(req: Request, res: Response) {
  const { versionId } = req.params;
  const user = (req as any).user;

  if (!isPrivilegedUser(user)) return res.status(403).json({ error: 'Forbidden', message: 'Access denied.' });
  if (!isValidUUID(versionId)) return res.status(400).json({ error: 'Invalid parameter.', message: 'Version ID must be a valid UUID.' });

  const pgClient = getPgClient();
  if (!pgClient) return internalServerError(res, 'Database transaction service unavailable.');
  const { ip, userAgent } = getRequestMetadata(req);

  try {
    await pgClient.connect();
    await pgClient.query('BEGIN');

    const verCheck = await pgClient.query('SELECT * FROM zoal_legal_document_versions WHERE id = $1 FOR UPDATE', [versionId]);
    if (verCheck.rows.length === 0) {
      await pgClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Legal document version not found.' });
    }
    const version = verCheck.rows[0];

    if (version.status === 'Published') {
      await pgClient.query('ROLLBACK');
      return res.status(400).json({ error: 'Bad Request', message: 'This legal version is already published.' });
    }

    await pgClient.query("UPDATE zoal_legal_document_versions SET status = 'Published' WHERE id = $1", [versionId]);
    await pgClient.query(
      'UPDATE zoal_legal_documents SET current_version_id = $1, updated_at = NOW() WHERE id = $2',
      [versionId, version.document_id]
    );

    await pgClient.query('COMMIT');

    await logActivityAsync(
      user.id,
      user.email,
      `[Legal Compliance] Published legal version v${version.version_number} (ID: ${versionId}) to active storefront.`,
      ip,
      userAgent
    );

    return res.json({ message: 'Version successfully published.', versionId, documentId: version.document_id });
  } catch (err: any) {
    try { await pgClient.query('ROLLBACK'); } catch {}
    console.error('Error publishing legal version:', err);
    return internalServerError(res, 'Failed to publish legal version.');
  } finally {
    await pgClient.end();
  }
}

export async function deleteDocument(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  if (!user || !['owner', 'admin'].includes((user.role || '').toLowerCase())) {
    return res.status(403).json({ error: 'Forbidden', message: 'Owner/Admin privilege is required to delete legal content.' });
  }
  if (!isValidUUID(id)) return res.status(400).json({ error: 'Invalid parameter.', message: 'Document ID must be a valid UUID.' });

  const pgClient = getPgClient();
  if (!pgClient) return internalServerError(res, 'Database transaction service unavailable.');
  const { ip, userAgent } = getRequestMetadata(req);

  try {
    await pgClient.connect();
    await pgClient.query('BEGIN');

    const docCheck = await pgClient.query('SELECT * FROM zoal_legal_documents WHERE id = $1 FOR UPDATE', [id]);
    if (docCheck.rows.length === 0) {
      await pgClient.query('ROLLBACK');
      return res.status(404).json({ error: 'Legal document not found.' });
    }
    const doc = docCheck.rows[0];

    const pubCheck = await pgClient.query(
      "SELECT 1 FROM zoal_legal_document_versions WHERE document_id = $1 AND status = 'Published'",
      [id]
    );

    if (pubCheck.rows.length > 0) {
      await pgClient.query('ROLLBACK');
      return res.status(409).json({ error: 'Conflict', message: 'Legal documents with published history cannot be deleted.' });
    }

    await pgClient.query('DELETE FROM zoal_legal_documents WHERE id = $1', [id]);
    await pgClient.query('COMMIT');

    await logActivityAsync(
      user.id,
      user.email,
      `[Legal Compliance] Deleted draft-only legal document "${doc.title}" (ID: ${id}).`,
      ip,
      userAgent
    );

    return res.json({ message: 'Draft document successfully deleted.' });
  } catch (err: any) {
    try { await pgClient.query('ROLLBACK'); } catch {}
    console.error('Error deleting legal document draft:', err);
    return internalServerError(res, 'Failed to delete draft document.');
  } finally {
    await pgClient.end();
  }
}

/**
 * Resolves the immutable version ID of the currently published Terms & Conditions document.
 * This is authoritative on the backend and must NOT be overridden by client requests.
 */
export async function getPublishedTermsVersionId(): Promise<string | null> {
  const pgClient = getPgClient();
  if (pgClient) {
    try {
      await pgClient.connect();
      const res = await pgClient.query(`
        SELECT v.id
        FROM zoal_legal_document_versions v
        JOIN zoal_legal_documents d ON v.document_id = d.id
        WHERE (d.slug = 'terms' OR d.slug = 'terms-and-conditions')
          AND v.status = 'Published'
        ORDER BY v.version_number DESC
        LIMIT 1
      `);
      if (res.rows.length > 0 && res.rows[0].id) {
        return res.rows[0].id;
      }

      const docRes = await pgClient.query(`
        SELECT current_version_id
        FROM zoal_legal_documents
        WHERE (slug = 'terms' OR slug = 'terms-and-conditions')
          AND current_version_id IS NOT NULL
        LIMIT 1
      `);
      if (docRes.rows.length > 0 && docRes.rows[0].current_version_id) {
        return docRes.rows[0].current_version_id;
      }
    } catch (pgErr) {
      console.warn('⚠️ Direct PG query for published terms version failed:', pgErr);
    } finally {
      await pgClient.end().catch(() => {});
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: doc } = await supabase
        .from('zoal_legal_documents')
        .select('id, current_version_id, zoal_legal_document_versions(id, version_number, status)')
        .or('slug.eq.terms,slug.eq.terms-and-conditions')
        .maybeSingle();

      if (doc) {
        const versions = (doc.zoal_legal_document_versions || [])
          .filter((v: any) => v.status === 'Published')
          .sort((a: any, b: any) => b.version_number - a.version_number);

        if (doc.current_version_id && versions.some((v: any) => v.id === doc.current_version_id)) {
          return doc.current_version_id;
        }
        if (versions.length > 0) {
          return versions[0].id;
        }
      }
    } catch (sbErr) {
      console.warn('⚠️ Supabase query for published terms version failed:', sbErr);
    }
  }

  return null;
}
