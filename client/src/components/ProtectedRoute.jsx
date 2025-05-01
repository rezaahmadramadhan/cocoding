import { Navigate, useLocation } from 'react-router';

/**
 * ProtectedRoute - Komponen untuk melindungi rute yang membutuhkan autentikasi
 * @param {object} props
 * @param {React.ReactNode} props.children - Komponen yang akan di-render jika pengguna sudah login
 * @returns {React.ReactNode} - Komponen children jika sudah login atau redirect ke halaman login
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('access_token');

  if (!isAuthenticated) {
    // Redirect ke halaman login dengan informasi halaman yang ingin dikunjungi
    // agar setelah login bisa kembali ke halaman tersebut
    return (
      <Navigate
        to="/login"
        state={{ 
          returnUrl: location.pathname, 
          message: "Anda harus login terlebih dahulu untuk mengakses halaman ini" 
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;