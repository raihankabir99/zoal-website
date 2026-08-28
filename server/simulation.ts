import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getDecisionModels(req: Request, res: Response) {
  // Decision simulation is currently being upgraded for the next enterprise release.
  // We return a controlled empty state with a message.
  res.json([]);
}

export async function getSimulationRuns(req: Request, res: Response) {
  res.json([]);
}

export async function createSimulationRun(req: Request, res: Response) {
  res.status(503).json({ 
    error: 'Service Unavailable', 
    message: 'The Decision Simulation Engine is currently under maintenance for core heuristic upgrades.' 
  });
}
