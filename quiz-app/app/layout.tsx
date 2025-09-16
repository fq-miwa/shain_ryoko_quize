export const metadata = {
  title: process.env.NEXT_PUBLIC_QUIZ_TITLE || '社員旅行アンケート',
  description: '3択アンケート'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}


