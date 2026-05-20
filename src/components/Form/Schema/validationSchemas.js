import { topicsArray } from 'components/Form/Topics/topicsArray';
import * as Yup from 'yup';

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const emailValidation = Yup.string()
  .matches(emailRegex, 'Invalid email format')
  .required('Required field');

const registrationPasswordValidation = Yup.string()
  .min(6, 'Password must be at least 6 characters long')
  .required('Required field');

const loginPasswordValidation = Yup.string().required('Required field');

export const registrationSchema = Yup.object().shape({
  name: Yup.string().required('Required field'),
  email: emailValidation,
  password: registrationPasswordValidation,
});

export const loginSchema = Yup.object().shape({
  email: emailValidation,
  password: loginPasswordValidation,
});

export const trialLessonSchema = Yup.object({
  fullName: Yup.string().required('Required field'),
  email: emailValidation,
  phoneNumber: Yup.string().required('Required field'),
  topic: Yup.string()
    .oneOf(topicsArray, 'Invalid topic')
    .required('Required field'),
});
