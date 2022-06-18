import React, { useEffect, useState } from "react";
import { Card as CardType } from "../models";
import Card from "./Card";
import styles from "./CardAnimation.module.scss";

type Props = {
  card: CardType;
  start: { left: number, top: number, width?: number };
  end: { left: number, top: number, width?: number };
}

const CardAnimation = ({
  card,
  start,
  end,
}: Props) => {
  const [position, setPosition] = useState<{ left: number, top: number, width?: number }>({ left: start.left, top: start.top, width: start.width })

  useEffect(() => {
    setPosition({ left: end.left, top: end.top, width: end.width });
  }, [end]);

  return (
    <div className={styles.animate} style={{ left: position.left, top: position.top }}>
      <Card card={card} width={position.width} />
    </div>
  );
}

export default CardAnimation;