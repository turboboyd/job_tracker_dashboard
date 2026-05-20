import css from './BtnAuth.module.css';
import BasicModal from 'components/Modal/BasicModal';
import AuthModal from 'components/Form/AuthForm/AuthModal';
import useAuth from 'hooks/useAuth';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../../redux/auth/authOperation';
import useModal from 'hooks/useModal';
import sprite from 'images/InlineSprite.svg';
import { clearFavorites } from '../../../redux/favorite/favoriteSlice';

export default function BtnAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isModalOpen, modalContent, openModal, closeModal } = useModal();
  const { user, IsAuthCheck } = useAuth();

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(clearFavorites());
  };

  const handleAuthSuccess = () => {
    closeModal();
    navigate('/teachers', { replace: true });
  };

  return (
    <>
      {IsAuthCheck ? (
        <div className={css.list_btn}>
          <p className={css.name}>Hello {user.displayName}</p>{' '}
          <button type="button" className={css.btn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <ul className={css.list_btn}>
          <li>
            <button
              type="button"
              className={css.btn_login}
              onClick={() => openModal('login')}
            >
              Log in
            </button>
          </li>
          <li>
            <button
              type="button"
              className={css.btn}
              onClick={() => openModal('registration')}
            >
              Registration
            </button>
          </li>
        </ul>
      )}
      {IsAuthCheck ? (
        <button type="button" className={css.btn_login_mob} onClick={handleLogout}>
          <svg className={css.icon_book}>
            <use xlinkHref={`${sprite}#logout`} />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          className={css.btn_login_mob}
          onClick={() => openModal('login')}
        >
          <svg className={css.icon_book}>
            <use xlinkHref={`${sprite}#avatarUser`} />
          </svg>
        </button>
      )}

      {isModalOpen && (
        <BasicModal
          isModal={closeModal}
          closeOnOverlay={false}
          closeOnEscape={false}
        >
          <AuthModal
            modalContent={modalContent}
            onAuthSuccess={handleAuthSuccess}
          />
        </BasicModal>
      )}
    </>
  );
}
