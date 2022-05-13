
import cards from './cards.json';
import { Card, Gem, NonGoldGem } from "../models";
import { pickRandom } from "../utils/array";

type CardColor = "Black" | "Blue" | "White" | "Green" | "Red";

const getGemFromColor = (color: CardColor): NonGoldGem => {
  switch (color) {
    case "Black": return Gem.Onyx;
    case "Blue": return Gem.Sapphire;
    case "White": return Gem.Diamond;
    case "Green": return Gem.Emerald;
    case "Red": return Gem.Ruby;
  }
}

export const deck: Card[] = cards.map(card => ({
  level: card.Level as 1 | 2 | 3,
  gem: getGemFromColor(card.Color as CardColor),
  points: card.PV as 1 | 2 | 3 | 4 | 5,
  cost: [
    ...Array(card.Black).fill(Gem.Onyx),
    ...Array(card.Blue).fill(Gem.Sapphire),
    ...Array(card.White).fill(Gem.Diamond),
    ...Array(card.Green).fill(Gem.Emerald),
    ...Array(card.Red).fill(Gem.Ruby),
  ] as NonGoldGem[],
  imageId: pickRandom([0, 1, 2, 3, 4])
}));
