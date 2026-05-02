import { Request, Response } from 'express';
import axios from 'axios';
import { GROQ_API_KEY, GROQ_MODEL } from '@common/config/env.js';
import { getAuthCookies } from '@common/config/cookie-config.js';
import { throwBffError } from '@common/util/response-handler.js';

type ExpenseType = 'RECEIPT' | 'PER_DIEM' | 'MILEAGE' | 'EXPENSE_SUMMARY';

function buildPrompt(type: ExpenseType, context: Record<string, unknown>): string {
  const base = `You are a concise expense policy assistant. Given expense details, write exactly 1-2 sentences of practical, context-aware policy insight. Be specific to the numbers provided. No bullet points. No greetings.`;

  if (type === 'RECEIPT') {
    return `${base}\n\nExpense: Receipt\nVendor: ${context.vendor || 'Unknown'}\nAmount: €${context.amount || 0}\nVAT: €${context.vatAmount || 0} (${context.vatRate || 'N/A'})\nCategory: ${context.category || 'Uncategorized'}\nAI flags: ${context.flags || 'none'}`;
  }
  if (type === 'PER_DIEM') {
    return `${base}\n\nExpense: Per Diem\nDestination: ${context.country || 'Unknown'}\nDaily rate: €${context.rate || 0}\nDuration: ${context.days || 0} days (${context.from} → ${context.to})`;
  }
  if (type === 'MILEAGE') {
    return `${base}\n\nExpense: Mileage\nRoute: ${context.from || '?'} → ${context.to || '?'}\nDistance: ${context.distance || 0} km\nRate: €${context.rate || 0.3}/km\nTotal: €${context.total || 0}`;
  }
  if (type === 'EXPENSE_SUMMARY') {
    const change = context.mtdChange != null
      ? `${Number(context.mtdChange) > 0 ? '+' : ''}${context.mtdChange}% vs last month`
      : 'first month on record';
    return `You are a concise financial advisor for corporate expense management. Given the employee's spending summary, write exactly 2 lines:\nLine 1: A punchy, specific insight or actionable tip (max 12 words) grounded in the numbers.\nLine 2: One supporting sentence with context or reasoning.\nNo labels. No "Line 1:" prefix. No markdown.\n\nSpending summary:\n- Spent this month: €${context.mtd || 0} (${change})\n- Pending approval: ${context.pendingCount || 0} items (€${context.pendingAmount || 0})\n- Reimbursed this year: €${context.reimbursedYTD || 0}\n- Rejected: ${context.rejectedCount || 0}\n- Top category: ${context.topCategory || 'N/A'}`;
  }
  return base;
}

export const handle = async (req: Request, res: Response) => {
  const tokens = getAuthCookies(req.cookies || {});
  if (!tokens) return throwBffError('Unauthorized', 401);

  const { type, context } = req.body as { type: ExpenseType; context: Record<string, unknown> };
  if (!type || !context) return throwBffError('type and context are required', 400);

  if (!GROQ_API_KEY) return throwBffError('Groq not configured', 503);

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: buildPrompt(type, context) }],
        max_tokens: type === 'EXPENSE_SUMMARY' ? 120 : 100,
        temperature: 0.4,
      },
      {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        timeout: 8000,
      },
    );

    const insight: string = response.data?.choices?.[0]?.message?.content?.trim() ?? '';
    return res.status(200).json({ insight });
  } catch {
    return res.status(200).json({ insight: '' });
  }
};
