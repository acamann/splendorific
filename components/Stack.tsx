import React from "react";
import styles from "./Card.module.scss";

type Props = {
  level: 1 | 2 | 3;
  width?: number;
}

const Stack = ({
  level,
  width = 125
}: Props) => (
  <div className={styles.stack} data-level={level} style={{ width, height: 7 * width / 5 }}>
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