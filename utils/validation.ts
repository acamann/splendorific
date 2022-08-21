import { doesBankHaveGems } from "../gameState/helpers";
import { Bank, Gem } from "../models";

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
