### README — 社員旅行クイズ（Next.js + Notion + Vercel）

以下は、3択クイズを8問程度・約50名が回答する想定で、NotionをDBとして問題取得・匿名回答保存を行い、Vercelで公開するための手順と実装方針です。

---

## 概要

- **フロントエンド**: Next.js（App Router推奨）
- **データベース**: Notion Database（問題DB・回答DB）
- **回答**: 匿名でNotionに保存（IP/個人情報は保存しない）
- **デプロイ**: Vercel

---

## 仕様

- **クイズ形式**: 3択、約8問
- **同時アクセス規模**: 約50名
- **機能**
  - クイズ画面で質問と3択を順に表示
  - 回答送信ごとにNotionへ匿名保存
  - 一人1回想定（ブラウザ単位での簡易制御）
  - 最終結果画面で「回答完了」を表示（集計表示は任意）

---

## Notion 準備

1. Notionで「インテグレーション」を作成し、シークレットトークンを取得
   - Notion → Settings → Integrations → New integration
   - Internal Integration Token を控える

2. データベースを2つ作成し、インテグレーションを共有（Share → インテグレーション名 → Invite）

- 問題DB（Questions DB）
  - 推奨プロパティ
    - `Title`（タイトル／問題文）
    - `Choices`（リッチテキスト or マルチテキスト）…3択分を配列的に格納
    - `Order`（Number）…表示順
    - `Active`（Checkbox）…出題ON/OFF
- 回答DB（Responses DB）
  - 推奨プロパティ
    - `QuestionId`（Relation or Rich text）…問題ページIDまたは識別子
    - `ChoiceIndex`（Number）…0/1/2
    - `ClientId`（Rich text）…匿名クライアントID（Cookie/LocalStorage由来）
    - `Timestamp`（Created time）…自動

3. 各DBのIDを控える
   - DBページURLの `.../` 以降の英数字がDatabase ID

---

## 環境変数

Vercel/ローカル `.env.local` に設定

- `NOTION_TOKEN`：Notionインテグレーショントークン（必須）
- `NOTION_QUESTIONS_DB_ID`：問題DB ID（必須）
- `NOTION_RESPONSES_DB_ID`：回答DB ID（必須）
- `NEXT_PUBLIC_QUIZ_TITLE`：表示用タイトル（任意）

---

## セットアップ

1. プロジェクト作成
```bash
npx create-next-app@latest quiz-app --ts --eslint
cd quiz-app
```

2. 依存パッケージ
```bash
npm i @notionhq/client zod
```

3. 環境変数設定
- `quiz-app/.env.local` に上記の環境変数を設定

4. 開発起動
```bash
npm run dev
```

---

## ディレクトリ/実装方針

- `app/`（App Router）
  - `app/page.tsx`：クイズ開始〜進行UI
  - `app/result/page.tsx`：完了画面
- `app/api/questions/route.ts`：問題取得（GET）
- `app/api/answer/route.ts`：回答保存（POST）
- `lib/notion.ts`：NotionクライアントとCRUD
- `lib/types.ts`：型定義（Question/Answer）

---

## API 設計

- GET `/api/questions`
  - 概要: 有効な問題一覧を取得（`Active = true`、`Order`昇順）
  - レスポンス例:
    ```json
    {
      "questions": [
        {
          "id": "notion-page-id",
          "title": "質問文",
          "choices": ["A", "B", "C"],
          "order": 1
        }
      ]
    }
    ```

- POST `/api/answer`
  - 概要: 回答1件を保存
  - リクエスト:
    ```json
    {
      "questionId": "notion-page-id",
      "choiceIndex": 0,
      "clientId": "anonymous-uuid"
    }
    ```
  - レスポンス:
    ```json
    { "ok": true }
    ```

- セキュリティ/制限
  - レートリミット（IP/ClientIdあたり）を簡易実装（50名規模のため軽量で可）
  - CSRFは同一オリジンAPIのため最小限。必要に応じてOrigin/Referer検証

---

## フロントエンドUI方針

- 初回アクセス時に `clientId` を `localStorage` に発行・保存（UUID）
- `/api/questions` を取得し、1問ずつ3択ボタンで回答
- 選択時に `/api/answer` へPOSTして次の問題へ
- 全問終了で `/result` に遷移
- 再回答抑止は `clientId` のメモリ/LocalStorageで簡易制御（強制はしない）

---

## Vercel デプロイ

1. リポジトリをGitHubへプッシュ
2. VercelでNew Project → リポジトリ選択
3. Environment Variables に以下を設定
   - `NOTION_TOKEN`
   - `NOTION_QUESTIONS_DB_ID`
   - `NOTION_RESPONSES_DB_ID`
   - `NEXT_PUBLIC_QUIZ_TITLE`（任意）
   - `QUIZ_ID`
4. Deploy
5. デプロイ後、ブラウザで動作確認

---

## 運用と注意

- **同時50名**: Next.js + Edge Runtime不要、標準Nodeで十分。APIは1件/回答の書き込みでOK
- **Notion レート制限**: 3リクエスト/秒/インテグレーション程度。回答はスロットリングを考慮し、フロントで軽いリトライを実装可
- **可観測性**: Vercel Logs でAPIエラー監視。必要に応じてSentryなど導入
- **問題編集**: Notion上で `Active`/`Order` を適宜調整。デプロイ不要で反映

---

## 参考コード構成（抜粋の擬似インタフェース）

```ts
// lib/types.ts
export type Question = {
  id: string;
  title: string;
  choices: string[]; // length = 3
  order: number;
};

export type AnswerPayload = {
  quizId: string;
  questionId: string;
  choiceIndex: 0 | 1 | 2;
  clientId: string; // anonymous id
};
```

```ts
// lib/notion.ts
import { Client } from '@notionhq/client';

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function fetchQuestions(): Promise<Question[]> { /* Notionクエリ */ }
export async function createResponse(payload: AnswerPayload): Promise<void> { /* Notion作成 */ }
```

---

## よくあるハマりどころ

- DBをインテグレーションに共有し忘れる → 403エラー
- `NOTION_***_DB_ID` がページIDではなくDB IDであることを確認
- `Choices` フィールドの型がNotion上で一致しているか（リッチテキスト推奨）
- 本番環境の環境変数をVercelに設定し忘れ

---

## ライセンス

社内用途につき適宜。

---

必要であれば、Notionプロパティ名/型に合わせた具体的な実装雛形（APIルート/コンポーネント）も提供します。


