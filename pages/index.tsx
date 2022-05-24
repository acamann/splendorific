import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import CardPlaceholder from '../components/CardPlaceholder'
import Chip from '../components/Chip'
import Noble from '../components/Noble'
import Stack from '../components/Stack'
import useGame from '../hooks/useGame'
import {
  ALL_GEMS,
  Card as CardType,
  Gem,
  Level
} from '../models'
import styles from '../styles/Home.module.scss'
import { areValidGemsToConsider, canPlayerAffordCard, isValidGemAction } from '../utils/validation';
import toast, { Toaster } from 'react-hot-toast';

const Home: NextPage = () => {
  const [game, dispatch] = useGame();
  const [consideredGems, setConsideredGems] = useState<Gem[]>([]);

  const newGame = async ({ players }: { players: 2 | 3 | 4 }) => {
    dispatch({ type: "NEW_GAME", players, dispatch });
  };

  const takeCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], card)) {
      dispatch({ type: "PURCHASE_CARD", card, source: { deck: level }, index });
    } else {
      toast.error("Can't afford");
    }
  }

  const considerGem = (gem: Gem) => {
    if (areValidGemsToConsider([...consideredGems, gem], game.bank)) {
      setConsideredGems(previous => [...previous, gem]);
    } else {
      toast.error("Invalid gem");
    }
  }

  const takeConsideredGems = () => {
    if (isValidGemAction(consideredGems, game.bank)) {
      dispatch({ type: "TAKE_GEMS", gems: consideredGems });
      setConsideredGems([]);
    } else {
      toast.error("Invalid gems")
    }
  }

  const returnConsideredGem = (gemIndex: number) => {
    if (gemIndex >= 0 && gemIndex < consideredGems.length) {
      setConsideredGems(previous => previous.filter((gem, i) => i !== gemIndex));
    }
  }

  useEffect(() => {
    newGame({ players: 3 });
  }, []);

  useEffect(() => {
    if (game.error) {
      toast.error(game.error);
    }
  }, [game.error])

  return (
    <>
      <Head>
        <title>Splendorific</title>
        <meta name="description" content="Splendor clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster />

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

      <main className={styles.main}>
        <div className={styles.board}>
          <div className={styles.nobles}>
            {game.nobles !== "Loading" ? (
              game.nobles.map((noble, i) => (
                <Noble key={i} noble={noble} />
              ))
            ) : undefined}
          </div>

          <div className={styles.cards}>
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
            {ALL_GEMS.map(gem => game.bank[gem] > 0 ? (
              <Chip
                key={gem}
                gem={gem}
                count={game.bank[gem] - consideredGems.filter(consideredGem => consideredGem === gem).length}
                onClick={() => considerGem(gem)}
              />
            ) : undefined)}
          </div>
        </div>

        <div className={styles.players}>
          {game.players.map((player, index) => (
            <div key={index}
              className={`${styles.player} ${game.currentPlayerIndex === index ? styles.current : undefined}`}
            >
              <div className={styles.name}>Player {index + 1} ({player.points} points)</div>
              {index === game.currentPlayerIndex && consideredGems.length > 0 ? (
                <div className={styles.draftGems}>
                  {consideredGems.map((gem, index) => (
                    <Chip
                      key={index}
                      gem={gem}
                      size={40}
                      onClick={() => returnConsideredGem(index)}
                    />
                  ))}
                  <button onClick={() => takeConsideredGems()} disabled={!isValidGemAction(consideredGems, game.bank)}>
                    &#10003;
                  </button>
                </div>
              ) : undefined}
              <div className={styles.bank}>
                {ALL_GEMS.map(gem => player.bank[gem] > 0 ? (
                  <Chip
                    key={gem}
                    gem={gem}
                    size={60}
                    count={player.bank[gem]}
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
        </div>
      </main>
    </>
  )
}

export default Home
