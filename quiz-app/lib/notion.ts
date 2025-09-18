import { Client } from '@notionhq/client';
import { Question, AnswerPayload } from './types';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const QUESTIONS_DB_ID = process.env.NOTION_QUESTIONS_DB_ID as string;
const RESPONSES_DB_ID = process.env.NOTION_RESPONSES_DB_ID as string;

export async function fetchQuestions(): Promise<Question[]> {
  const response = await notion.databases.query({
    database_id: QUESTIONS_DB_ID,
    sorts: [{ property: 'Order', direction: 'ascending' }],
    filter: {
      and: [
        { property: 'Active', checkbox: { equals: true } }
      ]
    }
  });

  const questions: Question[] = response.results.map((page: any) => {
    // タイトル列は名称が Name/タイトル/Title などの場合があるため自動検出
    const titleProp = page.properties.Title?.type === 'title'
      ? page.properties.Title
      : Object.values<any>(page.properties).find((p: any) => p?.type === 'title');
    const title = (titleProp?.title || []).map((t: any) => t.plain_text).join('').trim();

    // 新仕様: Choice1 / Choice2 / Choice3（Rich text推奨）
    const readText = (prop: any): string => {
      if (!prop) return '';
      if (prop.type === 'rich_text') return (prop.rich_text || []).map((t: any) => t.plain_text).join('').trim();
      if (prop.type === 'select') return prop.select?.name ?? '';
      if (prop.type === 'multi_select') return (prop.multi_select || []).map((s: any) => s.name).join(',').trim();
      if (prop.type === 'title') return (prop.title || []).map((t: any) => t.plain_text).join('').trim();
      return '';
    };

    const choice1 = readText(page.properties.Choice1);
    const choice2 = readText(page.properties.Choice2);
    const choice3 = readText(page.properties.Choice3);

    // 旧仕様: Choices（rich_text または multi_select）フォールバック
    const legacy = page.properties.Choices;
    const legacyChoices: string[] = legacy?.type === 'rich_text'
      ? (legacy.rich_text || []).map((t: any) => t.plain_text)
      : legacy?.type === 'multi_select'
        ? (legacy.multi_select || []).map((s: any) => s.name)
        : [];

    const choices = [
      choice1 || legacyChoices[0] || '',
      choice2 || legacyChoices[1] || '',
      choice3 || legacyChoices[2] || ''
    ] as [string, string, string];

    const order = page.properties.Order?.number ?? 0;
    const customQuestionId = readText(page.properties.QuestionId) || '';
    
    // 画像URL取得（Files & Media プロパティ）
    const imageProp = page.properties.Image || page.properties.画像;
    const imageUrl = imageProp?.type === 'files' && imageProp.files?.length > 0 
      ? imageProp.files[0].file?.url || imageProp.files[0].external?.url
      : undefined;
    
    return {
      // 優先: 質問DBの QuestionId（Rich text）。未設定なら Notion ページID。
      id: customQuestionId || page.id,
      title,
      choices,
      order,
      imageUrl
    };
  });

  return questions;
}

export async function createResponse(payload: AnswerPayload): Promise<void> {
  await notion.pages.create({
    parent: { database_id: RESPONSES_DB_ID },
    properties: {
      QuestionId: {
        title: [{ type: 'text', text: { content: payload.questionId } }]
      },
      ChoiceIndex: { number: payload.choiceIndex },
      ClientId: {
        rich_text: [{ type: 'text', text: { content: payload.clientId } }]
      }
    }
  });
}
