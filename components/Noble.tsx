import React from "react";
import { Noble as NobleType } from "../models";
import styles from "./Noble.module.scss";

type CardColor = "green" | "white" | "blue" | "black" | "red";
const cardColors: CardColor[] = ["green", "white", "blue", "black", "red"];

type Props = {
  noble: NobleType;
}

const Noble = ({ noble }: Props) => (
  <div className={styles.noble}>
    <div className={styles.background}>
    </div>
    <div className={styles.content}>
      <div className={styles.left}>
        <div className={styles.points}>
          {noble.points}
        </div>
        <ul className={styles.cost}>
          {cardColors.filter(color => noble[color] > 0).map((cardColor: CardColor) => (
            <li key={cardColor} className={styles[cardColor]}>
              {noble[cardColor]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default Noble;