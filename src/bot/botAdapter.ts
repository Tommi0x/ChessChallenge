export type BotMove = {
  from: string;
  to: string;
  promotion?: string;
};

export type BotAdapter = {
  getMove(fen: string, skillLevel: number): Promise<BotMove>;
};
