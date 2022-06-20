import { ALL_GEMS, Bank, Card, Gem, Noble, Player } from "../models";

export const getEmptyBank = () => ({
  [Gem.Diamond]: 0,
  [Gem.Onyx]: 0,
  [Gem.Emerald]: 0,
  [Gem.Ruby]: 0,
  [Gem.Sapphire]: 0,
  [Gem.Gold]: 0,
});

export const isValidGemAction = (gems: Gem[], bank: Bank) => {
  if (gems.includes(Gem.Gold)) return false;
  if (gems.length < 2 || gems.length > 3) {
    return false;
  } else if (gems.length === 2) {
    if (gems[0] !== gems[1]) return false;
    if (bank[gems[0]] < 4) return false;
  } else if (gems.length === 3) {
    if (gems[0] === gems[1] || gems[1] === gems[2] || gems[0] === gems[2]) return false;
    if (bank[gems[0]] < 1) return false;
    if (bank[gems[1]] < 1) return false;
    if (bank[gems[2]] < 1) return false;
  }
  return true;
}

export const getBankValueOfCards = (cards: Card[]): Bank => {
  const bank = getEmptyBank();
  for (const gem of cards.map(card => card.gem)) {
    bank[gem]++;
  }
  return bank;
}

export const isPlayerEligibleForNoble = (playerCardValues: Bank, noble: Noble): boolean => {
  if (playerCardValues[Gem.Onyx] < noble.black) return false;
  if (playerCardValues[Gem.Diamond] < noble.white) return false;
  if (playerCardValues[Gem.Emerald] < noble.green) return false;
  if (playerCardValues[Gem.Sapphire] < noble.blue) return false;
  if (playerCardValues[Gem.Ruby] < noble.red) return false;
  return true;
}

const getPurchasingPower = (player: Player) => {
  const bank = getEmptyBank();
  const cardValues = getBankValueOfCards(player.cards);
  for (const gem of ALL_GEMS) {
    bank[gem] = player.bank[gem] + cardValues[gem]
  }
  return bank;
}

const doesBankHaveGems = (gems: Gem[], bank: Bank, canUseGold: boolean) => {
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

export const canPlayerAffordCard = (player: Player, card: Card) => 
  doesBankHaveGems(card.cost, getPurchasingPower(player), true);

export const areValidGemsToConsider = (consideredGems: Gem[], bank: Bank) => {
  if (consideredGems.includes(Gem.Gold)) return false;
  if (!doesBankHaveGems(consideredGems, bank, false)) return false;
  if (consideredGems.length > 3) return false;
  if (consideredGems.length === 3) {
    return isValidGemAction(consideredGems, bank);
  }
  if (consideredGems.length === 2) {
    if (consideredGems[0] === consideredGems[1]) return isValidGemAction(consideredGems, bank);
  }
  return true;
}

export const getTotalChipCount = (bank: Bank): number =>
  Object.values(bank).reduce((sum, current) => sum + current, 0);