// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { takeTurnAI } from '../../../ai';
import { getRandomGame, initialPlayerState } from '../../../gameState';
import { Player } from '../../../models';

interface SimulatedPlayerRequest {
  experience: number;
}

interface SimulationRequest {
  games: number;
  players:
    [SimulatedPlayerRequest, SimulatedPlayerRequest]
    | [SimulatedPlayerRequest, SimulatedPlayerRequest, SimulatedPlayerRequest]
    | [SimulatedPlayerRequest, SimulatedPlayerRequest, SimulatedPlayerRequest, SimulatedPlayerRequest];
}

interface SimulationResponse {
  games: number;
  players: {
    experience: number;
    wins: number;
    winPercentage: number;
    averagePoints: number;
    averageNobles: number;
  }[];
  averageTurns?: number;
  failures?: string[];
  gameLog?: string[][]
}

interface ErrorResponse {
  error: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimulationResponse | ErrorResponse>
) {
  if (req.method === 'POST') {
    const verbose = req.query["verbose"] === "true";

    // for now run the simulation & wait on the result before responding
    const simulationRequest: SimulationRequest = req.body;
    if (!simulationRequest.games || simulationRequest.games <= 0) {
      res.status(400).json({ error: "'games': positive number of games required in request body" });
    }
    if (!simulationRequest.players) {
      res.status(400).json({ error: "'players': player configuration required for 2 to 4 players in request body" });
    }

    const wins: number[] = Array(simulationRequest.players.length).fill(0);
    let averagePoints: number[] = Array(simulationRequest.players.length).fill(0);
    let averageNobles: number[] = Array(simulationRequest.players.length).fill(0);
    const failures: string[] = [];
    const gameLog: string[][] = [];
    const turns: number[] = [];
    for (let gameIndex = 0; gameIndex < simulationRequest.games; gameIndex++)
    {
      try {
        let gameTurn = 0;
        const simulationPlayers: Player[] = simulationRequest.players.map((p, i) => {
          return {
            ...initialPlayerState,
            name: `Player ${i + 1}`,
            aiExperience: p.experience
          }
        })
        let game = getRandomGame(simulationPlayers);
        while (game.winningPlayerIndex === undefined) {
          if (game.currentPlayerIndex === 0) {
            gameTurn++;
          }

          const currentPlayerExperience = simulationRequest.players[game.currentPlayerIndex].experience;
          game = takeTurnAI(game, currentPlayerExperience);
        }
        const winningPlayerIndex = game.winningPlayerIndex;
        const winner = game.players[winningPlayerIndex];
        game.log.push(`${winner.name} wins with ${winner.points} points!`);

        averagePoints = averagePoints.map((runningAverage, playerIndex) => 
          ((runningAverage * gameIndex) + game.players[playerIndex].points) / (gameIndex + 1));
        averageNobles = averageNobles.map((runningAverage, playerIndex) => 
          ((runningAverage * gameIndex) + game.players[playerIndex].nobles.length) / (gameIndex + 1));

        wins[winningPlayerIndex]++;
        turns.push(gameTurn);
        gameLog.push(game.log);
      } catch (e: any) {
        failures.push(e.message);
        gameIndex--;
      }
    }

    res.status(200).json({
      games: simulationRequest.games,
      players: simulationRequest.players.map((player, playerIndex) => ({
        experience: player.experience,
        wins: wins[playerIndex],
        winPercentage: wins[playerIndex] / simulationRequest.games,
        averagePoints: averagePoints[playerIndex],
        averageNobles: averageNobles[playerIndex]
      })),
      averageTurns: turns.reduce((a, b) => a + b) / turns.length,
      failures: failures.length > 0 ? failures : undefined,
      gameLog: verbose ? gameLog : undefined
    });
  } else {
    res.status(405).end();
  }
}
