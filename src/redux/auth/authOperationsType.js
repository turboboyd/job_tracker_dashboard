import {
  registrationUser,
  loginUser,
  currentUser,
  logoutUser,
  authorizationGoogle,
} from './authOperation';

const operationsThunk = [
  registrationUser,
  loginUser,
  currentUser,
  logoutUser,
  authorizationGoogle,
];
export const operationsType = type =>
  operationsThunk.map(operation => operation[type]);
