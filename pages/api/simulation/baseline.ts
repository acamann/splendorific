// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { takeTurnAI } from '../../../ai';
import { saveSimulationsToDB } from '../../../db/mongodb';
import { getRandomGame, initialPlayerState } from '../../../gameState';
import { Player } from '../../../models';

const NUMBER_OF_GAMES = 50;
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

interface SimulationResponse {
  games: number;
  players: {
    experience: number;
    wins: number;
    winPercentage: number;
    averagePoints: number;
    averageNobles: number;
  }[];
  averageTurns: number;
  failures?: string[];
  gameLog?: string[][];
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimulationResponse[] | ErrorResponse | {}>
) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST");
    return res.status(202).json({});
  } else if (req.method === 'POST') {

    const allSimulations = [];
    for (const playerExperiences of PLAYER_EXPERIENCE_BASELINES) {
      allSimulations.push(simulate(NUMBER_OF_GAMES, playerExperiences));
    }
    await saveSimulationsToDB(allSimulations);

    return res.status(200).json(allSimulations);
  } else {
    return res.status(405).end();
  }
}

const simulate = (numberOfGames: number, playerExperiences: number[]): SimulationResponse => {
  const numberOfPlayers = playerExperiences.length;
  const wins: number[] = Array(numberOfPlayers).fill(0);
  let averagePoints: number[] = Array(numberOfPlayers).fill(0);
  let averageNobles: number[] = Array(numberOfPlayers).fill(0);
  const failures: string[] = [];
  const turns: number[] = [];
  for (let gameIndex = 0; gameIndex < numberOfGames; gameIndex++)
  {
    try {
      let gameTurn = 0;
      const simulationPlayers: Player[] = playerExperiences.map((experience, i) => {
        return {
          ...initialPlayerState,
          name: `P${i + 1}`,
          aiExperience: experience
        }
      })
      let game = getRandomGame(simulationPlayers);
      while (game.winningPlayerIndex === undefined) {
        if (game.currentPlayerIndex === 0) {
          gameTurn++;
        }

        const currentPlayerExperience = playerExperiences[game.currentPlayerIndex];
        game = takeTurnAI(game, currentPlayerExperience);
      }
      const winningPlayerIndex = game.winningPlayerIndex;

      averagePoints = averagePoints.map((runningAverage, playerIndex) => 
        ((runningAverage * gameIndex) + game.players[playerIndex].points) / (gameIndex + 1));
      averageNobles = averageNobles.map((runningAverage, playerIndex) => 
        ((runningAverage * gameIndex) + game.players[playerIndex].nobles.length) / (gameIndex + 1));

      wins[winningPlayerIndex]++;
      turns.push(gameTurn);
    } catch (e: any) {
      failures.push(e.message);
      gameIndex--;
    }
  }

  return {
    games: numberOfGames,
    players: playerExperiences.map((experience, playerIndex) => ({
      experience: experience,
      wins: wins[playerIndex],
      winPercentage: wins[playerIndex] / numberOfGames,
      averagePoints: averagePoints[playerIndex],
      averageNobles: averageNobles[playerIndex]
    })),
    averageTurns: turns.reduce((a, b) => a + b) / numberOfGames,
    failures: failures.length > 0 ? failures : undefined,
  }
}