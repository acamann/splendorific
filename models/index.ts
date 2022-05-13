export enum Gem {
  Emerald,
  Sapphire,
  Ruby,
  Diamond,
  Onyx,
  Gold,
}

export type NonGoldGem = Exclude<Gem, Gem.Gold>;

export type Level = 1 | 2 | 3;

export type Card = {
  level: Level,
  gem: NonGoldGem,
  points: 0 | 1 | 2 | 3 | 4 | 5,
  cost: NonGoldGem[],
  imageId: number,
}

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