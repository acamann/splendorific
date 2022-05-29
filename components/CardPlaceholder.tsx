import React from "react";
import styles from "./Card.module.scss";

type Props = {
  size?: number;
}

const CardPlaceholder = ({ size = 125 }: Props) => (
  <div className={styles.placeholder} style={{ width: size, height: 7 * size / 5 }}>
  </div>
);

export default CardPlaceholder;