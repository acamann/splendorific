import { Noble } from '../models';
import nobles from './nobles.json';

export const nobleDeck: Noble[] = nobles.map((noble, index) => ({
  id: index,
  points: 3,
  black: noble.black,
  blue: noble.blue,
  white: noble.white,
  green: noble.green,
  red: noble.red
}));