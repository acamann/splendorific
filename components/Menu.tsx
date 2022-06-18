import React from "react";
import dynamic from "next/dynamic";
import { GameConfiguration } from "../models";
import styles from "./Menu.module.scss";

const Modal = dynamic(
  () => import('./Modal'),
  { ssr: false }
)

interface Props {
  isOpen: boolean;
  close: () => void;
  newGame: (configuration: GameConfiguration) => void;
}

const Menu = ({
  isOpen,
  close,
  newGame,
}: Props) => {

  const newTableTopGame = (players: 2 | 3 | 4) => () => {
    newGame({ players, mode: "tabletop" });
    close();
  }

  return (
    <Modal isShowing={isOpen} hide={close}>
      <div className={styles.menu}>
        <h1>Splendorific</h1>
        <div>Welcome!  Select an option to start a new game.</div>

        <h2>Tabletop</h2>
        <div className={styles.description}>Human players taking turns on the same device.</div>
        <div className={styles.options}>
          <button onClick={newTableTopGame(2)}>
            New 2 Player Game
          </button>
          <button onClick={newTableTopGame(3)}>
            New 3 Player Game
          </button>
          <button onClick={newTableTopGame(4)}>
            New 4 Player Game
          </button>
        </div>

        <h2>Online</h2>
        <div className={styles.description}>Human players playing live from different devices.</div>
        <div className={styles.options}>
          <button onClick={() => newGame({ mode: "online" })}>
            Create Game
          </button>
          <div>
            <input />
            <button onClick={() => newGame({ mode: "online", roomId: "something from input" })}>
              Join Game
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default Menu;