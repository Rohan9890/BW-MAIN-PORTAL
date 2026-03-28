import { Link } from 'react-router-dom';
import './Logo.css';

const LOGO_IMAGE = '/logo.png';

function LogoContent({ className = '', compact = false }) {
  return (
    <span className={`logo-brand ${compact ? 'logo-compact' : ''} ${className}`.trim()}>
      <img
        src={LOGO_IMAGE}
        alt="Logo"
        className="logo-img"
        onError={(e) => {
          e.target.style.display = 'none';
          const next = e.target.nextElementSibling;
          if (next) next.classList.add('logo-fallback-visible');
        }}
      />
      <span className="logo-fallback">
        <svg
          className="logo-svg"
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 8L20 20L32 8V32L20 20L8 32V8Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8 8L20 20L32 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
    </span>
  );
}

export default function Logo({ className = '', to = '/', compact = false }) {
  const content = <LogoContent className={className} compact={compact} />;

  if (to) {
    return (
      <Link to={to} className="logo-link" style={{ display: 'inline-flex' }}>
        {content}
      </Link>
    );
  }
  return content;
}
