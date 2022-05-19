import { Dispatch, useReducer } from "react";
import { Bank, Card, Decks, Gem, Noble, Player } from "../models";

type GameState = {
  bank: Bank;
  decks: "Loading" | Decks;
  nobles: "Loading" | Noble[];
  players: Player[];
  currentPlayerIndex: number;
}

const initialState: GameState = {
  bank: {
    [Gem.Diamond]: 7,
    [Gem.Onyx]: 7,
    [Gem.Emerald]: 7,
    [Gem.Ruby]: 7,
    [Gem.Sapphire]: 7,
    [Gem.Gold]: 7,
  },
  decks: {
    [1]: [],
    [2]: [],
    [3]: []
  },
  nobles: [],
  players: [],
  currentPlayerIndex: 0,
}

const initialPlayerState: Player = {
  bank: {
    [Gem.Diamond]: 0,
    [Gem.Onyx]: 0,
    [Gem.Emerald]: 0,
    [Gem.Ruby]: 0,
    [Gem.Sapphire]: 0,
    [Gem.Gold]: 0,
  },
  cards: [],
  nobles: []
}

type GameAction = {
  type: "NEW_GAME",
  players: 2 | 3 | 4,
  dispatch: Dispatch<Action>;
}

type BankAction = {
  type: "TAKE_GEM" | "RETURN_GEM",
  gem: Gem,
}

type DeckAction = {
  type: "PURCHASE_CARD" | "RESERVE_CARD",
  card: Card,
  level: 1 | 2 | 3,
  index: number,
} | {
  type: "SET_DECKS",
  decks: Decks
}

type NoblesAction = {
  type: "TAKE_NOBLE",
  noble: Noble,
  index: number
} | {
  type: "SET_NOBLES",
  nobles: Noble[]
}

type Action = GameAction | BankAction | DeckAction | NoblesAction;

const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'NEW_GAME': {
      const noblesCount = action.players + 1;
      fetch(`/api/nobles/${noblesCount}`).then(resp => {
        if (!resp.ok) {
          console.log([`/api/nobles/${noblesCount}`, resp.status]);
          throw new Error("Could not load nobles");
        } else {
          resp.json().then((nobles: Noble[]) => {
            action.dispatch({ type: "SET_NOBLES", nobles })
          });
        }
      });

      const deck = fetch("/api/deck").then(resp => {
        if (!resp.ok) {
          console.log(["/api/deck", resp.status]);
          throw new Error("Could not load deck");
        } else {
          return resp.json().then((decks: Decks) => {
            action.dispatch({ type: "SET_DECKS", decks });
          });
        }
      });

      let bankChips = 7;
      if (action.players === 3) {
        bankChips = 5;
      }
      if (action.players === 2) {
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
        ...state,
        decks: "Loading",
        nobles: "Loading",
        players: Array(action.players).fill(initialPlayerState),
        bank
      }
    };
    case 'SET_DECKS': {
      return {
        ...state,
        decks: action.decks
      };
    }
    case 'SET_NOBLES': {
      return {
        ...state,
        nobles: action.nobles
      };
    };
    case 'TAKE_GEM': {
      return {
        ...state,
        bank: {
          ...state.bank,
          [action.gem]: state.bank[action.gem] - 1
        },
        players: state.players.map((player, index) => index === state.currentPlayerIndex ? ({
          ...player,
          bank: {
            ...player.bank,
            [action.gem]: player.bank[action.gem] + 1
          }
        }) : player)
      };
    };
    case 'RETURN_GEM': {
      return {
        ...state,
        bank: {
          ...state.bank,
          [action.gem]: state.bank[action.gem] + 1
        },
        players: state.players.map((player, index) => index === state.currentPlayerIndex ? ({
          ...player,
          bank: {
            ...player.bank,
            [action.gem]: player.bank[action.gem] - 1
          }
        }) : player)
      };
    };
    case 'PURCHASE_CARD': {
      if (state.decks === "Loading") {
        return { ...state }
      }

      const { level, card, index } = action;

      const bank = { ...state.bank };
      const playerBank = { ...state.players[state.currentPlayerIndex].bank };
      for (const gem of card.cost) {
        if (playerBank[gem] > 0) {
          playerBank[gem]--;
          bank[gem]++;
        } else {
          console.log("Cannot afford");
          return { ...state }
        }
      };

      const newDeck = [...state.decks[level]];
      if (state.decks[level].length > 4) {
        const replacement = state.decks[level][4];
        newDeck.splice(index, 1, replacement);
        newDeck.splice(4, 1);
      } else {
        newDeck.splice(index, 1);
      }

      return {
        ...state,
        decks: {
          ...state.decks,
          [level]: newDeck
        },
        players: state.players.map((player, index) => index === state.currentPlayerIndex ? ({
          ...player,
          cards: [...player.cards, card],
          bank: playerBank
        }) : player),
        bank: bank
      }
    }
    case 'TAKE_NOBLE': {
      if (state.nobles === "Loading") {
        return { ...state }
      }
      const { noble, index } = action;
      if (index > state.nobles.length || index < 0) {
        throw new Error("Nobles array index out of range")
      }
      return {
        ...state,
        nobles: [...state.nobles.slice(0, index), ...state.nobles.slice(index + 1)]
      }
    }
    default:
      console.log(action);
      throw new Error();
  }
}

const useGame = (): [state: GameState, dispatch: Dispatch<Action>] => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return [state, dispatch];
}
export default useGame;