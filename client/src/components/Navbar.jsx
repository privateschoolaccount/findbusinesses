import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 className="display-lg" style={{ fontSize: '24px', lineHeight: '32px', color: 'var(--on-surface)' }}>
            Find Businesses
          </h1>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
