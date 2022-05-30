import React from "react";
import { Gem } from "../models";
import styles from "./Chip.module.scss";

type Props = {
  gem: Gem;
  count?: number;
  onClick?: (gem: Gem) => void;
  size?: number;
}

const getClassNameFromGem = (gem: Gem): string => {
  switch (gem) {
    case Gem.Onyx: return styles.onyx;
    case Gem.Sapphire: return styles.sapphire;
    case Gem.Diamond: return styles.diamond;
    case Gem.Emerald: return styles.emerald;
    case Gem.Ruby: return styles.ruby;
    case Gem.Gold: return styles.gold;
  }
}

const Chip = ({ gem, count, onClick, size = 80 }: Props) => (
  <div
    className={`${styles.border}  ${getClassNameFromGem(gem)}`}
    style={{ width: size, height: size }}
  >
    <div
      className={`${styles.chip} ${onClick ? styles.clickable : undefined}`}
      onClick={() => onClick?.(gem)}
    >
      <div className={styles.gem} style={{ fontSize: size * 0.75 }}>
        {count}
      </div>
    </div>
  </div>
);

export default Chip;