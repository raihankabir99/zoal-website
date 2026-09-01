import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import { getCoreBusinessStats } from './data_aggregator';
import { generateExecutiveBriefing } from './ai_service';

export async function getAiBriefings(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  try {
    // 1. Parse optional date range query parameters
    const startDate = typeof req.query.startDate === 'string' && req.query.startDate.trim() ? req.query.startDate.trim() : undefined;
    const endDate = typeof req.query.endDate === 'string' && req.query.endDate.trim() ? req.query.endDate.trim() : undefined;

    // 2. Get real data aligned with date range
    const stats = await getCoreBusinessStats(startDate, endDate);

    // 3. Generate AI briefing dynamically based on real stats
    const content = await generateExecutiveBriefing(stats);

    // 4. Return as a briefing object
    // We can also store this in zoal_ai_briefings for history
    const briefing = {
      id: 'live-briefing',
      title: 'Enterprise Executive Briefing',
      content: content,
      summary: 'Real-time performance analysis and strategic outlook.',
      captured_at: new Date().toISOString(),
      metadata: stats
    };

    res.json([briefing]);
  } catch (err: any) {
    console.error('AI Briefing Error:', err);
    res.status(500).json({ error: 'Failed to generate real-time executive briefing.' });
  }
}
