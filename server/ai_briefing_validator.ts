export interface ExecutiveContext {
  metadata: {
    data_period: { start?: string; end?: string; range?: string };
    data_as_of: string;
    generated_at: string;
    currency: string;
  };
  sales: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
  };
  customers: {
    active_customers: number;
  };
  inventory: {
    low_stock_count: number;
  };
  financials: {
    revenue: { value: number; status: string };
    cogs: { status: string };
    gross_profit: { status: string };
    gross_margin: { status: string };
    expenses: { status: string };
    net_profit: { status: string };
    cash_flow: { status: string };
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedData: any;
}

const FORBIDDEN_FINANCIAL_PATTERNS: Array<[RegExp, keyof ExecutiveContext['financials']]> = [
  [/\b(?:cogs|cost of goods sold)\b/i, 'cogs'],
  [/\b(?:gross profit|gross margin)\b/i, 'gross_profit'],
  [/\b(?:operating expenses?|opex)\b/i, 'expenses'],
  [/\b(?:net profit|net income)\b/i, 'net_profit'],
  [/\b(?:cash flow|cashflow)\b/i, 'cash_flow']
];

const FORECAST_PATTERN = /\b(?:forecast|project(?:ed|ion)?|predict(?:ed|ion)?|expected|expect|likely|will|may|could|might|next\s+(?:day|week|month|quarter|year)|future)\b[^.\n]{0,160}(?:\bSAR\s*[\d,.]+|[\d,.]+\s*%|\b\d[\d,.]*\b)/i;

function normalizeNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}

function collectAuthoritativeNumbers(context: ExecutiveContext): Set<number> {
  return new Set([
    context.sales.total_revenue,
    context.sales.total_orders,
    context.sales.average_order_value,
    context.customers.active_customers,
    context.inventory.low_stock_count,
    context.financials.revenue.value
  ].filter(Number.isFinite));
}

function containsUnauthorizedNumericClaim(text: string, context: ExecutiveContext): boolean {
  const authoritative = collectAuthoritativeNumbers(context);
  const monetaryOrPercent = /(?:SAR\s*)?[\d]{1,3}(?:,[\d]{3})*(?:\.\d+)?\s*(?:SAR|%)/gi;
  let match: RegExpExecArray | null;
  while ((match = monetaryOrPercent.exec(text)) !== null) {
    const raw = match[0].replace(/SAR/gi, '').replace(/%/g, '').trim();
    const n = normalizeNumber(raw);
    if (Number.isFinite(n) && !authoritative.has(n)) return true;
  }
  return false;
}

function sanitizeNarrative(text: unknown, context: ExecutiveContext): { text: string; changed: boolean } {
  if (typeof text !== 'string') return { text: '', changed: true };
  let output = text;
  let changed = false;

  for (const [pattern, metric] of FORBIDDEN_FINANCIAL_PATTERNS) {
    if (context.financials[metric].status === 'UNAVAILABLE' && pattern.test(output)) {
      output = output.replace(new RegExp(`[^.\\n]*${pattern.source}[^.\\n]*(?:[.\\n]|$)`, 'gi'), '').trim();
      changed = true;
    }
  }

  if (FORECAST_PATTERN.test(output)) {
    output = output.replace(/[^.\n]*(?:forecast|project(?:ed|ion)?|predict(?:ed|ion)?|expected|expect|likely|will|may|could|might|next\s+(?:day|week|month|quarter|year)|future)[^.\n]*(?:\bSAR\s*[\d,.]+|[\d,.]+\s*%|\b\d[\d,.]*\b)[^.\n]*/gi, '').trim();
    changed = true;
  }

  if (containsUnauthorizedNumericClaim(output, context)) {
    // Narrative numerical claims cannot be safely reconciled without a claim-level
    // parser. Remove the affected numeric sentence rather than trusting the LLM.
    output = output.replace(/[^.\n]*(?:SAR\s*[\d,.]+|[\d,.]+\s*%)[^.\n]*/gi, '').trim();
    changed = true;
  }

  return { text: output || 'No additional verified narrative is available.', changed };
}

export function validateAndSanitizeAiBriefing(rawAiOutput: any, context: ExecutiveContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let data = rawAiOutput;
  if (typeof data === 'string') {
    try {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
      data = JSON.parse(cleaned);
    } catch (err: any) {
      return { isValid: false, errors: [`JSON Parse Error: ${err.message}`], warnings: [], validatedData: null };
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, errors: ['AI output is not a valid JSON object.'], warnings: [], validatedData: null };
  }

  const requiredFields = ['executive_summary', 'risks', 'recommendations', 'revenue_summary', 'inventory_summary', 'customer_summary'];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') errors.push(`Missing required field: ${field}`);
  }
  if (errors.length) return { isValid: false, errors, warnings, validatedData: null };

  const authRevenue = context.sales.total_revenue;
  const authOrders = context.sales.total_orders;
  const authAov = context.sales.average_order_value;
  const authCustomers = context.customers.active_customers;

  const summaryFields = [
    ['executive_summary', data.executive_summary],
    ['risks', data.risks],
    ['recommendations', data.recommendations]
  ] as const;

  const sanitizedNarratives: Record<string, string> = {};
  for (const [field, value] of summaryFields) {
    const result = sanitizeNarrative(value, context);
    sanitizedNarratives[field] = result.text;
    if (result.changed) warnings.push(`Sanitized unsupported or unverified claims from ${field}.`);
  }

  const revenueSummary = {
    title: typeof data.revenue_summary?.title === 'string' ? data.revenue_summary.title : 'Revenue Summary',
    highlight: `Revenue: SAR ${authRevenue.toLocaleString()}`,
    text: `Authoritative revenue aggregated at SAR ${authRevenue.toLocaleString()} across ${authOrders.toLocaleString()} orders (AOV: SAR ${authAov.toFixed(2)}).`
  };

  const inventorySummary = {
    title: typeof data.inventory_summary?.title === 'string' ? data.inventory_summary.title : 'Inventory Summary',
    highlight: `Low Stock Alerts: ${context.inventory.low_stock_count}`,
    text: `Inventory monitoring active. Low stock SKU count: ${context.inventory.low_stock_count}.`
  };

  const customerSummary = {
    title: typeof data.customer_summary?.title === 'string' ? data.customer_summary.title : 'Customer Summary',
    highlight: `Active Customers: ${authCustomers.toLocaleString()}`,
    text: `Active customer base recorded at ${authCustomers.toLocaleString()} verified customers.`
  };

  // Summary objects supplied by the LLM are not trusted for numerical values.
  // All authoritative numbers are rebuilt from the server context.
  const validatedBriefing = {
    briefing_type: ['Daily', 'Weekly', 'Monthly'].includes(data.briefing_type) ? data.briefing_type : 'Daily',
    executive_summary: sanitizedNarratives.executive_summary,
    risks: sanitizedNarratives.risks,
    recommendations: sanitizedNarratives.recommendations,
    revenue_summary: revenueSummary,
    inventory_summary: inventorySummary,
    customer_summary: customerSummary,
    source_type: 'ai_generated',
    generation_context: { ...context },
    data_period: context.metadata.data_period,
    data_as_of: context.metadata.data_as_of,
    generated_at: new Date().toISOString(),
    ai_model: 'gemini-3.8-flash',
    verification_status: 'verified'
  };

  return { isValid: true, errors: [], warnings, validatedData: validatedBriefing };
}
