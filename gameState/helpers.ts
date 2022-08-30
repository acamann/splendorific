import { GameState } from ".";
import { ALL_GEMS, Bank, Card, Decks, Gem, Noble, NonGoldGem, Player } from "../models";

export const getEmptyBank = () => ({
  [Gem.Diamond]: 0,
  [Gem.Onyx]: 0,
  [Gem.Emerald]: 0,
  [Gem.Ruby]: 0,
  [Gem.Sapphire]: 0,
  [Gem.Gold]: 0,
});

export const bankHasThreeChipsAvailable = (bank: Bank): boolean => {
  return [
    bank[Gem.Diamond] > 0,
    bank[Gem.Onyx] > 0,
    bank[Gem.Emerald] > 0,
    bank[Gem.Ruby] > 0,
    bank[Gem.Sapphire] > 0
  ].filter(remaining => remaining === true).length >= 3;
}

export const doesBankHaveGems = (gems: Gem[], bank: Bank, canUseGold: boolean) => {
  const bankCopy = Object.assign({}, bank);
  for (const gem of gems) {
    if (bankCopy[gem] > 0) {
      bankCopy[gem]--;
    } else if (canUseGold && bankCopy[Gem.Gold] > 0) {
      bankCopy[Gem.Gold]--;
    } else {
      return false;
    }
  };
  return true;
}

export const getNextPlayerIndex = (currentPlayerIndex: number, numberOfPlayers: number): number => 
  (currentPlayerIndex < numberOfPlayers - 1) ? currentPlayerIndex + 1 : 0;

export const canPlayerAffordCard = (player: Player, card: Card) => 
  doesBankHaveGems(card.cost, getPurchasingPower(player), true);

const getRemainingCost = (purchasingPower: Bank, cardCost: Bank): Bank => {
  const bank = getEmptyBank();
  for (const gem of ALL_GEMS) {
    bank[gem] = cardCost[gem] - purchasingPower[gem];
  }
  return bank;
}

export const getBestChipsToPursueCard = (player: Player, availableChips: Bank, desiredCard: Card): Gem[] | undefined => {
  const remainingCost = getRemainingCost(getPurchasingPower(player), getCostAsBank(desiredCard.cost));

  const gemsMoreThanTwoNeeded = Object.entries(remainingCost).filter(([gem, count]) => count > 2).map(([gem, count]) => gem as unknown as Gem);
  const gemsTwoNeeded = Object.entries(remainingCost).filter(([gem, count]) => count === 2).map(([gem, count]) => gem as unknown as Gem);
  const gemsOneNeeded = Object.entries(remainingCost).filter(([gem, count]) => count === 1).map(([gem, count]) => gem as unknown as Gem);

  if (gemsTwoNeeded.length === 1 && gemsOneNeeded.length === 0 && gemsMoreThanTwoNeeded.length === 0) {
    // only one type of gem needed, and only 2 of them needed
    const gemNeeded = gemsTwoNeeded[0];
    // so if bank has more 4 or more of that gem, we can take 2 and purchase on next turn!
    if (availableChips[gemNeeded] >= 4) {
      return [gemsTwoNeeded[0], gemsTwoNeeded[0]];
    }
  }

  if (gemsOneNeeded.length <= 3 && gemsMoreThanTwoNeeded.length === 0 && gemsTwoNeeded.length === 0) {
    // 3 or fewer gems needed, and only one of each needed
    for (const gemNeeded of gemsOneNeeded) {
      if (availableChips[gemNeeded] === 0) {
        // a needed gem is not available
        return undefined;
      }
    }
    // so if bank has one or more of each of those, we can take them and purchase on next turn!
    const gemsToTake = [...gemsOneNeeded];
    for (const gem of ALL_GEMS) {
      if (gemsToTake.length === 3) {
        return gemsToTake;
      }
      if (gem != Gem.Gold && availableChips[gem] > 0 && !gemsToTake.includes(gem)) {
        // still need more gems to take 3
        gemsToTake.push(gem);
      }
    }
    return undefined; // couldn't get any more 
  }

  // for now, only pursue a single move into the future
  return undefined;
}

export const getNumberOfTurnsUntilPlayerCanAffordCard = (player: Player, availableChips: Bank, card: Card): 0 | 1 | undefined => {
  let ongoingPurchasingPower = getPurchasingPower(player);
  if (doesBankHaveGems(card.cost, ongoingPurchasingPower, true)) {
    return 0;
  }

  const remainingCost = getRemainingCost(ongoingPurchasingPower, getCostAsBank(card.cost));
  const gemsMoreThanTwoNeeded = Object.entries(remainingCost).filter(([gem, count]) => count > 2).map(([gem, count]) => gem as unknown as Gem);
  if (gemsMoreThanTwoNeeded.length > 0) {
    // can't get it on next turn, because more than 3 different gems still needed
    // TODO: hypothetical good move: get any 3 of them with greatest length remaining
    return undefined;
  }

  const gemsTwoNeeded = Object.entries(remainingCost).filter(([gem, count]) => count === 2).map(([gem, count]) => gem as unknown as Gem);
  if (gemsTwoNeeded.length > 1) {
    // can't purchase on next turn, because more than 1 gem with more than 1 gem required
    // TODO: hypothetical good move: get 2 of them if can, or any 3 remaining
    return undefined;
  }

  const gemsOneNeeded = Object.entries(remainingCost).filter(([gem, count]) => count === 1).map(([gem, count]) => gem as unknown as Gem);
  if (gemsTwoNeeded.length === 1 && gemsOneNeeded.length === 0 && gemsMoreThanTwoNeeded.length === 0) {
    // only one type of gem needed, and only 2 of them needed
    const gemNeeded = gemsTwoNeeded[0];
    // so if bank has more 4 or more of that gem, we can take 2 and purchase on next turn!
    return availableChips[gemNeeded] >= 4 ? 1 : undefined;
  }

  if (gemsOneNeeded.length <= 3 && gemsMoreThanTwoNeeded.length === 0 && gemsTwoNeeded.length === 0) {
    // 3 or fewer gems needed, and only one of each needed
    for (const gemNeeded of gemsOneNeeded) {
      if (availableChips[gemNeeded] === 0) {
        return undefined;
      }
    }
    // so if bank has one or more of each of those, we can take them and purchase on next turn!
    return 1;
  }
}

export const getVisibleCards = (decks: Decks, level?: 1 | 2 | 3): Card[] => {
  const cards = [...decks[3].slice(0, 4), ...decks[2].slice(0, 4), ...decks[1].slice(0, 4)]
    .filter(c => level === undefined || c.level === level);
  if (cards.length === 0) {
    throw new Error("No cards remaining!");
  }
  return cards;
}

export const getAffordableCards = (game: GameState, playerIndex: number): Card[] =>
  getVisibleCards(game.decks)
    .filter(card => canPlayerAffordCard(game.players[playerIndex], card));

export const getAffordableReservedCards = (game: GameState, playerIndex: number): Card[] =>
  game.players[playerIndex].reserved.filter(card => canPlayerAffordCard(game.players[playerIndex], card));

export const getBankValueOfCards = (cards: Card[]): Bank => {
  const bank = getEmptyBank();
  for (const gem of cards.map(card => card.gem)) {
    bank[gem]++;
  }
  return bank;
}

export const getCostAsBank = (cost: NonGoldGem[]): Bank => {
  const bank = getEmptyBank();
  for (const gem of cost)
  {
    bank[gem]++;
  }
  return bank;
}

export const getPurchasingPower = (player: Player) => {
  const bank = getEmptyBank();
  const cardValues = getBankValueOfCards(player.cards);
  for (const gem of ALL_GEMS) {
    bank[gem] = player.bank[gem] + cardValues[gem]
  }
  return bank;
}

export const getTotalChipCount = (bank: Bank): number =>
  Object.values(bank).reduce((sum, current) => sum + current, 0);

export const isPlayerEligibleForNoble = (playerCardValues: Bank, noble: Noble): boolean => {
  if (playerCardValues[Gem.Onyx] < noble.black) return false;
  if (playerCardValues[Gem.Diamond] < noble.white) return false;
  if (playerCardValues[Gem.Emerald] < noble.green) return false;
  if (playerCardValues[Gem.Sapphire] < noble.blue) return false;
  if (playerCardValues[Gem.Ruby] < noble.red) return false;
  return true;
}

// TODO: fix! does not take into account most recent turn
// need to splat state changes on top of each other for each individual effect of a turn
export const getWinningPlayerIndex = (game: GameState): number | undefined => {
  if (game.winningPlayerIndex) {
    // game already has winner
    return game.winningPlayerIndex;
  } else if (game.currentPlayerIndex !== 0) {
    // have not completed full round
    return undefined;
  } else if (!game.players.some(player => player.points >= 15)) {
    // no one has 15 points
    return undefined;
  } else {
    // since at least one player has 15 points, see who has the most points
    // (tie breaker: fewest development cards wins)
    const winner = [...game.players]
      .sort((a, b) => a.points !== b.points ? b.points - a.points : a.cards.length - b.cards.length)
      [0];
    return game.players.indexOf(winner);
  }
}