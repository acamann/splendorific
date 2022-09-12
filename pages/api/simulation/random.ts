// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { queueSimulations } from '../../../db/mongodb';

const NUMBER_OF_SIMULATIONS = 100;
const NUMBER_OF_GAMES_PER_SIMULATION = 100;

const getRandomPlayerConfiguration = (): { aiExperience: number }[] => {
  const numberOfPlayers = Math.floor(Math.random() * (4 - 2 + 1) + 2); // (max - min + 1) + min
  return Array.from({ length: numberOfPlayers }, () => ({ aiExperience: Math.random() }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // queue simulations to DB
    await queueSimulations(Array.from({ length: NUMBER_OF_SIMULATIONS }, () => ({
        games: NUMBER_OF_GAMES_PER_SIMULATION,
        players: getRandomPlayerConfiguration()
      })
    ));
    return res.status(202).end();
  } else {
    return res.status(405).end();
  }
}
