import { deck } from "../data/deck";
import { nobleDeck } from "../data/nobles";
import {
  Bank,
  Card,
  cardToString,
  Decks,
  Gem,
  getGemName,
  Noble,
  Player
} from "../models";
import { shuffle } from "../utils/array";
import {
  getBankValueOfCards,
  getEmptyBank,
  getNextPlayerIndex,
  getWinningPlayerIndex,
  isPlayerEligibleForNoble
} from "./helpers";

export type GameState = {
  bank: Bank;
  decks: Decks;
  nobles: Noble[];
  players: Player[];
  currentPlayerIndex: number;
  winningPlayerIndex?: number;
  log: string[];
  error?: string;
}

export const initialState: GameState = {
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

export const initialPlayerState: Player = {
  name: "Unknown",
  bank: getEmptyBank(),
  cards: [],
  reserved: [],
  nobles: [],
  points: 0
}

export const getRandomGame = (players: Player[]): GameState => {
  const noblesCount = players.length + 1;
  shuffle(nobleDeck);
  shuffle(deck);

  let bankChips = 7;
  if (players.length === 3) {
    bankChips = 5;
  }
  if (players.length === 2) {
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
    players,
    bank,
    nobles: nobleDeck.slice(0, noblesCount),
    decks: {
      [1]: deck.filter(card => card.level === 1),
      [2]: deck.filter(card => card.level === 2),
      [3]: deck.filter(card => card.level === 3)
    },
    currentPlayerIndex: 0
  }
};

export const takeTurnPurchaseCard = (game: GameState, cardToPurchase: Card): GameState => {
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
    winningPlayerIndex: getWinningPlayerIndex(game),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} purchased card: (${cardToString(cardToPurchase)}). Total points: ${playerPoints}`]
  }
}

export const takeTurnTakeChips = (game: GameState, chipsToTake: Gem[]) => {
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
    winningPlayerIndex: getWinningPlayerIndex(game),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} took chips: ${chipsToTake.map(c => getGemName(c)).join(", ")}.`]
  };
}

export const takeTurnReserveCard = (game: GameState, cardToReserve: Card) => {
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
    winningPlayerIndex: getWinningPlayerIndex(game),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} reserved card: (${cardToString(cardToReserve)}).`]
  }
}

export const takeTurnPurchaseReservedCard = (game: GameState, reservedCardToPurchase: Card): GameState => {
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
    winningPlayerIndex: getWinningPlayerIndex(game),
    log: [...game.log, `${game.players[game.currentPlayerIndex].name} purchased reserved card: (${cardToString(reservedCardToPurchase)}). Total points: ${playerPoints}`]
  }
}