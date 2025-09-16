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
    const title = page.properties.Title?.title?.[0]?.plain_text ?? '';
    const choicesProp = page.properties.Choices;
    const choices: string[] =
      choicesProp?.type === 'rich_text'
        ? choicesProp.rich_text.map((t: any) => t.plain_text)
        : choicesProp?.type === 'multi_select'
          ? choicesProp.multi_select.map((s: any) => s.name)
          : [];

    const order = page.properties.Order?.number ?? 0;
    return {
      id: page.id,
      title,
      choices: [choices[0] ?? '', choices[1] ?? '', choices[2] ?? ''] as [string, string, string],
      order
    };
  });

  return questions;
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


