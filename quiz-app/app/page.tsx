"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

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
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // 先にローカルの進捗を仮復元して初期レンダで先頭に戻らないようにする
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quiz_progress_index');
      const savedIndex = saved ? parseInt(saved, 10) : 0;
      if (!Number.isNaN(savedIndex)) {
        setIndex(savedIndex);
      }
    }

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
          if (clamped >= qs.length && typeof window !== 'undefined') {
            // すでに全問回答済みなら即リダイレクト
            window.location.href = '/result';
            return;
          }
        }
        hasRestoredRef.current = true;
      } catch (e) {
        setError('読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clientId = useMemo(() => (typeof window !== 'undefined' ? getOrCreateClientId() : ''), []);

  // インデックスが変わるたびに確実に保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 初期復元が完了するまで保存しない（0で上書きされるのを防止）
      if (hasRestoredRef.current) {
        localStorage.setItem('quiz_progress_index', String(index));
      }
    }
  }, [index]);

  // 完了済みかどうかは progress のみで判定（quiz_completed は不要）

  async function answer(choiceIndex: 0 | 1 | 2) {
    if (!questions) return;
    const q = questions[index];
    try {
      // 先に進捗を前進させて保存し、失敗時はロールバック
      const next = index + 1;
      setIndex(next);
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, choiceIndex, clientId })
      });
      if (!res.ok) {
        // 送信失敗。元に戻す
        setIndex((i) => Math.max(0, i - 1));
        throw new Error('submit failed');
      }
    } catch {
      alert('送信に失敗しました');
    }
  }

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>{error}</p>;
  if (!questions || questions.length === 0) return <p>有効な質問がありません。</p>;

  if (index >= questions.length) {
    if (typeof window !== 'undefined') {
      // 完了後は進捗のみ保持（設問数以上なら常に /result へ）
      localStorage.setItem('quiz_progress_index', String(questions.length));
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


