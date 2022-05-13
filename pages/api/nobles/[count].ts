// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { nobleDeck } from '../../../data/nobles';
import { Noble } from '../../../models';
import { shuffle } from '../../../utils/array';

type ErrorApi = {
  code: number;
  message: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Noble[] | ErrorApi>
) {
  const { count } = req.query;
  if (!count || Number.isNaN(Number(count)) || Number(count) as number < 3 || Number(count) > 5) {
    res.status(404).json({ code: 404, message: "Valid Noble Count not found.  Indicate A numerical value from 3 to 5, depending on how many players are in the game." });
    return;
  }
  if (req.method === 'GET') {
    shuffle(nobleDeck);
    res.status(200).json(nobleDeck.slice(0, Number(count)));
  }
}
