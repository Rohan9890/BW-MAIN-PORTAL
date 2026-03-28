import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Logo from '../components/Logo';
import './Registration.css';

const INDIVIDUAL_FIELDS = [
  { name: 'fullName', placeholder: 'Full Name', col: 'left' },
  { name: 'email', placeholder: 'Email Address', col: 'right' },
  { name: 'password', placeholder: 'Password', col: 'left' },
  { name: 'phone', placeholder: 'Phone Number', col: 'right' },
  { name: 'city', placeholder: 'City', col: 'left' },
  { name: 'zip', placeholder: 'ZIP Code', col: 'right' },
  { name: 'street', placeholder: 'Street Address', col: 'left' },
  { name: 'referral', placeholder: 'Referral Code / Name', col: 'right' },
];

const ORG_FIELDS = [
  { name: 'orgName', placeholder: 'Organization Name', col: 'left' },
  { name: 'contactName', placeholder: 'Contact Person Name', col: 'right' },
  { name: 'email', placeholder: 'Email Address', col: 'left' },
  { name: 'password', placeholder: 'Password', col: 'right' },
  { name: 'billing', placeholder: 'Billing Address', col: 'left' },
  { name: 'phone', placeholder: 'Phone Number', col: 'right' },
  { name: 'shipping', placeholder: 'Multiple shipping Address', col: 'left' },
  { name: 'referral', placeholder: 'Referral Code / Name', col: 'right' },
];

const REG_TYPES = {
  individual: {
    label: 'Individual Registration',
    title: 'Individual Registration Page',
    fields: INDIVIDUAL_FIELDS,
    kycHint: 'Addhar card, Passport, vote id.',
    icon: '👤',
  },
  organization: {
    label: 'Organization Registration',
    title: 'Organization Registration Page',
    fields: ORG_FIELDS,
    kycHint: 'Company Registration',
    icon: '💼',
  },
};

function getInitialTypeFromPath(pathname) {
  return pathname.includes('/register/organization') ? 'organization' : 'individual';
}

export default function Registration() {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = useMemo(() => getInitialTypeFromPath(location.pathname), [location.pathname]);
  const [type, setType] = useState(initial);

  const config = REG_TYPES[type] ?? REG_TYPES.individual;

  const onTypeChange = (nextType) => {
    const normalized = nextType === 'organization' ? 'organization' : 'individual';
    setType(normalized);
    navigate(normalized === 'organization' ? '/register/organization' : '/register', { replace: true });
  };

  return (
    <div className="page-gradient registration-page">
      <div className="card-container registration-card">
        <header className="reg-header">
          <Logo to="/" />
          <Link to="/login">
            <button type="button" className="btn btn-primary">Login</button>
          </Link>
        </header>

        <h1 className="reg-title">{config.title}</h1>
        <p className="reg-subtitle">Enter your details to create a new account.</p>

        <div className="reg-switch">
          <label className="reg-switch-label" htmlFor="regType">
            Registration Type
          </label>
          <div className="reg-switch-control">
            <span className="reg-switch-icon" aria-hidden="true">{config.icon}</span>
            <select
              id="regType"
              className="reg-switch-select"
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <option value="individual">Individual Registration</option>
              <option value="organization">Organization Registration</option>
            </select>
          </div>
        </div>

        <h2 className="reg-form-title">Enter your details to create a new account</h2>
        <div className="reg-fields">
          {config.fields.map((f) => (
            <div key={f.name} className={`reg-field reg-field-${f.col}`}>
              <input type="text" className="input" placeholder={f.placeholder} />
            </div>
          ))}
        </div>

        <h3 className="kyc-title">KYC DOCUMENTS UPLOAD</h3>
        <div className="kyc-upload">
          <div className="kyc-cloud">☁</div>
          <p className="kyc-label">UPLOAD ID PROOF</p>
          <p className="kyc-hint">{config.kycHint}</p>
        </div>

        <label className="checkbox-label reg-terms">
          <input type="checkbox" defaultChecked />
          <span>I agree to the Terms & Conditions</span>
        </label>

        <button type="button" className="btn btn-primary btn-save">SAVE</button>
      </div>
    </div>
  );
}

