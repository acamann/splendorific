import React from "react";
import { Card as CardType, Gem, NonGoldGem } from "../models";
import styles from "./Card.module.scss";

type Props = {
  card: CardType;
  onClick: () => void;
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

const Card = ({ card, onClick }: Props) => (
  <div className={`${styles.card} ${getClassNameFromGem(card.gem)}`} onClick={onClick}>
    <div className={styles.background} data-image-id={card.imageId}>
    </div>
    <div className={styles.content}>
      <div className={styles.top}>
        <div className={styles.points}>
          {card.points > 0 ? card.points : undefined}
        </div>
        <div className={styles.gem}></div>
      </div>
      <ul className={styles.cost}>
        {Object.entries(Gem)
          .filter(([key, gem]) => card.cost.includes(gem as NonGoldGem))
          .map(([key, gem]) => (
            <li key={key} className={getClassNameFromGem(gem as NonGoldGem)}>
              {card.cost.filter(c => c === gem as NonGoldGem).length}
            </li>
          ))
        }
      </ul>
    </div>
  </div>
);

export default Card;