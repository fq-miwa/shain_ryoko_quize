export default function ResultPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, paddingTop: 40, textAlign: 'center' }}>ご回答ありがとうございました！</h1>
      <p style={{ margin: '16px 0', lineHeight: 1.8, textAlign: 'center' }}>楽しい社員旅行にしましょう！</p>
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <img
          src="/thanks.png"
          alt="感謝イラスト"
          style={{ maxWidth: '60%', height: 'auto', maxHeight: 320, objectFit: 'contain' }}
        />
      </div>
      <p style={{ position: 'absolute', bottom: 10, right: 30 }}>このアプリ製作裏話は
        <a href="https://4qualia.docbase.io/posts/3928966" target="_blank" rel="noopener noreferrer">こちら・・・</a>
      </p>
    </div>
  );
}
