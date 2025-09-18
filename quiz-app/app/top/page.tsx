"use client";

import { useEffect, useState } from 'react';

export default function TopPage() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/questions', { cache: 'no-store' });
        const data = await res.json();
        setTotal((data.questions || []).length ?? null);
      } catch {}
    })();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>{process.env.NEXT_PUBLIC_QUIZ_TITLE || '社員旅行宴会用アンケート'}</h1>
      <p style={{ margin: '12px 0' }}>このアンケートは社員旅行の宴会で使用します。回答は匿名で保存されます。</p>
      <p style={{ margin: '12px 0' }}>全部で {total ?? 8} 問あります。所要時間は数分です。</p>
      <button
        onClick={() => { if (typeof window !== 'undefined') { localStorage.setItem('quiz_started', '1'); window.location.href = '/'; } }}
        style={{ padding: '12px 20px', fontSize: 16, cursor: 'pointer' }}
      >
        開始する
      </button>
    </div>
  );
}


