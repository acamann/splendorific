import React from 'react';
import ReactDOM from 'react-dom';
import styles from "./Modal.module.scss";

type Props = {
  isShowing: boolean;
  hide: () => void;
  children: React.ReactNode;
}

const Modal = ({ isShowing, hide, children }: Props) => document.body && isShowing ? ReactDOM.createPortal(
  <React.Fragment>
    <div className={styles.overlay}/>
    <div className={styles.wrapper} aria-modal aria-hidden tabIndex={-1} role="dialog">
      <div className={styles.modal}>
        <div className={styles.header}>
          <button type="button" className={styles.close} data-dismiss="modal" aria-label="Close" onClick={hide}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <p>
          {children}
        </p>
      </div>
    </div>
  </React.Fragment>, document.body
) : null;

export default Modal;