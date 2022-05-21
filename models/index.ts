export enum Gem {
  Emerald,
  Sapphire,
  Ruby,
  Diamond,
  Onyx,
  Gold,
}

export const ALL_GEMS = (Object.keys(Gem)
  .filter(key => isNaN(Number(key))) as (keyof typeof Gem)[])
  .map(key => Gem[key]);

export type NonGoldGem = Exclude<Gem, Gem.Gold>;

export type Bank = { [gem in Gem]: number }

export const EMPTY_BANK: Bank = {
  [Gem.Diamond]: 0,
  [Gem.Onyx]: 0,
  [Gem.Emerald]: 0,
  [Gem.Ruby]: 0,
  [Gem.Sapphire]: 0,
  [Gem.Gold]: 0,
}

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

export type Player = {
  bank: Bank;
  cards: Card[];
  nobles: Noble[];
}