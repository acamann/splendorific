import React from "react";
import { Noble as NobleType } from "../models";
import styles from "./Noble.module.scss";

type CardColor = "green" | "white" | "blue" | "black" | "red";
const cardColors: CardColor[] = ["green", "white", "blue", "black", "red"];

type Props = {
  noble: NobleType;
  onClick?: () => void;
}

const Noble = ({ noble, onClick }: Props) => (
  <div className={styles.noble} onClick={onClick}>
    <div className={styles.background}>
    </div>
    <div className={styles.content}>
      <div className={styles.left}>
        <div className={styles.points}>
          {noble.points}
        </div>
        <ul className={styles.cost}>
          {cardColors.map((cardColor: CardColor) => noble[cardColor] > 0 ? (
            <li key={cardColor} className={styles[cardColor]}>
              {noble[cardColor]}
            </li>
          ) : undefined )}
        </ul>
      </div>
    </div>
  </div>
);

export default Noble;