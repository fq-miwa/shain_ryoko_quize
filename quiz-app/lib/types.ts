export type Question = {
  id: string;
  title: string;
  choices: [string, string, string];
  order: number;
  imageUrl?: string;
};

export type AnswerPayload = {
  questionId: string;
  choiceIndex: 0 | 1 | 2;
  clientId: string;
};
