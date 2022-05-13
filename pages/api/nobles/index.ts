// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Noble } from '../../../models';
import { shuffle } from '../../../utils/array';
import { nobleDeck } from '../../../data/nobleDeck';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Noble[]>
) {
  if (req.method === 'GET') {
    shuffle(nobleDeck);
    res.status(200).json(nobleDeck);
  }
}
