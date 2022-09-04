import { Decks, Noble } from "../models";

export const encodeInitialDecks = (decks: Decks, nobles: Noble[]): string => {
  const encodedDecks = [1, 2, 3].map(level => `${level}:${decks[level as 1 | 2 | 3].map(d => d.id).join(",")}`).join("|");
  const encodedNobles = `n:${nobles.map(n => n.id).join(",")}`;
  return `${encodedDecks}|${encodedNobles}`;
}