import useAuth from 'hooks/useAuth';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ element: Element, ...rest }) => {
  const { IsAuthCheck } = useAuth();
  return IsAuthCheck ? <Navigate to="/teachers" replace /> : <Element {...rest} />;
};

export default AuthRoute;
