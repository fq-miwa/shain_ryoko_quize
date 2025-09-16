import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createResponse } from '@/lib/notion';

const AnswerSchema = z.object({
  questionId: z.string().min(1),
  choiceIndex: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  clientId: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const payload = AnswerSchema.parse(json);
    await createResponse(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid payload', details: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}


