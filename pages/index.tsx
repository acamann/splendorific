import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import CardPlaceholder from '../components/CardPlaceholder'
import Chip from '../components/Chip'
import Noble from '../components/Noble'
import Stack from '../components/Stack'
import {
  ALL_GEMS,
  Card as CardType,
  Gem,
  Level,
} from '../models'
import styles from '../styles/Home.module.scss'
import { areValidGemsToConsider, isValidGemAction } from '../utils/validation';
import toast, { Toaster } from 'react-hot-toast';
import Menu from '../components/Menu'
import WinModal from '../components/WinModal'
import { canPlayerAffordCard, getTotalChipCount } from '../gameState/helpers'
import { GameState, getRandomGame, initialPlayerState, initialState, takeTurnPurchaseCard, takeTurnPurchaseReservedCard, takeTurnReserveCard, takeTurnTakeChips } from '../gameState'

const Home: NextPage = () => {
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [game, setGame] = useState<GameState>(initialState);
  const [consideredGems, setConsideredGems] = useState<Gem[]>([]);

  const newGame = async (playerSettings: { name: string, aiExperience?: number }[]) => {
    const players = playerSettings.map(player => {
      return {
        ...initialPlayerState,
        name: player.name,
        aiExperience: player.aiExperience
      }
    });
    setGame(getRandomGame(players));
  };

  const purchaseCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], card)) {
      setGame(game => takeTurnPurchaseCard(game, card))
    } else {
      toast.error("Can't afford");
    }
  }

  const purchaseReserved = (index: number, card: CardType): void => {
    if (canPlayerAffordCard(game.players[game.currentPlayerIndex], card)) {
      setGame(game => takeTurnPurchaseReservedCard(game, card));
    } else {
      toast.error("Can't afford");
    }
  }

  const reserveCard = (level: 1 | 2 | 3, index: number, card: CardType): void => {
    if (game.players[game.currentPlayerIndex].reserved.length >= 3) {
      toast.error("Can only reserve 3 cards");
    } else if (game.bank[Gem.Gold] > 0 && getTotalChipCount(game.players[game.currentPlayerIndex].bank) === 10) {
      // will have more than 10 after reserving
      // TODO: force selection to return or cancel
      toast.error("Cannot have more than 10 chips");
    } else {
      setGame(game => takeTurnReserveCard(game, card));
    }
  }

  const considerGem = (gem: Gem) => {
    const allConsideredGems = [...consideredGems, gem];
    if (isValidGemAction(allConsideredGems, game.bank)) {
      if (getTotalChipCount(game.players[game.currentPlayerIndex].bank) + allConsideredGems.length > 10) {
        // will have more than 10 after reserving, force selection to return or cancel
        toast.error("Cannot have more than 10 chips");
        return;
      }
      setGame(game => takeTurnTakeChips(game, allConsideredGems));
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
    // get type of current player
    // if AI, wait a bit (depending on configured speed), then take turn
    // if not, do nothing and wait for human input
  }, [game.currentPlayerIndex]);

  return (
    <>
      <Head>
        <title>Splendorific</title>
        <meta name="description" content="Splendor clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster />

      {game.winningPlayerIndex !== undefined ? (
        <WinModal
          winner={game.players[game.winningPlayerIndex].name}
          close={() => {
            setGame(initialState);
            setShowMenu(true);
          }}
        />
      ) : undefined}

      <Menu
        isOpen={showMenu}
        close={() => setShowMenu(false)}
        newGame={(players) => newGame(players)}
      />

      <div className={styles.shuffle}>
        <button onClick={() => setShowMenu(true)}>
          Menu
        </button>
      </div>

      <main className={styles.main}>
        <div className={styles.board}>
          <div className={styles.nobles}>
            {game.nobles.map((noble, i) => (
              <Noble key={i} noble={noble} width={100} />
            ))}
          </div>

          <div className={styles.cards}>
            {([3, 2, 1] as Level[]).map(level => (
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
            ))}
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

                  <div className={styles.cards}>
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
                  {player.reserved.length > 0 ? (
                    <div
                      className={styles.reserved}
                      style={{
                        height: player.reserved.length > 0 ? 75 + (25 * player.reserved.length) : undefined,
                        width: player.reserved.length > 0 ? 45 + (25 * player.reserved.length) : undefined,
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
                  ) : undefined}
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
