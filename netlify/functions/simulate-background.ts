import { Handler } from "@netlify/functions";
import { takeTurnAI } from "../../ai";
import { saveSimulationsToDB } from "../../db/mongodb";
import { getRandomGame, initialPlayerState } from "../../gameState";
import { Player } from "../../models";

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

export const handler: Handler = (event, context) => {
  if (event.httpMethod === "POST") {
    (async () => {
      await saveSimulationsToDB(PLAYER_EXPERIENCE_BASELINES.map((playerExperiences, i) => {
        console.log(`Simulate ${i + 1}`);
        return simulate(NUMBER_OF_GAMES, playerExperiences)
      }));
    })();
  }
};

const simulate = (numberOfGames: number, playerExperiences: number[]): SimulationResponse => {
  const numberOfPlayers = playerExperiences.length;
  const playerResults: {
    wins: number,
    points: number,
    nobles: number
  }[] = Array(numberOfPlayers).fill({
    wins: 0,
    points: 0,
    nobles: 0
  });
  const failures: string[] = [];
  let totalTurns = 0;
  for (let gameIndex = 0; gameIndex < numberOfGames; gameIndex++)
  {
    try {
      let gameTurn = 0;
      const simulationPlayers: Player[] = [];
      for (let index = 0; index < playerExperiences.length; index++) {
        simulationPlayers.push({
          ...initialPlayerState,
          name: `P${index + 1}`,
          aiExperience: playerExperiences[index]
        })
      }
      let game = getRandomGame(simulationPlayers);
      while (game.winningPlayerIndex === undefined) {
        if (game.currentPlayerIndex === 0) {
          gameTurn++;
        }
        game = takeTurnAI(game, playerExperiences[game.currentPlayerIndex]);
      }

      for (let index = 0; index < playerResults.length; index++) {
        playerResults[index].points += game.players[index].points;
        playerResults[index].nobles += game.players[index].nobles.length;
        if (game.winningPlayerIndex === index) {
          playerResults[index].wins++;
        }
      }

      totalTurns += gameTurn;
    } catch (e: any) {
      failures.push(e.message);
      gameIndex--;
    }
  }

  return {
    games: numberOfGames,
    players: playerExperiences.map((experience, playerIndex) => ({
      experience: experience,
      wins: playerResults[playerIndex].wins,
      winPercentage: playerResults[playerIndex].wins / numberOfGames,
      averagePoints: playerResults[playerIndex].points / numberOfGames,
      averageNobles: playerResults[playerIndex].nobles / numberOfGames
    })),
    averageTurns: totalTurns / numberOfGames,
    failures: failures.length > 0 ? failures : undefined,
  }
}