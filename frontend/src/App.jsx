import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import InventoryPage from './pages/InventoryPage';
import ItemPage from './pages/ItemPage';
import PersonalPage from './pages/PersonalPage';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import './i18n';

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/inventory/:id" element={<InventoryPage />} />
            <Route path="/item/:id" element={<ItemPage />} />
            <Route path="/me" element={<PersonalPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/user/:id" element={<UserPage />} />
            <Route path="*" element={
              <div className="container py-5 text-center">
                <h1 className="display-1 fw-bold text-muted">404</h1>
                <p className="text-muted">Page not found</p>
              </div>
            } />
          </Routes>
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
