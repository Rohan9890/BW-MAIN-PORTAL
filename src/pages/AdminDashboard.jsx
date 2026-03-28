import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './Dashboard.css';
import './AdminDashboard.css';

const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: '▦', active: true },
  { label: 'Manage Admin', icon: '👥' },
  { label: 'Manage Organization', icon: '🏢' },
  { label: 'Setting', icon: '⚙' },
  { label: 'Help', icon: '?' },
  { label: 'Report', icon: '📊' },
];

const ADMIN_STATS = [
  { label: 'Admin', value: '', color: 'blue' },
  { label: 'Total users', value: '10', color: 'orange' },
  { label: 'Pending Approvals', value: '20', color: 'purple' },
  { label: 'Open Ticket', value: '15', color: 'teal' },
];

const RECENT_ACTIVITIES = [
  'User Registration',
  'Document Approved',
  'User Registration',
  'Document Approved',
];

const PAYMENT_HISTORY = [
  { date: '26 mar 2026', application: 'License Renewal', status: 'Paid' },
  { date: '26 mar 2026', application: 'KYC verification', status: 'Paid' },
  { date: '26 mar 2026', application: 'Business Registration', status: 'Paid' },
];

export default function AdminDashboard() {
  return (
    <div className="page-gradient dashboard-wrap">
      <div className="dashboard-card admin-dashboard">
        <aside className="sidebar admin-sidebar">
          <Logo to="/" className="sidebar-logo" compact />
          <div className="admin-sidebar-header">
            <span className="admin-sidebar-icon">👤</span>
            SuperAdmin
          </div>
          <nav className="sidebar-nav">
            {ADMIN_SIDEBAR_ITEMS.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`sidebar-item ${item.active ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <Link to="/login" className="sidebar-logout">
            <span>→</span> Log out
          </Link>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-header admin-header">
            <Logo to="/" className="dashboard-logo" />
            <div className="dashboard-user">
              <span className="user-icon">👤</span>
              Sandeep Malik
              <span className="header-menu">☰</span>
            </div>
          </header>

          <div className="dashboard-main-inner">
          <div className="stat-cards">
            {ADMIN_STATS.map((card) => (
              <div key={card.label} className={`stat-card stat-${card.color}`}>
                <span className="stat-label">{card.label}</span>
                <span className="stat-value">{card.value}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-grid admin-grid">
            <div className="dashboard-left">
              <div className="analytics-section">
                <h3 className="card-title">User Analytics</h3>
                <p className="section-sub">Your overview</p>
                <div className="charts-row">
                  <div className="chart-placeholder">
                    <p>Legends: Customer, Employee, Vendor, Partner, Other</p>
                    <div className="chart-bars" />
                  </div>
                  <div className="chart-placeholder">
                    <p>Total volume / Net volume from sales</p>
                    <div className="chart-lines" />
                  </div>
                </div>
              </div>

              <div className="recent-activities">
                <h3 className="card-title">Recent Activities</h3>
                <div className="activity-tags">
                  {RECENT_ACTIVITIES.map((act, i) => (
                    <span key={i} className="activity-tag">{act}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="dashboard-right">
              <div className="contact-admin-card">
                <h3 className="card-title">Contact Admin</h3>
                <div className="contact-illus">👩‍💻</div>
                <p className="contact-text">
                  If you have any queries or issues, Contact the admin team to assistance.
                </p>
                <button type="button" className="btn btn-primary">Message Admin</button>
              </div>

              <div className="payment-history-card">
                <div className="ph-header">
                  <h3 className="card-title">Payment History</h3>
                  <Link to="/admin" className="link">View All</Link>
                </div>
                <table className="ph-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Application</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAYMENT_HISTORY.map((row, i) => (
                      <tr key={i}>
                        <td>{row.date}</td>
                        <td>{row.application}</td>
                        <td><span className="status-badge">{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
