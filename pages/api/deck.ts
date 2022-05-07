// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Card, Gem, NonGoldGem } from '../../models';
import cards from '../../data/cards.json';

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

const shuffle = (array: Card[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
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
  ] as NonGoldGem[]
}));

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ one: Card[], two: Card[], three: Card[] }>
) {
  if (req.method === 'GET') {
    shuffle(deck);
    res.status(200).json({
      one: deck.filter(card => card.level === 1),
      two: deck.filter(card => card.level === 2),
      three: deck.filter(card => card.level === 3)
    });
  }
}
