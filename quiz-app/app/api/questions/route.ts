import { NextResponse } from 'next/server';
import { fetchQuestions } from '@/lib/notion';

export async function GET() {
  try {
    const questions = await fetchQuestions();
    return NextResponse.json({ questions });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
