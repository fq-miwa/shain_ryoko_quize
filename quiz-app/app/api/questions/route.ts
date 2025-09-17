import { NextResponse } from 'next/server';
import { fetchQuestions } from '@/lib/notion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const questions = await fetchQuestions();
    return NextResponse.json(
      { questions },
      { headers: { 'cache-control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
