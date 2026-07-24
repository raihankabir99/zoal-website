import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getCmsData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: pages, error: pagesError } = await supabase.from('zoal_cms_pages').select('*');
  const { data: sections, error: sectionsError } = await supabase.from('zoal_cms_sections').select('*');
  const { data: banners, error: bannersError } = await supabase.from('zoal_banners').select('*');
  const { data: blocks, error: blocksError } = await supabase.from('zoal_homepage_blocks').select('*');

  if (pagesError || sectionsError || bannersError || blocksError) {
    return res.status(500).json({ error: 'Failed to fetch CMS data.' });
  }

  res.json({ pages, sections, banners, blocks });
}

export async function updateCmsPage(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_cms_pages').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
