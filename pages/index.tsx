import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import CardPlaceholder from '../components/CardPlaceholder'
import Chip from '../components/Chip'
import Noble from '../components/Noble'
import Stack from '../components/Stack'
import {
  Card as CardType,
  Gem,
  Level,
  Decks,
  Noble as NobleType
} from '../models'
import styles from '../styles/Home.module.css'

const allGems = (Object.keys(Gem)
  .filter(key => isNaN(Number(key))) as (keyof typeof Gem)[])
  .map(key => Gem[key]);

// type BankState = {
//   [key in Gem]: number;
// }

// type BankAction = {
//   type: "TAKE" | "RETURN",
//   gem: Gem,
// }
// const initialBank = {
//   [Gem.Diamond]: 7,
//   [Gem.Onyx]: 7,
//   [Gem.Emerald]: 7,
//   [Gem.Ruby]: 7,
//   [Gem.Sapphire]: 7,
//   [Gem.Gold]: 7,
// };

// const bankReducer = (state: BankState, action: BankAction): BankState => {
//   switch (action.type) {
//     case 'TAKE':
//       return {
//         ...state,
//         [action.gem]: state[action.gem] - 1
//       };
//     case 'RETURN':
//       return {
//         ...state,
//         [action.gem]: state[action.gem] + 1
//       };
//     default:
//       throw new Error();
//   }
// }

const Home: NextPage = () => {
  const [deck, setDeck] = useState<Decks>();
  const [nobles, setNobles] = useState<NobleType[]>();
  //const [bank, bankDispatch] = useReducer(bankReducer, initialBank);

  const init = async () => {
    const nobleResponse = await fetch("/api/nobles/4");
    if (!nobleResponse.ok) {
      console.log(nobleResponse.status);
      return;
    }
    const nobleJson: NobleType[] = await nobleResponse.json();
    setNobles(nobleJson);

    const deckResponse = await fetch("/api/deck");
    if (!deckResponse.ok) {
      console.log(deckResponse.status);
      return;
    }
    const deckJson: Decks = await deckResponse.json();
    setDeck(deckJson);
  };

  const takeCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    if (deck) {
      const newDeck = [...deck[level]];
      if (deck[level].length > 4) {
        const replacement = deck[level][4];
        newDeck.splice(index, 1, replacement);
        newDeck.splice(4, 1);
      } else {
        newDeck.splice(index, 1);
      }
      setDeck({ ...deck, [level]: newDeck });
    }
  }

  const takeNoble = (noble: NobleType, index: number) => {
    console.log(noble);
  }

  useEffect(() => {
    init();
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Splendorific</title>
        <meta name="description" content="Splendor clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <button className={styles.shuffle} onClick={() => init()}>Shuffle</button>

        <div className={styles.nobles}>
          {nobles ? (
            nobles.map((noble, i) => (
              <Noble key={i}
                noble={noble}
                onClick={() => takeNoble(noble, i)}
              />
            ))
          ) : undefined}
        </div>

        <div className={styles.board}>
          {deck ? (
            [3, 2, 1] as Level[]).map(level => (
              <>
                {deck[level].length > 4 ? <Stack level={level} /> : <CardPlaceholder />}
                {deck[level].slice(0, 4).map((card, i) => (
                  <Card key={i}
                    card={card}
                    onClick={() => takeCard(level, i, card)}
                  />
                ))}
                {deck[level].length < 4 ? Array.from(Array(4 - deck[level].length)).map((_, i) => 
                  <CardPlaceholder key={i} />
                ) : undefined}
              </>
            )
          ) : undefined}
        </div>

        <div className={styles.bank}>
          {allGems.map(gem => <Chip key={gem} gem={gem} />)}
        </div>

      </main>
    </div>
  )
}

export default Home
