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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, margin: '16px 0 24px', textAlign: 'center' }}>
        {process.env.NEXT_PUBLIC_QUIZ_TITLE || '社員旅行宴会アンケート'}
      </h1>

      <div style={{ margin: '24px 0' }}>
        <p style={{ margin: '16px 0', lineHeight: 1.8 }}>
          このアンケートは社員旅行の宴会で使用します。回答は匿名で保存されます。
        </p>
        <p style={{ margin: '16px 0', lineHeight: 1.8 }}>
          全部で {total ?? 8} 問あります。所要時間は数分です。
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('quiz_started', '1');
              window.location.href = '/';
            }
          }}
          style={{
            padding: '12px 28px',
            fontSize: 18,
            cursor: 'pointer',
            borderRadius: 8,
            border: '1px solid #ccc',
            background: '#0ea5e9',
            color: '#fff',
          }}
        >
          開始する
        </button>
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        {/* 画像ファイルは public/cheers.png に配置してください */}
        <img
          src="/cheers.png"
          alt="乾杯イラスト"
          style={{ maxWidth: '60%', height: 'auto', maxHeight: 320, objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
