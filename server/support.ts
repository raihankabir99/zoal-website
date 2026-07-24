import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import crypto from 'crypto';

export async function createTicket(req: Request, res: Response) {
  const { customer_id, subject, priority } = req.body;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_support_tickets').insert({
    customer_id,
    subject,
    priority,
    status: 'Open'
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function getTickets(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_support_tickets').select('*, zoal_ticket_messages(*)').order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function addMessage(req: Request, res: Response) {
  const { ticket_id, user_id, message, is_internal_note } = req.body;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_ticket_messages').insert({
    ticket_id,
    user_id,
    message,
    is_internal_note
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}
