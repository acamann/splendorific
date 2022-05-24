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

const Chip = ({ gem, count, onClick, size }: Props) => (
  <div
    className={`${styles.border}  ${getClassNameFromGem(gem)}`}
    style={{ width: size ?? 80, height: size ?? 80 }}
  >
    <div
      className={`${styles.chip} ${onClick ? styles.clickable : undefined}`}
      onClick={() => onClick?.(gem)}
    >
      <div className={styles.gem}>
        {count}
      </div>
    </div>
  </div>
);

export default Chip;