// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { queueSimulations } from '../../../db/mongodb';

const NUMBER_OF_GAMES = 100;
const PLAYER_EXPERIENCE_BASELINES = [
  [1, 0],
  [0, 1, 0],
  [1, 0, 0, 0],
  [0, 0, 0, 1],
  [1, 1],
  [0, 0],
  [1, 1, 1],
  [0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 0],
  [0.5, 0.5],
  [0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5, 0.5],
  [0.25, 0.75],
  [1, 1, 0],
  [1, 1, 0, 0],
  [1, 1, 1, 0],
  [1, 0.5, 0.5, 0],
  [1, 0.5, 0, 0],
  [1, 0.75, 0.5, 0.25]
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // queue simulations to DB
    await queueSimulations(PLAYER_EXPERIENCE_BASELINES.map(playerExperiences => {
      return {
        games: NUMBER_OF_GAMES,
        players: playerExperiences.map(aiExperience => {
          return {
            aiExperience
          }
        })
      }
    }));
    return res.status(202).end();
  } else {
    return res.status(405).end();
  }
}
