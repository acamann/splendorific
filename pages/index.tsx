import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Chip from '../components/Chip'
import Stack from '../components/Stack'
import { Card as CardType, Gem } from '../models'
import styles from '../styles/Home.module.css'

type Decks = {
  one: CardType[],
  two: CardType[],
  three: CardType[]
}

const Home: NextPage = () => {
  const [deck, setDeck] = useState<Decks>();

  // https://dev.to/codymjarrett/understanding-how-api-routes-work-in-next-js-50fm
  const init = async () => {
    const response = await fetch("/api/deck");
    if (!response.ok) {
      console.log(response.status);
      return;
    }
    const responseJson: Decks = await response.json();
    setDeck(responseJson);
  };

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

        <div className={styles.board}>
          <Stack level={3} />
          {deck?.three.slice(0, 4)
            .map((card, i) => (
              <Card key={i} card={card} />
            ))
          }

          <Stack level={2} />
          {deck?.two.slice(0, 4)
            .map((card, i) => (
              <Card key={i} card={card} />
            ))
          }

          <Stack level={1} />
          {deck?.one.slice(0, 4)
            .map((card, i) => (
              <Card key={i} card={card} />
            ))
          }
        </div>

        <div className={styles.bank}>
          <Chip gem={Gem.Gold} />
          <Chip gem={Gem.Emerald} />
          <Chip gem={Gem.Ruby} />
          <Chip gem={Gem.Sapphire} />
          <Chip gem={Gem.Diamond} />
          <Chip gem={Gem.Onyx} />
        </div>

      </main>
    </div>
  )
}

export default Home
