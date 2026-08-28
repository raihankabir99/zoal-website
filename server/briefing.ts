import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import { getCoreBusinessStats } from './data_aggregator';
import { generateExecutiveBriefing } from './ai_service';

export async function getAiBriefings(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  try {
    // 1. Get real data
    const stats = await getCoreBusinessStats();

    // 2. Generate AI briefing dynamically based on real stats
    const content = await generateExecutiveBriefing(stats);

    // 3. Return as a briefing object
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
