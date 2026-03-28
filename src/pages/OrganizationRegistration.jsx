import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import './Registration.css';

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

export default function OrganizationRegistration() {
  const navigate = useNavigate();

  return (
    <div className="page-gradient registration-page">
      <div className="card-container registration-card">
        <header className="reg-header">
          <Logo to="/" />
          <Link to="/login">
            <button type="button" className="btn btn-primary">Login</button>
          </Link>
        </header>
        <h1 className="reg-title">Organization Registration Page</h1>
        <p className="reg-subtitle">Enter your details to create a new account.</p>

        <div className="reg-tabs">
          <button type="button" className="reg-tab" onClick={() => navigate('/register')}>
            <span className="tab-icon">👤</span>
            Individual Registration
          </button>
          <button type="button" className="reg-tab active">
            <span className="tab-icon">💼</span>
            Organization Registration
          </button>
        </div>

        <h2 className="reg-form-title">Enter your details to create a new account</h2>
        <div className="reg-fields">
          {ORG_FIELDS.map((f) => (
            <div key={f.name} className={`reg-field reg-field-${f.col}`}>
              <input type="text" className="input" placeholder={f.placeholder} />
            </div>
          ))}
        </div>

        <h3 className="kyc-title">KYC DOCUMENTS UPLOAD</h3>
        <div className="kyc-upload">
          <div className="kyc-cloud">☁</div>
          <p className="kyc-label">UPLOAD ID PROOF</p>
          <p className="kyc-hint">Company Registration</p>
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
