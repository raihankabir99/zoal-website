import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getLegalDocuments(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_legal_documents').select('*, zoal_legal_document_versions(*)');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function createDocument(req: Request, res: Response) {
  const { slug, title, content } = req.body;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: doc, error: docError } = await supabase.from('zoal_legal_documents').insert({ slug, title }).select().single();
  if (docError) return res.status(500).json({ error: docError.message });

  const { data: version, error: verError } = await supabase.from('zoal_legal_document_versions').insert({
    document_id: doc.id,
    content,
    version_number: 1,
    status: 'Draft'
  }).select().single();
  
  if (verError) return res.status(500).json({ error: verError.message });

  await supabase.from('zoal_legal_documents').update({ current_version_id: version.id }).eq('id', doc.id);
  res.status(201).json({ ...doc, current_version: version });
}
