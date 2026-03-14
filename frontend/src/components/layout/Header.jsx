import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import i18n from '../../i18n';

const Header = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const switchLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <nav className="container-xl navbar navbar-expand-lg sticky-top shadow-sm" style={{ zIndex: 1040 }}>
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <i className="bi bi-boxes text-primary fs-4" />
          <span className="d-none d-sm-inline">Inventra</span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <form className="d-flex mx-auto my-2 my-lg-0" style={{ maxWidth: 350, width: '100%' }} onSubmit={handleSearch}>
            <div className="input-group">
              <input
                ref={inputRef}
                className="form-control"
                type="search"
                placeholder={t('nav.searchPlaceholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search"
              />
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-search" />
              </button>
            </div>
          </form>

          <ul className="navbar-nav ms-auto align-items-center gap-1">
            <li className="nav-item">
              <Link className="nav-link" to="/"><i className="bi bi-house me-1" />{t('nav.home')}</Link>
            </li>

            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/me"><i className="bi bi-person me-1" />{t('nav.myPage')}</Link>
              </li>
            )}

            {user?.isAdmin && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin"><i className="bi bi-shield me-1" />{t('nav.admin')}</Link>
              </li>
            )}

            <li className="nav-item">
              <button className="btn btn-sm btn-outline-secondary" onClick={toggle} title={theme === 'light' ? t('common.darkTheme') : t('common.lightTheme')}>
                <i className={`bi bi-${theme === 'light' ? 'moon' : 'sun'}`} />
              </button>
            </li>

            <li className="nav-item dropdown">
              <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                <i className="bi bi-translate me-1" />
                {i18n.language.toUpperCase()}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><button className="dropdown-item" onClick={() => switchLang('en')}>🇬🇧 English</button></li>
                <li><button className="dropdown-item" onClick={() => switchLang('ru')}>🇷🇺 Русский</button></li>
              </ul>
            </li>

            {user ? (
              <li className="nav-item dropdown">
                <button className="btn btn-sm btn-outline-primary dropdown-toggle d-flex align-items-center gap-1" data-bs-toggle="dropdown">
                  {user.avatar && <img src={user.avatar} alt="" className="rounded-circle" width={20} height={20} />}
                  <span className="d-none d-md-inline">{user.name}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><Link className="dropdown-item" to="/me"><i className="bi bi-person me-2" />{t('nav.myPage')}</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger" onClick={logout}><i className="bi bi-box-arrow-right me-2" />{t('nav.logout')}</button></li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-sm btn-primary" to="/login">
                  <i className="bi bi-box-arrow-in-right me-1" />{t('nav.login')}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
