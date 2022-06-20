import React from "react";
import dynamic from "next/dynamic";
import styles from "./WinModal.module.scss";

const Modal = dynamic(
  () => import('./Modal'),
  { ssr: false }
)

interface Props {
  winner: string;
  close: () => void;
}

const WinModal = ({
  winner,
  close,
}: Props) => {

  return (
    <Modal title="Winner!" isShowing={true} hide={close}>
      <div className={styles.menu}>
        <div>Congratulations {winner}!</div>
        <button onClick={close}>
          New game
        </button>
      </div>
    </Modal>
  )
}

export default WinModal;