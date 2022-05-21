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
import styles from '../styles/Home.module.scss'

const allGems = (Object.keys(Gem)
  .filter(key => isNaN(Number(key))) as (keyof typeof Gem)[])
  .map(key => Gem[key]);

const Home: NextPage = () => {
  const [game, dispatch] = useGame();

  const newGame = async ({ players }: { players: 2 | 3 | 4 }) => {
    dispatch({ type: "NEW_GAME", players, dispatch });
  };

  const takeCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    dispatch({ type: "PURCHASE_CARD", card, level, index })
  }

  const takeNoble = (noble: NobleType, index: number) => {
    dispatch({ type: "TAKE_NOBLE", noble, index });
  }

  const takeGem = (gem: Gem) => {
    dispatch({ type: "TAKE_GEM", gem });
  }

  const returnGem = (gem: Gem) => {
    dispatch({ type: "RETURN_GEM", gem });
  }

  useEffect(() => {
    newGame({ players: 3 });
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Splendorific</title>
        <meta name="description" content="Splendor clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.shuffle}>
          <button onClick={() => newGame({ players: 2 })}>
            New 2 Player Game
          </button>
          <button onClick={() => newGame({ players: 3 })}>
            New 3 Player Game
          </button>
          <button onClick={() => newGame({ players: 4 })}>
            New 4 Player Game
          </button>
        </div>

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
          {allGems.map(gem => game.bank[gem] > 0 ? (
            <Chip
              key={gem}
              gem={gem}
              count={game.bank[gem]}
              onClick={() => takeGem(gem)}
            />
          ) : undefined)}
        </div>

        {game.players.map((player, index) => (
          <div className={styles.player} key={index}>
            <div className={styles.name}>Player {index + 1}</div>
            <div className={styles.bank}>
              {allGems.map(gem => player.bank[gem] > 0 ? (
                <Chip
                  key={gem}
                  gem={gem}
                  count={player.bank[gem]}
                  onClick={() => returnGem(gem)}
                />
              ) : undefined)}
            </div>
            <div className={styles.cards}>
              {player.cards.map((card, i) => (
                <Card key={i}
                  card={card}
                  onClick={() => undefined}
                />
              ))}
            </div>
            {player.nobles.map((noble, i) => (
              <Noble key={i}
                noble={noble}
                onClick={() => undefined}
              />
            ))}
          </div>
        ))}
      </main>
    </div>
  )
}

export default Home
