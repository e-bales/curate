import './SignIn.css';
import { useState } from 'react';

export default function SignIn({ subtextOnClick, onSignIn }) {
  const [isLoading, setIsLoading] = useState(false);

  async function delay(msecs) {
    return new Promise((resolve) => setTimeout(() => resolve(), msecs));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      const formData = new FormData(event.target);
      const userData = Object.fromEntries(formData.entries());
      const req = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      };
      const res = await fetch('/api/auth/sign-in', req);
      if (!res.ok) {
        throw new Error(`fetch Error ${res.status}`);
      }
      const { user, token } = await res.json();
      sessionStorage.setItem('token', token);
      delay(1500);
      onSignIn();
    } catch (err) {
      alert(`Error signing in: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="sign-in-wrap">
      <div className="sign-in">
        <div className="content">
          <div className="login-row">
            <h3 className="login-title bebas-font">Login</h3>
          </div>
          <div className="login-row">
            <form onSubmit={handleSubmit}>
              <div className="login-col-full">
                <input
                  required
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="Username"
                  autoComplete="off"
                />
                <input
                  required
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Password"
                />
                <div className="line"></div>
                <div className="button-wrap">
                  <button
                    disabled={isLoading}
                    className="login-button bebas-font">
                    {isLoading ? 'Loading...' : 'Login'}
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="subtext-wrap">
            <div className="subtext login-row bebas-font">
              <p>Need an account?&nbsp;</p>
              <p onClick={() => subtextOnClick()} className="sign-up">
                Sign Up
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}