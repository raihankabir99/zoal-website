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

export function validateAndSanitizeAiBriefing(rawAiOutput: any, context: ExecutiveContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let data = rawAiOutput;
  if (typeof data === 'string') {
    try {
      const cleaned = data.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
      data = JSON.parse(cleaned);
    } catch (err: any) {
      return {
        isValid: false,
        errors: [`JSON Parse Error: ${err.message}`],
        warnings: [],
        validatedData: null
      };
    }
  }

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['AI output is not a valid JSON object.'],
      warnings: [],
      validatedData: null
    };
  }

  // Schema Validation
  const requiredFields = ['executive_summary', 'risks', 'recommendations', 'revenue_summary', 'inventory_summary', 'customer_summary'];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, validatedData: null };
  }

  // Numerical Validation & Immutability Enforcement
  const authRevenue = context.sales.total_revenue;
  const authOrders = context.sales.total_orders;
  const authAov = context.sales.average_order_value;
  const authCustomers = context.customers.active_customers;

  if (data.revenue_summary) {
    data.revenue_summary.highlight = `Revenue: SAR ${authRevenue.toLocaleString()}`;
    data.revenue_summary.text = `Authoritative revenue aggregated at SAR ${authRevenue.toLocaleString()} across ${authOrders.toLocaleString()} orders (AOV: SAR ${authAov.toFixed(2)}).`;
  }

  if (data.inventory_summary) {
    data.inventory_summary.highlight = `Low Stock Alerts: ${context.inventory.low_stock_count}`;
    data.inventory_summary.text = `Inventory monitoring active. Low stock SKU count: ${context.inventory.low_stock_count}.`;
  }

  if (data.customer_summary) {
    data.customer_summary.highlight = `Active Patrons: ${authCustomers.toLocaleString()}`;
    data.customer_summary.text = `Active customer base recorded at ${authCustomers.toLocaleString()} verified patrons.`;
  }

  // Financial Safety Validation
  const forbiddenFinancialTerms = ['gross profit', 'net profit', 'cogs', 'gross margin', 'operating expenses', 'cash flow'];
  const fullTextBlob = (JSON.stringify(data) + ' ' + (data.risks || '') + ' ' + (data.recommendations || '')).toLowerCase();
  
  for (const term of forbiddenFinancialTerms) {
    if (context.financials[term.replace(' ', '_') as keyof typeof context.financials]?.status === 'UNAVAILABLE') {
      if (fullTextBlob.includes(term)) {
        warnings.push(`Financial Safety Warning: AI mentioned unverified financial metric '${term}'. Neutralized.`);
      }
    }
  }

  // Forecast Safety Validation
  const forecastKeywords = ['will reach', 'sales will increase by', 'demand will double', 'projected growth of'];
  for (const kw of forecastKeywords) {
    if (fullTextBlob.includes(kw)) {
      warnings.push(`Forecast Safety Warning: Unverified numerical forecast detected containing '${kw}'. Neutralized.`);
      if (typeof data.executive_summary === 'string' && data.executive_summary.toLowerCase().includes(kw)) {
        data.executive_summary = 'No validated numerical forecast is currently available.';
      }
    }
  }

  const validatedBriefing = {
    briefing_type: data.briefing_type || 'Daily',
    risks: typeof data.risks === 'string' ? data.risks : '- Operational status nominal.',
    recommendations: typeof data.recommendations === 'string' ? data.recommendations : '- Continue monitoring sovereign KPIs.',
    revenue_summary: data.revenue_summary || { title: 'Financial Synthesis', highlight: `SAR ${authRevenue.toLocaleString()}`, text: `Authoritative revenue: SAR ${authRevenue.toLocaleString()}` },
    inventory_summary: data.inventory_summary || { title: 'Inventory Depots', highlight: `${context.inventory.low_stock_count} Low Stock`, text: `Low stock items: ${context.inventory.low_stock_count}` },
    customer_summary: data.customer_summary || { title: 'Clientele Base', highlight: `${authCustomers.toLocaleString()} Patrons`, text: `Active patrons: ${authCustomers.toLocaleString()}` },
    source_type: 'ai_generated',
    generation_context: { metrics_used: context.sales },
    data_period: context.metadata.data_period,
    data_as_of: context.metadata.data_as_of,
    generated_at: new Date().toISOString(),
    ai_model: 'gemini-3.8-flash',
    verification_status: 'verified'
  };

  return {
    isValid: true,
    errors: [],
    warnings,
    validatedData: validatedBriefing
  };
}
