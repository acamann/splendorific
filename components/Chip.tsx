import React from "react";
import { Gem } from "../models";
import styles from "./Chip.module.scss";

type Props = {
  gem: Gem;
  count?: number;
  onClick?: (gem: Gem) => void;
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

const Chip = ({ gem, count, onClick }: Props) => (
  <div className={`${styles.chip} ${getClassNameFromGem(gem)}`} onClick={() => onClick?.(gem)}>
    <div className={styles.gem}>{count}</div>
  </div>
);

export default Chip;