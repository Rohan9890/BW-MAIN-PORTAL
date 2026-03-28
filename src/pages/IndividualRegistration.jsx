import { Link, useNavigate } from 'react-router-dom';
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

export default function IndividualRegistration() {
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
        <h1 className="reg-title">Individual Registration Page</h1>
        <p className="reg-subtitle">Enter your details to create a new account.</p>

        <div className="reg-tabs">
          <button type="button" className="reg-tab active">
            <span className="tab-icon">👤</span>
            Individual Registration
          </button>
          <button type="button" className="reg-tab" onClick={() => navigate('/register/organization')}>
            <span className="tab-icon">💼</span>
            Organization Registration
          </button>
        </div>

        <h2 className="reg-form-title">Enter your details to create a new account</h2>
        <div className="reg-fields">
          {INDIVIDUAL_FIELDS.map((f) => (
            <div key={f.name} className={`reg-field reg-field-${f.col}`}>
              <input type="text" className="input" placeholder={f.placeholder} />
            </div>
          ))}
        </div>

        <h3 className="kyc-title">KYC DOCUMENTS UPLOAD</h3>
        <div className="kyc-upload">
          <div className="kyc-cloud">☁</div>
          <p className="kyc-label">UPLOAD ID PROOF</p>
          <p className="kyc-hint">Addhar card, Passport, vote id.</p>
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
