import { Handler } from "@netlify/functions";
import { takeTurnAI } from "../../ai";
import { saveSimulationToDB, tryDequeueSimulationRequest } from "../../db/mongodb";
import { getRandomGame, initialPlayerState } from "../../gameState";
import { Player } from "../../models";

export const handler: Handler = async (event, context) => {
  // get and remove next request from db queue
  const request = await tryDequeueSimulationRequest();
  if (!request) {
    // if there is not one, return
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "No Simulation Requests Queued" })
    }
  }

  // run & save simulation result to db
  const simulation = simulate(request.games, request.players.map(p => p.aiExperience));
  const id = await saveSimulationToDB(simulation);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Successful simulation",
      id
    })
  }
};

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