import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import css from './BasicModal.module.css';
import PropTypes from 'prop-types';

const modalRoot = document.querySelector('#modal-root');

function BasicModal({ isModal, children, closeOnOverlay = true, closeOnEscape = true }) {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape' && closeOnEscape) {
        isModal();
      }
    };

    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModal, closeOnEscape]);

  const handleOverlayClick = event => {
    if (closeOnOverlay && event.target === event.currentTarget) {
      isModal();
    }
  };

  const stopModalEvent = event => {
    event.stopPropagation();
  };

  return createPortal(
    <div className={css.Overlay} onClick={handleOverlayClick}>
      <div className={css.modal} onClick={stopModalEvent}>
        {children}
      </div>
    </div>,
    modalRoot
  );
}

export default BasicModal;

BasicModal.propTypes = {
  isModal: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  closeOnOverlay: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
};
