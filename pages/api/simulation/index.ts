// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { shuffle } from '../../../utils/array';
import { nobleDeck } from '../../../data/nobles';
import { deck } from '../../../data/deck';
import { Bank, Card, cardToString, Decks, Gem, getGemName, Noble, NonGoldGem, Player } from '../../../models';
import { canPlayerAffordCard, getBankValueOfCards, getEmptyBank, getTotalChipCount, isPlayerEligibleForNoble } from '../../../utils/validation';

type GameState = {
  bank: Bank;
  decks: Decks;
  nobles: Noble[];
  players: Player[];
  currentPlayerIndex: number;
  log: string[];
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
  log: [],
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

const getNextPlayerIndex = (currentPlayerIndex: number, numberOfPlayers: number): number => 
  (currentPlayerIndex < numberOfPlayers - 1) ? currentPlayerIndex + 1 : 0;

const getAffordableReservedCards = (game: GameState, playerIndex: number): Card[] =>
  game.players[playerIndex].reserved.filter(card => canPlayerAffordCard(game.players[playerIndex], card));

const takeTurnPurchaseReservedCard = (game: GameState, reservedCardToPurchase: Card): GameState => {
  const index = game.players[game.currentPlayerIndex].reserved.indexOf(reservedCardToPurchase);
  if (index === -1) {
    throw new Error("Reserved card not found");
  }

  // update banks
  const newBank = { ...game.bank };
  const playerBank = { ...game.players[game.currentPlayerIndex].bank };
  let playerCardValues = getBankValueOfCards([...game.players[game.currentPlayerIndex].cards]);
  for (const gem of reservedCardToPurchase.cost) {
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
  playerPoints = playerPoints + reservedCardToPurchase.points;

  const earnedNobles: Noble[] = []
  playerCardValues = getBankValueOfCards([...game.players[game.currentPlayerIndex].cards, reservedCardToPurchase]);
  for (const noble of game.nobles) {
    if (isPlayerEligibleForNoble(playerCardValues, noble)) {
      // if qualified for this noble, take the points & remove the noble
      playerPoints = playerPoints + noble.points;
      earnedNobles.push(noble);
    }
  }

  return {
    ...game,
    players: game.players.map((player, playerIndex) => playerIndex === game.currentPlayerIndex ? ({
      ...player,
      cards: [...player.cards, reservedCardToPurchase],
      reserved: player.reserved.filter((r, i) => i !== index),
      bank: playerBank,
      points: playerPoints,
      nobles: [...player.nobles, ...earnedNobles]
    }) : player),
    bank: newBank,
    nobles: game.nobles.filter(n => !earnedNobles.includes(n)),
    currentPlayerIndex: getNextPlayerIndex(game.currentPlayerIndex, game.players.length),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} purchased reserved card: (${cardToString(reservedCardToPurchase)}). Total points: ${playerPoints}`]
  }
}

const getVisibleCards = (decks: Decks, level?: 1 | 2 | 3): Card[] => {
  const cards = [...decks[3].slice(0, 4), ...decks[2].slice(0, 4), ...decks[1].slice(0, 4)]
    .filter(c => level === undefined || c.level === level);
  if (cards.length === 0) {
    throw new Error("No cards remaining!");
  }
  return cards;
}

const getAffordableCards = (game: GameState, playerIndex: number): Card[] =>
  getVisibleCards(game.decks)
    .filter(card => canPlayerAffordCard(game.players[playerIndex], card));

const takeTurnPurchaseCard = (game: GameState, cardToPurchase: Card): GameState => {
  // throw error on validating purchase

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
      throw new Error("Error: unexpected path in card purchase");
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
    currentPlayerIndex: getNextPlayerIndex(game.currentPlayerIndex, game.players.length),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} purchased card: (${cardToString(cardToPurchase)}). Total points: ${playerPoints}`]
  }
}

const takeTurnTakeChips = (game: GameState, chipsToTake: Gem[]) => {
  // throw error if invalid chips

  const newBank = { ...game.bank };
  const playerBank = { ...game.players[game.currentPlayerIndex].bank };
  for (const gem of chipsToTake) {
    playerBank[gem]++;
    newBank[gem]--;
  }

  return {
    ...game,
    bank: newBank,
    players: game.players.map((player, index) => index === game.currentPlayerIndex ? ({
      ...player,
      bank: playerBank
    }) : player),
    currentPlayerIndex: getNextPlayerIndex(game.currentPlayerIndex, game.players.length),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} took chips: ${chipsToTake.map(c => getGemName(c)).join(", ")}.`]
  };
}

const takeTurnReserveCard = (game: GameState, cardToReserve: Card) => {
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
    currentPlayerIndex: getNextPlayerIndex(game.currentPlayerIndex, game.players.length),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} reserved card: (${cardToString(cardToReserve)}).`]
  }
}

const takeRandomTurn = (game: GameState): GameState => {
  // Purchase reserved card, if able
  const affordableReservedCards = getAffordableReservedCards(game, game.currentPlayerIndex)
  if (affordableReservedCards.length > 0) {
    const randomAffordableReservedCard = affordableReservedCards[Math.floor(Math.random()*affordableReservedCards.length)];
    return takeTurnPurchaseReservedCard(game, randomAffordableReservedCard);
  }

  // Purchase available card, if able
  const affordableCards = getAffordableCards(game, game.currentPlayerIndex);
  if (affordableCards.length) {
    // select card to purchase at random
    const randomAffordableCard = affordableCards[Math.floor(Math.random()*affordableCards.length)];
    return takeTurnPurchaseCard(game, randomAffordableCard);
  }

  // take 3 random chips, if able
  const playerChipCount = getTotalChipCount(game.players[game.currentPlayerIndex].bank)
  if (playerChipCount < 8 && bankHasThreeChipsAvailable(game.bank)) {
    const gemsToTake: Gem[] = [];
    while (gemsToTake.length < 3) {
      const randomGem = Math.floor(Math.random()*5) as NonGoldGem; // make this smarter/safer
      if (!gemsToTake.includes(randomGem) && game.bank[randomGem] > 0) {
        gemsToTake.push(randomGem);
      }
    }
    return takeTurnTakeChips(game, gemsToTake);
  }

  // reserve random level one card, if able
  if (game.players[game.currentPlayerIndex].reserved.length < 3) {
    const visibleLevelOneCards = getVisibleCards(game.decks, 1);
    const cardToReserve = visibleLevelOneCards[Math.floor(Math.random()*visibleLevelOneCards.length)];
    return takeTurnReserveCard(game, cardToReserve);
  }

  // if all else fails, take random chips only up to the chip limit (not a likely fallback)...
  if (playerChipCount < 10 && bankHasThreeChipsAvailable(game.bank)) {
    const gemsToTake: Gem[] = [];
    while (gemsToTake.length < 10 - playerChipCount) {
      const randomGem = Math.floor(Math.random()*5) as NonGoldGem; // make this smarter/safer
      if (!gemsToTake.includes(randomGem) && game.bank[randomGem] > 0) {
        gemsToTake.push(randomGem);
      }
    }
    return takeTurnTakeChips(game, gemsToTake);
  }

  throw new Error("No known available moves for current player!");
}

const takeWiseTurn = (game: GameState): GameState => {

  // calculate desirability for every visible card:
  // points * 20
  // can afford now? minus 0 & keep in list
  // TODO: can afford next turn? minus 10 & keep in list
  // else? ignore card
  // subtract number of chips required to spend from player bank

  // can purchase now + 5 points = 100 minus number of chips required
  // can purchase next turn + 5 points = 90 minus number of chips required
  // can purchase now + 4 points = 80
  // can purchase next turn + 4 points = 70
  // can purchase now + 3 points = 60
  // can purchase next turn + 3 points = 50
  // can purchase now + 2 points = 40
  // can purchase next turn + 2 points = 30
  // can purchase now + 1 point = 20
  // can purchase next turn + 1 point = 10

  const desiredCards = (getVisibleCards(game.decks).map(card => {
    const canAfford = canPlayerAffordCard(game.players[game.currentPlayerIndex], card);
    // TODO: consider cards that could be purchased on NEXT turn
    if (canAfford) {
      const playerCurrentCardsValue = getBankValueOfCards(game.players[game.currentPlayerIndex].cards);
      let chipsRequiredFromPlayerBank = 0;
      card.cost.forEach(gem => {
        if (playerCurrentCardsValue[gem] > 0) {
          playerCurrentCardsValue[gem]--;
        } else if (playerCurrentCardsValue[Gem.Gold] > 0) {
          playerCurrentCardsValue[Gem.Gold]--;
        } else {
          chipsRequiredFromPlayerBank++;
        }
      });
      return {
        card,
        desirability: card.points * 20 - chipsRequiredFromPlayerBank
      }
    } else {
      return undefined;
    }
  }).filter(d => d !== undefined) as { card: Card, desirability: number }[])
    .sort((a, b) => b.desirability - a.desirability); // sorts descending

  //console.log(desiredCards);

  for (let index = 0; index < desiredCards.length; index++) {
    const desiredCard = desiredCards[index].card;
    //  - purchase desired card (if able)
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], desiredCard)) {
      return takeTurnPurchaseCard(game, desiredCard);
    }
    //  - take other affordable card, if with it could purchase desired card (if able)
    //  - take available chips to get closer to desired card (if able)
    //  - reserve (if able)
  }

  // otherwise take random turn
  return takeRandomTurn(game);
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
        let gameTurn = 1;
        let game = getRandomGame(simulationRequest.players.length);
        let winningPlayerIndex: number | undefined = undefined;
        while (!winningPlayerIndex) {

          // make this randomly choose between takeBestAvailableTurn & takeRandomTurn depending on experience level
          const currentPlayerExperience = simulationRequest.players[game.currentPlayerIndex].experience
          if (currentPlayerExperience > Math.random()) {
            game = takeWiseTurn(game);
          } else {
            game = takeRandomTurn(game);
          }

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
