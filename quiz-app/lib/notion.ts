import { Client } from '@notionhq/client';
import { Question, AnswerPayload } from './types';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const QUESTIONS_DB_ID = process.env.NOTION_QUESTIONS_DB_ID as string;
const RESPONSES_DB_ID = process.env.NOTION_RESPONSES_DB_ID as string;

export async function fetchQuestions(): Promise<Question[]> {
  try {
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
      // タイトル型の列を自動検出（Titleが無ければ最初のtitleプロパティを探す）
      const titleProp = page.properties.Title?.type === 'title'
        ? page.properties.Title
        : Object.values<any>(page.properties).find((p: any) => p?.type === 'title');
      const title = titleProp?.title?.[0]?.plain_text ?? '';

      const choicesProp = page.properties.Choices;
      const choices: string[] =
        choicesProp?.type === 'rich_text'
          ? choicesProp.rich_text.map((t: any) => t.plain_text)
          : choicesProp?.type === 'multi_select'
            ? choicesProp.multi_select.map((s: any) => s.name)
            : [];

      const order = page.properties.Order?.number ?? 0;
      const result: Question = {
        id: page.id,
        title,
        choices: [choices[0] ?? '', choices[1] ?? '', choices[2] ?? ''] as [string, string, string],
        order
      };
      if (!title || result.choices.filter(Boolean).length < 1) {
        console.warn('[fetchQuestions] Skipping page due to missing fields', {
          pageId: page.id,
          hasTitle: Boolean(title),
          choicesLength: choices.length,
          properties: Object.keys(page.properties)
        });
      }
      return result;
    });

    return questions;
  } catch (error) {
    console.error('[fetchQuestions] Notion query failed', {
      db: QUESTIONS_DB_ID,
      error
    });
    throw error;
  }
}

export async function createResponse(payload: AnswerPayload): Promise<void> {
  await notion.pages.create({
    parent: { database_id: RESPONSES_DB_ID },
    properties: {
      QuestionId: {
        rich_text: [{ type: 'text', text: { content: payload.questionId } }]
      },
      ChoiceIndex: { number: payload.choiceIndex },
      ClientId: {
        rich_text: [{ type: 'text', text: { content: payload.clientId } }]
      }
    }
  });
}
