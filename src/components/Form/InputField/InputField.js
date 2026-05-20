import { Field, ErrorMessage } from 'formik';
import { useState } from 'react';
import css from './InputField.module.css';
import PropTypes from 'prop-types';

const InputField = ({ type, name, placeholder }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && isPasswordVisible ? 'text' : type;

  const togglePasswordVisibility = event => {
    event.preventDefault();
    event.stopPropagation();
    setIsPasswordVisible(prev => !prev);
  };

  return (
    <div className={css.fieldWrap}>
      <div className={css.inputWrap}>
        <Field
          className={`${css.input} ${isPassword ? css.passwordInput : ''}`}
          type={inputType}
          name={name}
          placeholder={placeholder}
          autoComplete={isPassword ? 'current-password' : undefined}
        />
        {isPassword && (
          <button
            className={css.passwordToggle}
            type="button"
            onClick={togglePasswordVisibility}
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      <ErrorMessage className={css.error} name={name} component="div" />
    </div>
  );
};

InputField.propTypes = {
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
};

export default InputField;
