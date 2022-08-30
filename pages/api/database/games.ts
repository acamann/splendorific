// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { saveGameToDB } from '../../../db/mongodb';
import { GameState } from '../../../gameState';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const gameState: GameState = req.body;
    await saveGameToDB({
      players: gameState.players.map(p => ({
        name: p.name,
        points: p.points,
        cards: {
          level1: p.cards.filter(c => c.level === 1).length,
          level2: p.cards.filter(c => c.level === 2).length,
          level3: p.cards.filter(c => c.level === 3).length 
        },
        nobles: p.nobles.length,
        aiExperience: p.aiExperience
      })),
      log: gameState.log
    });
    res.status(201).end();
  } else {
    res.status(405).end();
  }
}
