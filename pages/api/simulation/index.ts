// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { shuffle } from '../../../utils/array';
import { nobleDeck } from '../../../data/nobles';
import { deck } from '../../../data/deck';
import { Bank, Card, Decks, Gem, Noble, NonGoldGem, Player } from '../../../models';
import { canPlayerAffordCard, getBankValueOfCards, getEmptyBank, getTotalChipCount, isPlayerEligibleForNoble } from '../../../utils/validation';

type GameState = {
  bank: Bank;
  decks: Decks;
  nobles: Noble[];
  players: Player[];
  currentPlayerIndex: number;
}

const initialState: GameState = {
  bank: getEmptyBank(),
  decks: {
    [1]: [],
    [2]: [],
    [3]: []
  },
  nobles: [],
  players: [],
  currentPlayerIndex: 0,
}

const initialPlayerState: Player = {
  name: "Unknown",
  bank: getEmptyBank(),
  cards: [],
  reserved: [],
  nobles: [],
  points: 0
}

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

const bankHasThreeChipsAvailable = (bank: Bank): boolean => {
  return [
    bank[Gem.Diamond] > 0,
    bank[Gem.Onyx] > 0,
    bank[Gem.Emerald] > 0,
    bank[Gem.Ruby] > 0,
    bank[Gem.Sapphire] > 0
  ].filter(remaining => remaining === true).length >= 3;
}

const takeRandomTurn = (game: GameState): GameState => {
  const nextPlayerIndex = (game.currentPlayerIndex < game.players.length - 1) ? game.currentPlayerIndex + 1 : 0;

  try {
    // can current player purchase one of their reserved cards?  then they should!
    const affordableReservedCards = game.players[game.currentPlayerIndex].reserved.filter(card => canPlayerAffordCard(game.players[game.currentPlayerIndex], card));
    if (affordableReservedCards.length > 0) {
      const cardToPurchase = affordableReservedCards[0];
      const index = game.players[game.currentPlayerIndex].reserved.indexOf(cardToPurchase);

      // update banks
      const newBank = { ...game.bank };
      const playerBank = { ...game.players[game.currentPlayerIndex].bank };
      let playerCardValues = getBankValueOfCards([...game.players[game.currentPlayerIndex].cards]);
      for (const gem of cardToPurchase.cost) {
        if (playerCardValues[gem] > 0) {
          playerCardValues[gem]--;
        } else if (playerBank[gem] > 0) {
          playerBank[gem]--;
          newBank[gem]++;
        } else if (playerBank[Gem.Gold] > 0) {
          playerBank[Gem.Gold]--;
          newBank[Gem.Gold]++;
        } else {
          throw new Error("Error: unexpected path in random card purchase");
        }
      };

      
      // attribute earned points to player
      let playerPoints = game.players[game.currentPlayerIndex].points;
      playerPoints = playerPoints + cardToPurchase.points;

      const earnedNobles: Noble[] = []
      playerCardValues = getBankValueOfCards([...game.players[game.currentPlayerIndex].cards, cardToPurchase]);
      for (const noble of game.nobles) {
        if (isPlayerEligibleForNoble(playerCardValues, noble)) {
          // if qualified for this noble, take the points & remove the noble
          playerPoints = playerPoints + noble.points;
          earnedNobles.push(noble);
        }
      }

      //console.log("Purchased reserved");
      return {
        ...game,
        players: game.players.map((player, playerIndex) => playerIndex === game.currentPlayerIndex ? ({
          ...player,
          cards: [...player.cards, cardToPurchase],
          reserved: player.reserved.filter((r, i) => i !== index),
          bank: playerBank,
          points: playerPoints,
          nobles: [...player.nobles, ...earnedNobles]
        }) : player),
        bank: newBank,
        nobles: game.nobles.filter(n => !earnedNobles.includes(n)),
        currentPlayerIndex: nextPlayerIndex
      }
    }

    // are there any cards that current player CAN take, take one at random
    const visibleCards = [...game.decks[3].slice(0, 4), ...game.decks[2].slice(0, 4), ...game.decks[1].slice(0, 4)];
    const affordableCards = visibleCards.filter(card => canPlayerAffordCard(game.players[game.currentPlayerIndex], card));

    if (affordableCards.length > 0) {
      // select card to purchase at random
      const cardToPurchase = affordableCards[Math.floor(Math.random()*affordableCards.length)];

      // update banks
      const newBank = { ...game.bank };
      const playerBank = { ...game.players[game.currentPlayerIndex].bank };
      let playerCardValues = getBankValueOfCards([...game.players[game.currentPlayerIndex].cards]);
      for (const gem of cardToPurchase.cost) {
        if (playerCardValues[gem] > 0) {
          playerCardValues[gem]--;
        } else if (playerBank[gem] > 0) {
          playerBank[gem]--;
          newBank[gem]++;
        } else if (playerBank[Gem.Gold] > 0) {
          playerBank[Gem.Gold]--;
          newBank[Gem.Gold]++;
        } else {
          throw new Error("Error: unexpected path in random card purchase");
        }
      };

      // find and replace card in deck
      const level = cardToPurchase.level;
      const index = game.decks[level].indexOf(cardToPurchase);
      if (index < 0 || index > 3) {
        throw new Error("Error: unexpected path in finding index of selected card");
      }
      const newDeck: Card[] = [...game.decks[level]];
      if (game.decks[level].length > 4) {
        const replacement = game.decks[level][4];
        newDeck.splice(index, 1, replacement);
        newDeck.splice(4, 1);
      } else {
        newDeck.splice(index, 1);
      }

      // attribute earned points to player
      let playerPoints = game.players[game.currentPlayerIndex].points;
      playerPoints = playerPoints + cardToPurchase.points;

      const earnedNobles: Noble[] = []
      playerCardValues = getBankValueOfCards([...game.players[game.currentPlayerIndex].cards, cardToPurchase]);
      for (const noble of game.nobles) {
        if (isPlayerEligibleForNoble(playerCardValues, noble)) {
          // if qualified for this noble, take the points & remove the noble
          playerPoints = playerPoints + noble.points;
          earnedNobles.push(noble);
        }
      }

      //console.log("Purchased card");
      return {
        ...game,
        decks: {
          ...game.decks,
          [level]: newDeck
        },
        players: game.players.map((player, playerIndex) => playerIndex === game.currentPlayerIndex ? ({
          ...player,
          cards: [...player.cards, cardToPurchase],
          bank: playerBank,
          points: playerPoints,
          nobles: [...player.nobles, ...earnedNobles]
        }) : player),
        bank: newBank,
        nobles: game.nobles.filter(n => !earnedNobles.includes(n)),
        currentPlayerIndex: nextPlayerIndex
      }
    }

    // otherwise, less than 8 chips & 3 different chips available in bank? take 3 random chips
    if (getTotalChipCount(game.players[game.currentPlayerIndex].bank) < 8 && bankHasThreeChipsAvailable(game.bank)) {
      const gemsToTake: Gem[] = [];
      while (gemsToTake.length < 3) {
        const randomGem = Math.floor(Math.random()*5) as NonGoldGem; // make this smarter/safer
        if (!gemsToTake.includes(randomGem) && game.bank[randomGem] > 0) {
          gemsToTake.push(randomGem);
        }
      }

      const newBank = { ...game.bank };
      const playerBank = { ...game.players[game.currentPlayerIndex].bank };
      for (const gem of gemsToTake) {
        playerBank[gem]++;
        newBank[gem]--;
      }

      //console.log("Took some chips");
      return {
        ...game,
        bank: newBank,
        players: game.players.map((player, index) => index === game.currentPlayerIndex ? ({
          ...player,
          bank: playerBank
        }) : player),
        currentPlayerIndex: nextPlayerIndex
      };
    }

    // otherwise, reserve card
    if (game.players[game.currentPlayerIndex].reserved.length < 3) {
      const cardToReserve = visibleCards[Math.floor(Math.random()*affordableCards.length)];
      const level = cardToReserve.level;
      const index = game.decks[level].indexOf(cardToReserve);
      if (index < 0 || index > 3) {
        throw new Error("Error: unexpected path in finding index of selected card to reserve");
      }

      const newDeck = [...game.decks[level]];
      if (game.decks[level].length > 4) {
        const replacement = game.decks[level][4];
        newDeck.splice(index, 1, replacement);
        newDeck.splice(4, 1);
      } else {
        newDeck.splice(index, 1);
      }
    
      const isGoldAvailable = game.bank[Gem.Gold] > 0

      //console.log("Reserved card");
      return {
        ...game,
        decks: {
          ...game.decks,
          [level]: newDeck
        },
        players: game.players.map((player, index) => index === game.currentPlayerIndex ? ({
          ...player,
          reserved: [...player.reserved, cardToReserve],
          bank: {
            ...player.bank,
            [Gem.Gold]: isGoldAvailable ? player.bank[Gem.Gold] + 1 : player.bank[Gem.Gold]
          }
        }) : player),
        bank: {
          ...game.bank,
          [Gem.Gold]: isGoldAvailable ? game.bank[Gem.Gold] - 1 : game.bank[Gem.Gold]
        },
        currentPlayerIndex: nextPlayerIndex
      }
    }

    throw new Error("No known available moves for current player. SKIPPED");
  } catch (e: any) {
    console.warn(e.message);
    return {
      ...game,
      currentPlayerIndex: nextPlayerIndex
    }
  }
}

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
}

interface ErrorResponse {
  error: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimulationResponse | ErrorResponse>
) {
  if (req.method === 'POST') {
    // for now run the simulation & wait on the result before responding
    const simulationRequest: SimulationRequest = req.body;
    if (!simulationRequest.games || simulationRequest.games <= 0) {
      res.status(400).json({ error: "'games': positive number of games required in request body" });
    }
    if (!simulationRequest.players) {
      res.status(400).json({ error: "'players': player configuration required for 2 to 4 players in request body" });
    }

    const wins: number[] = Array(simulationRequest.players.length).fill(0);
    for (let i = 0; i < simulationRequest.games; i++)
    {
      //console.log(`GAME ${i+1}`);
      let game = getRandomGame(simulationRequest.players.length);
      while (game.players[game.currentPlayerIndex].points < 15) {
        game = takeRandomTurn(game);
      }
      //console.log(`GAME ${i+1} WINNER: ${game.players[game.currentPlayerIndex].name}`);
      wins[game.currentPlayerIndex]++;
    }

    res.status(200).json({
      games: simulationRequest.games,
      players: simulationRequest.players.map((player, playerIndex) => ({
        experience: player.experience,
        wins: wins[playerIndex]
      }))
    });
  } else {
    res.status(405).end();
  }
}
