import { NextResponse } from 'next/server';
import { fetchQuestions } from '@/lib/notion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[GET /api/questions] invoked at', new Date().toISOString());
    const questions = await fetchQuestions();
    if (!questions || questions.length === 0) {
      console.warn('[GET /api/questions] No active questions found. Hints: ensure properties Title(Name), Choices, Order(Number), Active(Checkbox) exist and Active=true rows are present. Also confirm NOTION_QUESTIONS_DB_ID and integration share. DB:', process.env.NOTION_QUESTIONS_DB_ID);
    }
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('[GET /api/questions] Failed to fetch questions:', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
