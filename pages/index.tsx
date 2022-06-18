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
import dynamic from 'next/dynamic'

const Modal = dynamic(
  () => import('./../components/Modal'),
  { ssr: false }
)

const Home: NextPage = () => {
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [game, dispatch] = useGame();
  const [consideredGems, setConsideredGems] = useState<Gem[]>([]);

  const newGame = async ({ players }: { players: 2 | 3 | 4 }) => {
    dispatch({ type: "NEW_GAME", players, dispatch });
    setShowMenu(false);
  };

  const purchaseCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], card)) {
      dispatch({ type: "PURCHASE_CARD", card, source: { deck: level }, index });
    } else {
      toast.error("Can't afford");
    }
  }

  const purchaseReserved = (index: number, card: CardType): void => {
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], card)) {
      dispatch({ type: "PURCHASE_CARD", card, source: "reserved", index });
    } else {
      toast.error("Can't afford");
    }
  }

  const reserveCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    if (game.players[game.currentPlayerIndex].reserved.length < 3) {
      dispatch({ type: "RESERVE_CARD", card, level, index });
    } else {
      toast.error("Can only reserve 3 cards");
    }
  }

  const considerGem = (gem: Gem) => {
    const allConsideredGems = [...consideredGems, gem];
    if (isValidGemAction(allConsideredGems, game.bank)) {
      dispatch({ type: "TAKE_GEMS", gems: allConsideredGems });
      setConsideredGems([]);
    } else if (areValidGemsToConsider(allConsideredGems, game.bank)) {
      setConsideredGems(allConsideredGems);
    } else {
      toast.error("Invalid gem");
    }
  }

  const returnConsideredGem = (gemIndex: number) => {
    if (gemIndex >= 0 && gemIndex < consideredGems.length) {
      setConsideredGems(previous => previous.filter((gem, i) => i !== gemIndex));
    }
  }

  useEffect(() => {
    if (game.error) {
      toast.error(game.error);
    }
  }, [game.error]);

  useEffect(() => {
    if (game.winningPlayerIndex !== undefined) {
      toast.success(`WINNER! Congratulations ${game.players[game.winningPlayerIndex].name}`)
    }
  }, [game.winningPlayerIndex, game.players]);

  return (
    <>
      <Head>
        <title>Splendorific</title>
        <meta name="description" content="Splendor clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster />

      <Modal isShowing={showMenu} hide={() => setShowMenu(false)}>
        <h1>Splendorific</h1>
        <div>Welcome!  Select an option to start a new game.</div>
        <button onClick={() => newGame({ players: 2 })}>
          New 2 Player Game
        </button>
        <button onClick={() => newGame({ players: 3 })}>
          New 3 Player Game
        </button>
        <button onClick={() => newGame({ players: 4 })}>
          New 4 Player Game
        </button>
      </Modal>

      <div className={styles.shuffle}>
        <button onClick={() => setShowMenu(true)}>
          Menu
        </button>
      </div>

      <main className={styles.main}>
        <div className={styles.board}>
          <div className={styles.nobles}>
            {game.nobles !== "Loading" ? (
              game.nobles.map((noble, i) => (
                <Noble key={i} noble={noble} width={100} />
              ))
            ) : undefined}
          </div>

          <div className={styles.cards}>
            {game.decks !== "Loading" ? (
              [3, 2, 1] as Level[]).map(level => (
                <>
                  {game.decks[level].length > 4 ? <Stack level={level} width={100} /> : <CardPlaceholder size={100} />}
                  {(game.decks[level] as CardType[]).slice(0, 4).map((card, i) => (
                    <Card key={i}
                      card={card}
                      width={100}
                      onPurchase={canPlayerAffordCard(game.players[game.currentPlayerIndex], card) ? () => purchaseCard(level, i, card) : undefined}
                      onReserve={() => reserveCard(level, i, card)}
                    />
                  ))}
                  {game.decks[level].length < 4 ? Array.from(Array(4 - game.decks[level].length)).map((_, i) => 
                    <CardPlaceholder size={100} key={i} />
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
                size={70}
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
              <div className={styles.title}>
                <div className={styles.name}>{player.name}</div>
                <div className={styles.points}>{player.points} pts</div>
              </div>
              {index === game.currentPlayerIndex && consideredGems.length > 0 ? (
                <div className={styles.draftGems}>
                  {consideredGems.map((gem, index) => (
                    <Chip
                      key={index}
                      gem={gem}
                      size={30}
                      onClick={() => returnConsideredGem(index)}
                    />
                  ))}
                </div>
              ) : undefined}
              <div className={styles.bank}>
                {ALL_GEMS.map(gem => player.bank[gem] > 0 ? (
                  <Chip
                    key={gem}
                    gem={gem}
                    size={40}
                    count={player.bank[gem]}
                  />
                ) : undefined)}
              </div>
              
              {player.reserved.length > 0 ? (
                <div className={styles.reserved}>
                  {player.reserved.map((card, i) => (
                    <Card
                      key={i}
                      card={card}
                      onPurchase={index === game.currentPlayerIndex ? () => purchaseReserved(i, card) : undefined}
                      width={80}
                    />
                  ))}
                </div>
              ) : undefined}

              <div className={styles.cards}>
                {player.cards.map((card, i) => (
                  <div key={i} className={styles.stacking}>
                    <Card
                      card={card}
                      width={80}
                      hideCost
                    />
                  </div>
                ))}
              </div>
              {player.nobles.map((noble, i) => (
                <Noble key={i} noble={noble} />
              ))}
            </div>
          ))}
        </div>
      </main>
    </>
  )
}

export default Home
