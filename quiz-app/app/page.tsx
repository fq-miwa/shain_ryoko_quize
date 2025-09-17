"use client";

import { useEffect, useMemo, useState } from 'react';

type Question = {
  id: string;
  title: string;
  choices: [string, string, string];
  order: number;
};

function getOrCreateClientId(): string {
  const key = 'quiz_client_id';
  const existing = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (existing) return existing;
  const uuid = crypto.randomUUID();
  localStorage.setItem(key, uuid);
  return uuid;
}

export default function Page() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/questions', { cache: 'no-store' });
        const data = await res.json();
        const qs = data.questions as Question[];
        setQuestions(qs);
        // 保存済みの進捗を復元
        const saved = typeof window !== 'undefined' ? localStorage.getItem('quiz_progress_index') : null;
        const savedIndex = saved ? parseInt(saved, 10) : 0;
        if (!Number.isNaN(savedIndex)) {
          const clamped = Math.max(0, Math.min(savedIndex, qs.length));
          setIndex(clamped);
        }
      } catch (e) {
        setError('読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clientId = useMemo(() => (typeof window !== 'undefined' ? getOrCreateClientId() : ''), []);

  async function answer(choiceIndex: 0 | 1 | 2) {
    if (!questions) return;
    const q = questions[index];
    try {
      await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, choiceIndex, clientId })
      });
      setIndex((i) => {
        const next = i + 1;
        if (typeof window !== 'undefined') {
          localStorage.setItem('quiz_progress_index', String(next));
        }
        return next;
      });
    } catch {
      alert('送信に失敗しました');
    }
  }

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>{error}</p>;
  if (!questions || questions.length === 0) return <p>有効な質問がありません。</p>;

  if (index >= questions.length) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quiz_progress_index');
      window.location.href = '/result';
    }
    return null;
  }

  const q = questions[index];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{process.env.NEXT_PUBLIC_QUIZ_TITLE || '社員旅行アンケート'}</h1>
      <div style={{ margin: '16px 0', color: '#666' }}>質問 {index + 1} / {questions.length}</div>
      <div style={{ fontSize: 20, marginBottom: 16 }}>{q.title}</div>
      <div style={{ display: 'grid', gap: 12 }}>
        {q.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => answer(i as 0 | 1 | 2)}
            style={{ padding: '12px 16px', fontSize: 16, cursor: 'pointer' }}
          >
            {c || `選択肢${i + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
}


