import React from "react";
import Image from 'next/image'
import { Card as CardType, Gem, NonGoldGem } from "../models";
import styles from "./Card.module.scss";

type Props = {
  card: CardType;
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

const getRandom = <T,>(arr: T[]): T => arr[~~(Math.random() * arr.length)];

const getImageNumberForGem = (gem: NonGoldGem): string => {
  switch (gem) {
    case Gem.Onyx: return getRandom(["1019", "1033", "1075", "1078"]);
    case Gem.Sapphire: return getRandom(["1015", "1031", "1036", "1038", "1041"]);
    case Gem.Diamond: return getRandom(["1000", "1021", "1035", "1052"]);
    case Gem.Emerald: return getRandom(["1003", "101", "1012", "1039", "1053"]);
    case Gem.Ruby: return getRandom(["1028", "1032", "1047", "1055", "1073"]);
  }
}

const imageLoader = (gem: NonGoldGem) => `https://picsum.photos/id/${getImageNumberForGem(gem)}/125/175`;

const Card = ({
  card
}: Props) => (
  <div className={`${styles.card} ${getClassNameFromGem(card.gem)}`}>
    <div className={styles.background}>
      <Image
        loader={() => imageLoader(card.gem)}
        src="https://picsum.photos/125/175/"
        layout="fill"
        alt=""
      />
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