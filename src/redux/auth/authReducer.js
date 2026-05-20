const resetUser = state => {
  state.user.displayName = null;
  state.user.email = null;
  state.user.uid = null;
  state.token = null;
  state.isVerify = false;
  state.isAuthCheck = false;
};

const setAuthenticatedUser = (state, payload) => {
  state.error = null;
  state.user.displayName = payload.displayName;
  state.user.email = payload.email;
  state.user.uid = payload.uid;
  state.token = payload.accessToken;
  state.isLoading = false;
  state.isAuthCheck = true;
  state.status = 'fulfilled';
};

const isCredentialSubmitAction = type => {
  return (
    type.startsWith('auth/loginUser/') ||
    type.startsWith('auth/registrationUser/') ||
    type.startsWith('auth/authorizationGoogle/')
  );
};

export const handleFulfilledRegistration = (state, { payload }) => {
  setAuthenticatedUser(state, payload);
};

export const handleFulfilledLogin = (state, { payload }) => {
  setAuthenticatedUser(state, payload);
};

export const handleFulfilledCurrentUser = (state, { payload }) => {
  state.isLoading = false;
  state.status = 'fulfilled';

  if (!payload) {
    resetUser(state);
    state.error = null;
    return;
  }

  setAuthenticatedUser(state, payload);
};

export const handleFulfilledLogOut = state => {
  resetUser(state);
  state.isLoading = false;
  state.error = null;
  state.status = 'fulfilled';
};

export const handlePending = (state, { type }) => {
  state.isLoading = true;
  state.error = null;
  state.status = 'pending';

  if (isCredentialSubmitAction(type)) {
    resetUser(state);
  }
};

export const handleRejected = (state, { payload, type }) => {
  state.isLoading = false;
  state.status = 'rejected';

  if (type === 'auth/currentUser/rejected') {
    resetUser(state);
    state.error = null;
    return;
  }

  if (isCredentialSubmitAction(type)) {
    resetUser(state);
  }

  state.error = payload || 'Authentication failed. Please try again.';
};

export const handleAuthorizationGoogle = (state, { payload }) => {
  setAuthenticatedUser(state, payload);
};
