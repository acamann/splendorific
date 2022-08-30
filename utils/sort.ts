import { Card } from "../models";

export const byColor = (cardA: Card, cardB: Card): number => cardA.gem - cardB.gem;