import { GameState } from ".";
import { ALL_GEMS, Bank, Card, Decks, Gem, Noble, Player } from "../models";

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