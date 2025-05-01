import { Navigate } from 'react-router-dom';

/**
 * PublicOnlyRoute - Component to protect routes that should only be accessible when not logged in
 * @param {object} props
 * @param {React.ReactNode} props.children - Component to render if user is not logged in
 * @returns {React.ReactNode} - Children component if not logged in or redirect to home page
 */
const PublicOnlyRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('access_token');

  if (isAuthenticated) {
    // Redirect to home page if already logged in
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicOnlyRoute;