import "./UserDashboard.css";

export default function UserDashboard() {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="header">
        <div className="logo">Bold and Wise</div>
        <div className="profile">JK</div>
      </div>

      {/* Navbar */}
      <div className="nav">
        <span className="active">Home</span>
        <span>All Apps</span>
        <span>My Apps</span>
        <span>Favorites</span>
        <span>More</span>
      </div>

      {/* Main */}
      <div className="main">
        <h1>Hi User, welcome back!</h1>
        <p className="subtitle">
          Start your journey by exploring the applications below.
        </p>

        {/* Cards */}
        <div className="cards">
          <div className="card">
            <p>Applications</p>
            <h2>6</h2>
          </div>

          <div className="card">
            <p>Subscribed Apps</p>
            <h2>3</h2>
          </div>

          <div className="card">
            <p>Tasks</p>
            <h2>5</h2>
          </div>
        </div>

        {/* Search */}
        <input className="search" placeholder="Search applications..." />

        {/* App List */}
        <div className="app-list">
          <div className="app-item">Document Management</div>
          <div className="app-item">Application Management</div>
          <div className="app-item">Charge Management</div>
          <div className="app-item">Overview Purchasing</div>
          <div className="app-item">Software Constraints</div>
        </div>
      </div>
    </div>
  );
}
