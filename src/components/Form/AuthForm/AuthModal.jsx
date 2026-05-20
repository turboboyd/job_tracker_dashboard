import { Formik, Form } from 'formik';
import {
  registrationSchema,
  loginSchema,
} from 'components/Form/Schema/validationSchemas';
import { useDispatch, useSelector } from 'react-redux';
import css from './AuthForm.module.css';
import {
  registrationUser,
  loginUser,
  authorizationGoogle,
} from '../../../redux/auth/authOperation';
import useAuth from 'hooks/useAuth';
import { useEffect, useState } from 'react';
import Title from 'components/Form/Title/Title';
import BtnForm from 'components/Form/BtnForm/BtnForm';
import InputField from 'components/Form/InputField/InputField';
import GoogleButton from 'components/Form/GoogleButton/GoogleButton';
import PropTypes from 'prop-types';
import {
  selectError,
  selectIsLoading,
  selectRandomStyle,
} from '../../../redux/auth/authSelectors';
import { clearAuthError } from '../../../redux/auth/authSlice';

const AuthForm = ({ modalContent, isModal }) => {
  const dispatch = useDispatch();
  const randomStyle = useSelector(selectRandomStyle);
  const authError = useSelector(selectError);
  const isAuthLoading = useSelector(selectIsLoading);
  const { IsAuthCheck } = useAuth();
  const [isLogin, setIsLogin] = useState(modalContent === 'login');

  const initialValue = isLogin
    ? { email: '', password: '' }
    : { name: '', email: '', password: '' };
  const title = isLogin ? 'Log In' : 'Registration';
  const text = isLogin
    ? 'Welcome back! Please enter your credentials to access your account and continue searching for a teacher.'
    : 'Create an account to save favorite tutors and book a trial lesson.';
  const validSchema = isLogin ? loginSchema : registrationSchema;
  const btnTitle = isLogin ? 'Log In' : 'Sign Up';

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      if (isLogin) {
        await dispatch(loginUser(values)).unwrap();
      } else {
        await dispatch(registrationUser(values)).unwrap();
      }
    } catch (error) {
      // The error is already stored in Redux and rendered below.
      // Keeping the modal open is intentional for failed login/registration attempts.
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await dispatch(authorizationGoogle()).unwrap();
    } catch (error) {
      // Keep the modal open and show a readable error instead of navigating/reloading.
    }
  };

  useEffect(() => {
    if (IsAuthCheck) {
      isModal();
    }
  }, [IsAuthCheck, isModal]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, isLogin]);

  const toggleMode = event => {
    event.preventDefault();
    dispatch(clearAuthError());
    setIsLogin(prev => !prev);
  };

  return (
    <Formik
      className={css.form}
      initialValues={initialValue}
      validationSchema={validSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ isSubmitting }) => (
        <Form noValidate>
          <div className={css.title_wrap}>
            <Title title={title} text={text} />
          </div>

          <div className={css.wrap}>
            {!isLogin && (
              <InputField type="text" name="name" placeholder="Name" />
            )}
            <InputField type="email" name="email" placeholder="Email" />
            <InputField
              type="password"
              name="password"
              placeholder="Password"
            />
          </div>

          {authError && <p className={css.error}>{authError}</p>}

          <p className={css.text}>
            {isLogin ? "You don't have an account" : 'I have an account'}{' '}
            <button
              type="button"
              className={css.btn_login}
              style={{
                color: randomStyle.btn,
              }}
              onClick={toggleMode}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
          <BtnForm
            btnTitle={isAuthLoading ? 'Please wait...' : btnTitle}
            disabled={isSubmitting || isAuthLoading}
          />
          <GoogleButton
            handleLogin={handleGoogleLogin}
            disabled={isSubmitting || isAuthLoading}
          />
        </Form>
      )}
    </Formik>
  );
};

AuthForm.propTypes = {
  modalContent: PropTypes.string.isRequired,
  isModal: PropTypes.func.isRequired,
};

export default AuthForm;
