import Header from './Header';

const Layout = ({ children }) => (
  <div className="d-flex flex-column min-vh-100">
    <Header />
    <main className="flex-grow-1 py-3">
      {children}
    </main>
    <footer className="py-3 text-center text-muted small border-top">
      <span className="me-2"><i className="bi bi-boxes text-primary" /> Inventra</span>
      &copy; {new Date().getFullYear()}
    </footer>
  </div>
);

export default Layout;
