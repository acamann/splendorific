import {
  Card,
  Gem,
  NonGoldGem
} from "../models";
import {
  GameState,
  takeTurnPurchaseCard,
  takeTurnPurchaseReservedCard,
  takeTurnReserveCard,
  takeTurnTakeChips
} from "../gameState";
import {
  bankHasThreeChipsAvailable,
  canPlayerAffordCard,
  getAffordableCards,
  getAffordableReservedCards,
  getBankValueOfCards,
  getBestChipsToPursueCard,
  getNumberOfTurnsUntilPlayerCanAffordCard,
  getTotalChipCount,
  getVisibleCards
} from "../gameState/helpers";

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

  // reserve random card from lowest available level, if able
  if (game.players[game.currentPlayerIndex].reserved.length < 3) {
    const visibleCards = getVisibleCards(game.decks);
    const lowestLevelAvailable = visibleCards.reduce((previousLowestLevel, currentCard) => currentCard.level < previousLowestLevel ? currentCard.level : previousLowestLevel, 3)
    const visibleCardsAtLowestLevelAvailable = visibleCards.filter(card => card.level === lowestLevelAvailable);
    const cardToReserve = visibleCardsAtLowestLevelAvailable[Math.floor(Math.random()*visibleCardsAtLowestLevelAvailable.length)];
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
    // currently able to see current and next turn only
    const numberOfTurnsUntilCanAfford = getNumberOfTurnsUntilPlayerCanAffordCard(game.players[game.currentPlayerIndex], game.bank, card);
    if (numberOfTurnsUntilCanAfford !== undefined) {
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
        desirability: card.points * 20 - chipsRequiredFromPlayerBank - (numberOfTurnsUntilCanAfford * 10)
      }
    } else {
      return undefined;
    }
  }).filter(d => d !== undefined) as { card: Card, desirability: number }[])
    .sort((a, b) => b.desirability - a.desirability); // sorts descending

  for (let index = 0; index < desiredCards.length; index++) {
    const desiredCard = desiredCards[index].card;
    //  - purchase most desired card (if able)
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], desiredCard)) {
      return takeTurnPurchaseCard(game, desiredCard);
    }
    //  - take other affordable card, if with it could purchase desired card (if able)
    //  - take available chips to get closer to desired card (if able)
    const availableChipsToTakeToPursueCard = getBestChipsToPursueCard(game.players[game.currentPlayerIndex], game.bank, desiredCard)
    if (availableChipsToTakeToPursueCard) {
      return takeTurnTakeChips(game, availableChipsToTakeToPursueCard);
    }
    //  - reserve (if able, and only if really close to getting)
  }

  // otherwise take random turn
  return takeRandomTurn(game);
}

// more likely to take wise turn with greater experience
export const takeTurnAI = (game: GameState, experience: number): GameState => 
  (experience > Math.random()) ? takeWiseTurn(game) : takeRandomTurn(game);

// better AI idea is for wise turn to be able to consider X turns in the future dependent on experience