import { Request, Response } from 'express';
import { getCoreBusinessStats } from './data_aggregator';

export async function getExecutiveInsights(req: Request, res: Response) {
  try {
    const start = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const end = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const stats = await getCoreBusinessStats(start, end);

    res.json({
      summary: 'Executive metrics generated from authoritative Business Insights data.',
      totalOrdersCount: Number(stats.totalOrders || 0),
      totalRevenue: Number(stats.totalRevenue || 0),
      averageOrderValue: Number(stats.averageOrderValue || 0),
      activeCustomers: Number(stats.activeCustomers || 0),
      lowStockCount: Number(stats.lowStockCount || 0),
      revenueStatusBasis: stats.revenueStatusBasis,
      financialMetrics: {
        profit: null,
        margin: null,
        status: 'not_available_without_authoritative_cogs'
      },
      forecast: {
        status: 'not_provided_by_executive_summary',
        note: 'Use the forecasting endpoint for validated projections; do not infer profit from revenue.'
      }
    });
  } catch (err: any) {
    console.error('Executive Insights Error:', err);
    res.status(500).json({ error: 'Failed to generate authoritative executive insights.' });
  }
}
