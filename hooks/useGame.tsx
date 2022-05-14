import { Dispatch, useReducer } from "react";
import { Card, Decks, Gem, Noble } from "../models";

type GameState = {
  bank: { [gem in Gem]: number };
  decks: "Loading" | Decks;
  nobles: "Loading" | Noble[];
  //players
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

const asyncActionHandler = {}

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

      return {
        ...state,
        decks: "Loading",
        nobles: "Loading"
      }
    };
    case 'TAKE_GEM': {
      return {
        ...state,
        bank: {
          ...state.bank,
          [action.gem]: state.bank[action.gem] - 1
        }
      };
    };
    case 'RETURN_GEM': {
      return {
        ...state,
        bank: {
          ...state.bank,
          [action.gem]: state.bank[action.gem] + 1
        }
      };
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
    case 'PURCHASE_CARD': {
      if (state.decks === "Loading") {
        return { ...state }
      }
      const { level, card, index } = action;
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
        }
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