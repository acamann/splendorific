import React, { useState } from "react";
import { Card as CardType, Gem, NonGoldGem } from "../models";
import styles from "./Card.module.scss";

type Props = {
  card: CardType;
  onPurchase?: () => void;
  onReserve?: () => void;
  width?: number;
  hideCost?: boolean;
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

const Card = ({ card, onPurchase, onReserve, width = 125, hideCost = false }: Props) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isClickable = onPurchase || onReserve;

  return (
    <div
      className={`${styles.card} ${getClassNameFromGem(card.gem)} ${isHovered && styles.hovered}`}
      onMouseEnter={(): void => isClickable && setIsHovered(true)}
      onMouseLeave={(): void => isClickable && setIsHovered(false)}
      style={{ width, height: 7 * width / 5 }}
    >
      <div className={styles.background} data-image-id={card.imageId}>
      </div>
      <div className={styles.content}>
        <div className={styles.top}>
          <div className={styles.points} style={{ fontSize: width / 4 }}>
            {card.points > 0 ? card.points : undefined}
          </div>
          <div className={styles.gem}></div>
        </div>
        {!hideCost ? (
          <ul className={styles.cost}>
            {Object.entries(Gem)
              .filter(([key, gem]) => card.cost.includes(gem as NonGoldGem))
              .map(([key, gem]) => (
                <li
                  key={key}
                  className={getClassNameFromGem(gem as NonGoldGem)}
                  style={{ width: width / 5, height: width / 5, fontSize: width  * 0.18 }}
                >
                  {card.cost.filter(c => c === gem as NonGoldGem).length}
                </li>
              ))
            }
          </ul>
        ) : undefined}
        {isHovered ? (
          <div className={styles.actions}>
            {onPurchase ? <button onClick={onPurchase}>Purchase</button> : undefined}
            {onReserve ? <button onClick={onReserve}>Reserve</button> : undefined}
          </div>
        ) : undefined}
      </div>
    </div>
  );
}

export default Card;