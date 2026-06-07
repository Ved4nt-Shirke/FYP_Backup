import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { path: '/superadmin-dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { path: '/superadmin-view-institutions', label: 'Institutions', icon: 'fas fa-university' },
  ];

  return (
    <div className="superadmin-layout">
      {/* Header */}
      <header className="superadmin-header">
        <div className="header-left">
          <i className="fas fa-university header-logo"></i>
          <div>
            <h1 className="header-title">Vidyalankar CMS</h1>
            <p className="header-subtitle">Super Admin Panel</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase() || 'S'}</div>
            <div>
              <p className="user-name">{user?.username || 'Super Admin'}</p>
              <p className="user-role">Super Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="superadmin-nav">
        <div className="nav-container">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <i className={`${item.icon} nav-icon`}></i>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="superadmin-main">
        <div className="content-wrapper">
          <Outlet />
        </div>
        
        {/* Footer inside scrollable area */}
        <footer className="superadmin-footer">
          <p>© 2026 Vidyalankar. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
