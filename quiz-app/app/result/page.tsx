export default function ResultPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, paddingTop: 50, paddingBottom: 50 }}>ご回答ありがとうございました！</h1>
      <p style={{ margin: '16px 0', lineHeight: 1.8 }}>楽しい社員旅行にしましょう！</p>
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <img
          src="/thanks.png"
          alt="感謝イラスト"
          style={{ maxWidth: '60%', height: 'auto', maxHeight: 320, objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
