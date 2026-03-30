import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useBrand } from "../context/BrandContext";
import { authApi } from "../services";
import "./Login.css";

export default function Login() {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const handleLogin = async () => {
    const response = await authApi.login({
      username: form.username,
      password: form.password,
    });

    if (response?.token) {
      window.localStorage.setItem("ui-access-token", response.token);
    }

    if (response?.user?.role === "Admin") {
      navigate("/admin");
      return;
    }

    navigate("/");
  };

  return (
    <div className="page-gradient login-page">
      <div className="login-card card-container">
        <div className="login-right">
          <Logo to="/" className="login-brand-logo" />
          <p className="login-tagline">{brand.description}</p>
        </div>
        <div className="login-left">
          <h1 className="login-title">Login</h1>
          <form className="login-form">
            <input
              type="text"
              className="input"
              placeholder="User Name"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
            />
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
            <button
              type="button"
              className="btn btn-primary login-btn"
              onClick={handleLogin}
            >
              Login
            </button>
            <div className="login-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, remember: e.target.checked }))
                  }
                />
                <span>Remember me</span>
              </label>
              <Link to="/" className="link">
                Forgot password
              </Link>
            </div>
            <div className="divider">
              <span>Or Sign up with</span>
            </div>
            <div className="social-icons">
              <button type="button" className="social-btn" aria-label="Google">
                <span className="icon-google">G</span>
              </button>
              <button
                type="button"
                className="social-btn social-fb"
                aria-label="Facebook"
              >
                f
              </button>
              <button type="button" className="social-btn" aria-label="Apple">
                <span className="icon-apple">&#63743;</span>
              </button>
            </div>
            <p className="signup-prompt">
              Don't have account?{" "}
              <Link to="/register" className="btn btn-primary btn-signup">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
