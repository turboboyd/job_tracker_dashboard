import useAuth from 'hooks/useAuth';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element: Element, ...rest }) => {
  const { IsAuthCheck } = useAuth();
  return IsAuthCheck ? <Element {...rest} /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
