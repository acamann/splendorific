// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { shuffle } from '../../../utils/array';
import { nobleDeck } from '../../../data/nobles';
import { deck } from '../../../data/deck';
import { Bank, Gem } from '../../../models';
import { takeTurnAI } from '../../../ai';
import { GameState, initialPlayerState, initialState } from '../../../gameState';

const getRandomGame = (players: 2 | 3 | 4): GameState => {
  const noblesCount = players + 1;
  shuffle(nobleDeck);
  shuffle(deck);

  let bankChips = 7;
  if (players === 3) {
    bankChips = 5;
  }
  if (players === 2) {
    bankChips = 4;
  }

  const bank: Bank = {
    [Gem.Diamond]: bankChips,
    [Gem.Onyx]: bankChips,
    [Gem.Emerald]: bankChips,
    [Gem.Ruby]: bankChips,
    [Gem.Sapphire]: bankChips,
    [Gem.Gold]: 7, // leave the gold chips alone
  }

  return {
    ...initialState,
    players: Array(players)
      .fill(initialPlayerState)
      .map((player, i) => ({
        ...player,
        name: `Player ${i + 1}`
      })),
    bank,
    nobles: nobleDeck.slice(0, noblesCount - 1),
    decks: {
      [1]: deck.filter(card => card.level === 1),
      [2]: deck.filter(card => card.level === 2),
      [3]: deck.filter(card => card.level === 3)
    },
    currentPlayerIndex: 0
  }
};

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
    const failures: string[] = [];
    const gameLog: string[][] = [];
    const turns: number[] = [];
    for (let i = 0; i < simulationRequest.games; i++)
    {
      try {
        // Should work like this... but doesn't
        // let gameTurn = 0;
        // let game = getRandomGame(simulationRequest.players.length);
        // while (!game.winningPlayerIndex) {
        //   if (game.currentPlayerIndex === 0) {
        //     gameTurn++;
        //   }

        //   const currentPlayerExperience = simulationRequest.players[game.currentPlayerIndex].experience
        //   game = takeTurnAI(game, currentPlayerExperience);
        // }
        // const winningPlayerIndex = game.winningPlayerIndex as number;
        // const winner = game.players[winningPlayerIndex];
        // game.log.push(`${winner.name} wins with ${winner.points} points!`);

        // wins[winningPlayerIndex]++;
        // turns.push(gameTurn);
        // gameLog.push(game.log);

        let gameTurn = 1;
        let game = getRandomGame(simulationRequest.players.length);
        let winningPlayerIndex: number | undefined = undefined;
        while (!winningPlayerIndex) {
          const currentPlayerExperience = simulationRequest.players[game.currentPlayerIndex].experience
          game = takeTurnAI(game, currentPlayerExperience);

          if (game.currentPlayerIndex === 0) {
            gameTurn++;
            // don't start next round if there was a winner in this one
            if (game.players.some(player => player.points >= 15)) {
              const winner = game.players.reduce((prev, current) => (prev.points > current.points) ? prev : current);
              winningPlayerIndex = game.players.indexOf(winner);
              game.log.push(`${winner.name} wins with ${winner.points} points!`);
              turns.push(gameTurn);
              break;
            }
          }
        }
        wins[winningPlayerIndex]++;
        gameLog.push(game.log);
      } catch (e: any) {
        failures.push(e.message);
        i--;
      }
    }

    res.status(200).json({
      games: simulationRequest.games,
      players: simulationRequest.players.map((player, playerIndex) => ({
        experience: player.experience,
        wins: wins[playerIndex]
      })),
      averageTurns: turns.reduce((a, b) => a + b) / turns.length,
      failures: failures.length > 0 ? failures : undefined,
      gameLog: verbose ? gameLog : undefined
    });
  } else {
    res.status(405).end();
  }
}
