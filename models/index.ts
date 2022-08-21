export enum Gem {
  Emerald,
  Sapphire,
  Ruby,
  Diamond,
  Onyx,
  Gold,
}

export const getGemName = (gem: Gem): string => {
  switch (gem) {
    case Gem.Emerald: return "Emerald";
    case Gem.Sapphire: return "Sapphire";
    case Gem.Diamond: return "Diamond";
    case Gem.Ruby: return "Ruby";
    case Gem.Onyx: return "Onyx";
    case Gem.Gold: return "Gold";
  }
}

export const ALL_GEMS = (Object.keys(Gem)
  .filter(key => isNaN(Number(key))) as (keyof typeof Gem)[])
  .map(key => Gem[key]);

export type NonGoldGem = Exclude<Gem, Gem.Gold>;

export type Bank = { [gem in Gem]: number }

export type Level = 1 | 2 | 3;

export type Card = {
  level: Level,
  gem: NonGoldGem,
  points: 0 | 1 | 2 | 3 | 4 | 5,
  cost: NonGoldGem[],
  imageId: number,
}

export const cardToString = (card: Card): string => `Lev:${card.level}, Gem: ${card.gem}, Pts:${card.points}`;

export type Decks = {
  [level in Level]: Card[]
}

export type Noble = {
  points: 3,
  black: number,
  blue: number,
  red: number,
  white: number,
  green: number,
}

export type Player = {
  name: string;
  bank: Bank;
  cards: Card[];
  reserved: Card[];
  nobles: Noble[];
  points: number;
  aiExperience?: number;
}