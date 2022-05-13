// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Card, Decks, Gem, NonGoldGem } from '../../models';
import cards from '../../data/cards.json';
import { pickRandom, shuffle } from '../../utils/array';

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

const getImageIdForGem = (gem: NonGoldGem): number => {
  switch (gem) {
    case Gem.Onyx: return pickRandom([1019, 1033, 1075, 1078]);
    case Gem.Sapphire: return pickRandom([1015, 1031, 1036, 1038, 1041]);
    case Gem.Diamond: return pickRandom([1000, 1021, 1035, 1052]);
    case Gem.Emerald: return pickRandom([1003, 101, 1012, 1039, 1053]);
    case Gem.Ruby: return pickRandom([1028, 1032, 1047, 1055, 1073]);
  }
}

const deck: Card[] = cards.map(card => ({
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
  imageId: getImageIdForGem(getGemFromColor(card.Color as CardColor))
}));

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Decks>
) {
  if (req.method === 'GET') {
    shuffle(deck);
    res.status(200).json({
      [1]: deck.filter(card => card.level === 1),
      [2]: deck.filter(card => card.level === 2),
      [3]: deck.filter(card => card.level === 3)
    });
  }
}
