export enum Gem {
  Emerald,
  Sapphire,
  Ruby,
  Diamond,
  Onyx,
  Gold,
}

export type NonGoldGem = Exclude<Gem, Gem.Gold>;

export type Card = {
  level: 1 | 2 | 3,
  gem: NonGoldGem,
  points: 0 | 1 | 2 | 3 | 4 | 5,
  cost: NonGoldGem[],
}

export type Noble = {
  points: 3,
  cardCost: NonGoldGem[]
}