// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { deck } from '../../../data/deck';
import { Decks } from '../../../models';
import { shuffle } from '../../../utils/array';

// TODO: unused api, remove?
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
