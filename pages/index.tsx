import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import Card from '../components/Card'
import CardPlaceholder from '../components/CardPlaceholder'
import Chip from '../components/Chip'
import Noble from '../components/Noble'
import Stack from '../components/Stack'
import useGame from '../hooks/useGame'
import {
  ALL_GEMS,
  Card as CardType,
  GameConfiguration,
  Gem,
  Level
} from '../models'
import styles from '../styles/Home.module.scss'
import { areValidGemsToConsider, canPlayerAffordCard, isValidGemAction } from '../utils/validation';
import toast, { Toaster } from 'react-hot-toast';
import CardAnimation from '../components/CardAnimation';
import Menu from '../components/Menu';


const Home: NextPage = () => {
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [game, dispatch] = useGame();
  const [consideredGems, setConsideredGems] = useState<Gem[]>([]);

  const currentPlayerDeckRef = useRef<HTMLDivElement>(null);

  const newGame = async (configuration: GameConfiguration) => {
    if (configuration.mode === "tabletop") {
      dispatch({
        type: "NEW_GAME",
        players: configuration.players,
        dispatch
      });
    }
  };

  const purchaseCard = (level: 1 | 2 | 3, index: number, card: CardType, source: HTMLElement): void => {
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], card)) {
      dispatch({ type: "PURCHASE_CARD", card, source: { deck: level }, index });
      animateCard(card, source, document.getElementById(`player-${game.currentPlayerIndex}-cards`));
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

  const reserveCard = (level: 1 | 2 | 3, index: number, card: CardType, source: HTMLElement): void => {
    if (game.players[game.currentPlayerIndex].reserved.length < 3) {
      dispatch({ type: "RESERVE_CARD", card, level, index });
      animateCard(card, source, document.getElementById(`player-${game.currentPlayerIndex}-reserved`));
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

  // Ideal Goal of Animation:
  //  - triggered by state change (user selects chips or card)
  //  - selected thing is animated from exact source location to exact target location (including size change)
  //  - only single instace of item visible at any frame:
  //    - placeholder in source gap during animation
  //    - placeholder in target gap during animation
  //  - subsequent refill animation, if applicable (new card flipped from deck to fill empty spot caused by selection)
  //  - next move could begin during animation, and will animate independently

  // const { cardAnimations, animateCard } = useCardAnimation();

  const animateCard = (card: CardType, source: HTMLElement, target: HTMLElement | null) => {
    if (target) {
      const milliseconds = 1000;
      const start = { left: source.offsetLeft, top: source.offsetTop, width: source.offsetWidth };
      const end = { left: target.offsetLeft, top: target.offsetTop, width: 80 };
      setCardAnimations(existing => [...existing, {
        card, start, end, milliseconds
      }]);
      // remove card from animation 
      setInterval(() => {
        setCardAnimations(existing => existing.filter(a => a.card !== card))
      }, milliseconds);
    }
  }

  const [cardAnimations, setCardAnimations] = useState<{
    card: CardType,
    start: { left: number, top: number },
    end: { left: number, top: number }
  }[]>([]);

  return (
    <>
      <Head>
        <title>Splendorific</title>
        <meta name="description" content="Splendor clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster />

      <Menu
        isOpen={showMenu}
        close={() => setShowMenu(false)}
        newGame={(configuration) => newGame(configuration)}
      />

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
            {cardAnimations.map(animation => {
              return (
                <CardAnimation
                  key={JSON.stringify(animation.card)}
                  card={animation.card}
                  start={animation.start}
                  end={animation.end}
                />
              )
            })}
            {game.decks !== "Loading" ? (
              [3, 2, 1] as Level[]).map(level => (
                <>
                  {game.decks[level].length > 4 ? <Stack level={level} width={100} /> : <CardPlaceholder size={100} />}
                  {(game.decks[level] as CardType[]).slice(0, 4).map((card, i) => (
                    <Card key={i}
                      card={card}
                      width={100}
                      onPurchase={canPlayerAffordCard(game.players[game.currentPlayerIndex], card) ? (source) => purchaseCard(level, i, card, source) : undefined}
                      onReserve={(source) => reserveCard(level, i, card, source)}
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
              className={`${styles.player} ${game.currentPlayerIndex === index ? styles.current : ""}`}
              ref={game.currentPlayerIndex === index ? currentPlayerDeckRef : undefined}
            >
              <div className={styles.title}>
                <div className={styles.name}>{player.name}</div>
                <div className={styles.points}>{player.points} pts</div>
              </div>
              <div className={styles.playerContent}>
                <div className={styles.left}>
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

                  <div 
                    id={`player-${index}-cards`}
                    className={styles.cards}
                  >
                    {player.cards.map((card, i) => (
                      <div key={i} className={styles.stacking}>
                        <Card
                          card={card}
                          width={70}
                          hideCost
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.right}>
                  {player.nobles.map((noble, i) => (
                    <Noble
                      key={i}
                      noble={noble}
                      width={70}
                    />
                  ))}

                  <div
                    id={`player-${index}-reserved`}
                    className={styles.reserved}
                    style={{
                      height: player.reserved.length > 0 ? 75 + (25 * player.reserved.length) : 0,
                      width: player.reserved.length > 0 ? 45 + (25 * player.reserved.length) : 0,
                    }}
                  >
                    {player.reserved.map((card, i) => (
                      <Card
                        key={i}
                        card={card}
                        onPurchase={index === game.currentPlayerIndex ? () => purchaseReserved(i, card) : undefined}
                        width={70}
                      />
                    ))}
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}

export default Home
