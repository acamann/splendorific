import { Dispatch, useReducer } from "react";
import { Bank, Card, Decks, EMPTY_BANK, Gem, Noble, Player } from "../models";
import { getBankValueOfCards, isValidGemAction } from "../utils/validation";

type GameState = {
  bank: Bank;
  decks: "Loading" | Decks;
  nobles: "Loading" | Noble[];
  players: Player[];
  currentPlayerIndex: number;
  error: string;
}

const initialState: GameState = {
  bank: EMPTY_BANK,
  decks: {
    [1]: [],
    [2]: [],
    [3]: []
  },
  nobles: [],
  players: [],
  currentPlayerIndex: 0,
  error: ""
}

const initialPlayerState: Player = {
  bank: EMPTY_BANK,
  cards: [],
  nobles: [],
  points: 0
}

type GameAction = {
  type: "NEW_GAME",
  players: 2 | 3 | 4,
  dispatch: Dispatch<Action>;
} | {
  type: "SET_DECKS",
  decks: Decks
} | {
  type: "SET_NOBLES",
  nobles: Noble[]
}

type PlayerAction = {
  type: "TAKE_GEMS",
  gems: Gem[]
} | {
  type: "RESERVE_CARD",
  card: Card,
  level: 1 | 2 | 3,
  index: number
} | {
  type: "PURCHASE_CARD",
  card: Card,
  source: { deck: 1 | 2 | 3 } | "reserved",
  index: number
}

type Action = GameAction | PlayerAction;

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
        bank,
        currentPlayerIndex: 0
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
    case 'TAKE_GEMS': {
      if (!isValidGemAction(action.gems, state.bank)) {
        return {
          ...state,
          error: "Invalid action"
        }
      }

      const bank = { ...state.bank };
      const playerBank = { ...state.players[state.currentPlayerIndex].bank };
      for (const gem of action.gems) {
        playerBank[gem]++;
        bank[gem]--;
      }

      return {
        ...state,
        bank: bank,
        players: state.players.map((player, index) => index === state.currentPlayerIndex ? ({
          ...player,
          bank: playerBank
        }) : player),
        currentPlayerIndex: (state.currentPlayerIndex < state.players.length - 1) ? state.currentPlayerIndex + 1 : 0
      };
    };
    case 'PURCHASE_CARD': {
      if (state.decks === "Loading") {
        return { ...state }
      }

      const { source, card, index } = action;

      const bank = { ...state.bank };
      const playerBank = { ...state.players[state.currentPlayerIndex].bank };
      const playerCardValues = getBankValueOfCards([...state.players[state.currentPlayerIndex].cards]);
      for (const gem of card.cost) {
        if (playerCardValues[gem] > 0) {
          playerCardValues[gem]--; //
        } else if (playerBank[gem] > 0) {
          playerBank[gem]--;
          bank[gem]++;
        } else if (playerBank[Gem.Gold] > 0) {
          playerBank[Gem.Gold]--;
          bank[Gem.Gold]++;
        } else {
          return {
            ...state,
            error: "Cannot afford"
          }
        }
      };

      let newDecks = { ...state.decks };
      if (source === "reserved") {
        // do stuff to purchase reserved card (different action)
      } else {
        const newDeck = [...state.decks[source.deck]];
        if (state.decks[source.deck].length > 4) {
          const replacement = state.decks[source.deck][4];
          newDeck.splice(index, 1, replacement);
          newDeck.splice(4, 1);
        } else {
          newDeck.splice(index, 1);
        }
        newDecks = {
          ...state.decks,
          [source.deck]: newDeck
        }
      }

      let newPoints = card.points;

      if (state.nobles !== "Loading") {
        //const playerCardValues = getBankValueOfCards([...state.players[state.currentPlayerIndex].cards]);
        for (const noble of state.nobles) {
          // if qualified for this noble, take the points & remove the noble
        }
      }

      return {
        ...state,
        decks: newDecks,
        players: state.players.map((player, index) => index === state.currentPlayerIndex ? ({
          ...player,
          cards: [...player.cards, card],
          bank: playerBank,
          points: player.points + newPoints
        }) : player),
        bank: bank,
        currentPlayerIndex: (state.currentPlayerIndex < state.players.length - 1) ? state.currentPlayerIndex + 1 : 0
      }
    }
    default:
      return {
        ...state,
        error: `Unknown action: ${JSON.stringify(action)}`
      }
  }
}

const useGame = (): [state: GameState, dispatch: Dispatch<Action>] => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return [state, dispatch];
}
export default useGame;