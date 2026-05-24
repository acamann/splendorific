import { Card, Decks, Gem, getGemName, Noble } from "../models";

export const encodeInitialDecks = (decks: Decks, nobles: Noble[]): string => {
  const encodedDecks = [1, 2, 3].map(level => `${level}:${decks[level as 1 | 2 | 3].map(d => d.id).join(",")}`).join("|");
  const encodedNobles = `n:${nobles.map(n => n.id).join(",")}`;
  return `${encodedDecks}|${encodedNobles}`;
}

export const encodePurchaseCard = (playerIndex: number, card: Card, spent: Gem[], earnedNobles: Noble[], newPoints: number) =>
  `${playerIndex}p${card.level}.${card.id}.${spent.map(g => getGemName(g).charAt(0)).join("")}+${card.points}${earnedNobles.map(n => `n${n.id}+${n.points}`)}|${newPoints}`;

export const encodeTakeChips = (playerIndex: number, chipsToTake: Gem[]) =>
  `${playerIndex}g${chipsToTake.map(c => getGemName(c).charAt(0)).join("")}`;

export const encodeReserveCard = (playerIndex: number, card: Card, isGoldAvailable: boolean) =>
  `${playerIndex}r${card.level}.${card.id}.${isGoldAvailable ? "g" : ""}`;

export const encodePurchaseReservedCard = (playerIndex: number, card: Card, spent: Gem[], earnedNobles: Noble[], newPoints: number) =>
  `${playerIndex}pr${card.level}.${card.id}.${spent.map(g => getGemName(g).charAt(0)).join("")}+${card.points}${earnedNobles.map(n => `n${n.id}+${n.points}`)}|${newPoints}`;

type CardLog = {
  cardLevel: 1 | 2 | 3
  cardId: number
}

type PurchaseLog = { type: "purchase" } & CardLog;
type ReserveLog = { type: "reserve" } & CardLog;
type PurchaseReservedLog = { type: "purchase-reserved" } & CardLog;
type TakeChipsLog = { type: "chips", chips: Gem[] };

type Log = {
  playerIndex: number
} & (PurchaseLog | ReserveLog | PurchaseReservedLog | TakeChipsLog);

const getCardLevelAndId = (log: string): [1 | 2 | 3, number] => {
  const splitLog = log.split(".");
  const cardLevel = Number.parseInt(splitLog[0]) as 1 | 2 | 3;
  const cardId = Number.parseInt(splitLog[1]);
  return [cardLevel, cardId];
}

const decodeGems = (gemLog: string): Gem[] => {
  const gems: Gem[] = [];
  for (var i = 0; i < gemLog.length; i++) {
    switch (gemLog.charAt(i)) {
      case "E":
        gems.push(Gem.Emerald);
        break;
      case "S":
        gems.push(Gem.Sapphire);
        break;
      case "D":
        gems.push(Gem.Diamond);
        break;
      case "R":
        gems.push(Gem.Ruby);
        break;
      case "O":
        gems.push(Gem.Onyx);
        break;
      default:
        throw new Error(`Invalid Gem: ${gemLog.charAt(i)}`);
    }
  }
  return gems;
}

export const decodeTurnLog = (log: string): Log => {
  const [playerIndex, turnLog] = [Number.parseInt(log.slice(0, 1)), log.slice(1)];
  if (turnLog.startsWith("pr")) {
    const [cardLevel, cardId] = getCardLevelAndId(turnLog.slice(2));
    return { playerIndex, type: "purchase-reserved", cardLevel, cardId };
  } else if (turnLog.startsWith("p")) {
    const [cardLevel, cardId] = getCardLevelAndId(turnLog.slice(1));
    return { playerIndex, type: "purchase", cardLevel, cardId };
  } else if (turnLog.startsWith("r")) {
    const [cardLevel, cardId] = getCardLevelAndId(turnLog.slice(1));
    return { playerIndex, type: "reserve", cardLevel, cardId };
  } else if (turnLog.startsWith("g")) {
    return { playerIndex, type: "chips", chips: decodeGems(turnLog.slice(1)) };
  } else {
    throw new Error("Invalid log");
  }
}