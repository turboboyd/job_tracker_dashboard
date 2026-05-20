import AuthModal from 'components/Form/AuthForm/AuthModal';
import css from './HeroTitleWrap.module.css';
import BasicModal from 'components/Modal/BasicModal';
import useModal from 'hooks/useModal';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectRandomStyle } from '../../redux/auth/authSelectors';

export default function HeroTitleWrap() {
  const { isModalOpen, openModal, closeModal } = useModal();
  const randomStyle = useSelector(selectRandomStyle);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    closeModal();
    navigate('/teachers', { replace: true });
  };

  return (
    <div className={css.wrap_title}>
      <h1 className={css.title}>
        Unlock your potential with the best{' '}
        <span
          className={`${css.title_span}`}
          style={{ backgroundColor: randomStyle.background }}
        >
          language
        </span>{' '}
        tutors
      </h1>
      <p className={css.text}>
        Find experienced language tutors, compare profiles, save favorites and
        book a trial lesson in a few clicks.
      </p>
      <button
        type="button"
        className={`${css.btn} ${css[randomStyle.name]}`}
        style={{
          '--color-btn': randomStyle.btn,
          '--active-color-btn': randomStyle.background,
        }}
        onClick={() => openModal('registration')}
      >
        Find a tutor
      </button>
      {isModalOpen && (
        <BasicModal
          isModal={closeModal}
          closeOnOverlay={false}
          closeOnEscape={false}
        >
          <AuthModal
            modalContent="registration"
            onAuthSuccess={handleAuthSuccess}
          />
        </BasicModal>
      )}
    </div>
  );
}
