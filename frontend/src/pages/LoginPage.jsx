import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="card border-0 shadow-sm" style={{ maxWidth: 400, width: '100%' }}>
        <div className="card-body p-4 p-md-5 text-center">
          <i className="bi bi-boxes text-primary display-4 mb-3" />
          <h2 className="fw-bold mb-2">Inventra</h2>
          <p className="text-muted mb-4">{t('auth.loginInfo')}</p>

          <div className="d-grid gap-3">
            <a href="/api/auth/google" className="btn btn-outline-danger btn-lg d-flex align-items-center justify-content-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.26 9.77A7.25 7.25 0 0 1 12 4.75c1.84 0 3.5.68 4.77 1.8L19.59 4C17.56 2.15 15 1 12 1 7.73 1 4.08 3.3 2.18 6.74l3.08 3.03z"/>
                <path fill="#34A853" d="M12 22.75c3.09 0 5.67-1.01 7.56-2.74l-3.12-2.56A7.25 7.25 0 0 1 12 19.25a7.24 7.24 0 0 1-6.72-4.5L2.18 17.8C4.09 21.24 7.73 22.75 12 22.75z"/>
                <path fill="#4A90D9" d="M22.5 12c0-.74-.07-1.47-.2-2.17H12v4.1h5.9a5.03 5.03 0 0 1-2.17 3.3l3.12 2.57C20.95 17.82 22.5 15.17 22.5 12z"/>
                <path fill="#FBBC05" d="M5.28 14.75A7.24 7.24 0 0 1 4.75 12c0-.95.17-1.86.47-2.72L2.14 6.26A11.7 11.7 0 0 0 1.25 12c0 2 .52 3.88 1.44 5.52l2.59-2.77z"/>
              </svg>
              {t('auth.loginGoogle')}
            </a>

            <a href="/api/auth/github" className="btn btn-dark btn-lg d-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-github fs-5" />
              {t('auth.loginGitHub')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
