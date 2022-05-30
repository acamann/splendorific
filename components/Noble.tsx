import React from "react";
import { Noble as NobleType } from "../models";
import styles from "./Noble.module.scss";

type CardColor = "green" | "white" | "blue" | "black" | "red";
const cardColors: CardColor[] = ["green", "white", "blue", "black", "red"];

type Props = {
  noble: NobleType;
  width?: number;
}

const Noble = ({ noble, width = 125 }: Props) => (
  <div className={styles.noble} style={{ width, height: width }}>
    <div className={styles.background}>
    </div>
    <div className={styles.content}>
      <div className={styles.left}>
        <div className={styles.points} style={{ fontSize: width * 0.25 }}>
          {noble.points}
        </div>
        <ul className={styles.cost}>
          {cardColors.filter(color => noble[color] > 0).map((cardColor: CardColor) => (
            <li
              key={cardColor}
              className={styles[cardColor]}
              style={{
                width: width * 0.144,
                height: width * 0.192,
                fontSize: width * 0.16
              }}
            >
              {noble[cardColor]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default Noble;