import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect } from 'react'
import Card from '../components/Card'
import CardPlaceholder from '../components/CardPlaceholder'
import Chip from '../components/Chip'
import Noble from '../components/Noble'
import Stack from '../components/Stack'
import useGame from '../hooks/useGame'
import {
  Card as CardType,
  Gem,
  Level,
  Noble as NobleType
} from '../models'
import styles from '../styles/Home.module.css'

const allGems = (Object.keys(Gem)
  .filter(key => isNaN(Number(key))) as (keyof typeof Gem)[])
  .map(key => Gem[key]);

const Home: NextPage = () => {
  const [game, dispatch] = useGame();

  const init = async () => {
    dispatch({ type: "NEW_GAME", players: 3, dispatch });
  };

  const takeCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    dispatch({ type: "PURCHASE_CARD", card, level, index })
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
          {game.nobles !== "Loading" ? (
            game.nobles.map((noble, i) => (
              <Noble key={i}
                noble={noble}
                onClick={() => takeNoble(noble, i)}
              />
            ))
          ) : undefined}
        </div>

        <div className={styles.board}>
          {game.decks !== "Loading" ? (
            [3, 2, 1] as Level[]).map(level => (
              <>
                {game.decks[level].length > 4 ? <Stack level={level} /> : <CardPlaceholder />}
                {(game.decks[level] as CardType[]).slice(0, 4).map((card, i) => (
                  <Card key={i}
                    card={card}
                    onClick={() => takeCard(level, i, card)}
                  />
                ))}
                {game.decks[level].length < 4 ? Array.from(Array(4 - game.decks[level].length)).map((_, i) => 
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
