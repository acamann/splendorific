import React from "react";
import { Card as CardType, Gem, NonGoldGem } from "../models";
import styles from "./Card.module.scss";

type Props = {
  level: 1 | 2 | 3;
}

const Stack = ({
  level
}: Props) => (
  <div className={styles.stack}>
    <div className={styles.title}>
      Splendorific
    </div>
    <div className={styles.level}>
      {Array.from(Array(level)).map((_, i) => 
        <div key={i} className={styles.pip}></div>
      )}
    </div>
  </div>
);

export default Stack;