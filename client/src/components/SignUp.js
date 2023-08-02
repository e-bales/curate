import './SignUp.css';
import { useState } from 'react';

export default function SignIn({ subtextOnClick }) {
  const [samePW, setSamePW] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  async function delay(msecs) {
    return new Promise((resolve) => setTimeout(() => resolve(), msecs));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const formData = new FormData(event.target);
      const userData = Object.fromEntries(formData.entries());
      console.log(userData);
      if (userData.password !== userData.matchingPassword) {
        setSamePW(false);
      } else {
        setSamePW(true);
        setIsLoading(true);
        delete userData.matchingPassword;
        const req = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        };

        const res = await fetch('/api/auth/sign-up', req);
        if (!res.ok) {
          throw new Error(`fetch Error ${res.status}`);
        }
        await delay(1500);
        const user = await res.json();
        setIsRegistered(true);
      }
    } catch (err) {
      alert(`Error registering...`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="sign-in-wrap">
      <div className="sign-in">
        <div className="content">
          <div className="login-row">
            <h3 className="sign-up-title bebas-font">
              Sign Up - Become a Curator!
            </h3>
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
                <input
                  required
                  name="matchingPassword"
                  type="password"
                  className={`form-input ${!samePW ? 'error-input' : ''}`}
                  placeholder="Confirm Password"
                />
                {!samePW && (
                  <p className="error">
                    Passwords do not match...please try again.
                  </p>
                )}
                <div className="line"></div>
                <div className="button-wrap">
                  <button
                    disabled={isLoading}
                    className="login-button bebas-font">
                    {!isLoading ? 'Sign Up' : 'Loading...'}
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="subtext-wrap">
            <div className="subtext login-row bebas-font">
              <p className={isRegistered ? 'registered' : ''}>
                {isRegistered
                  ? 'Successfully registered! Proceed to:'
                  : 'Already have an account?'}
                &nbsp;
              </p>
              <p onClick={() => subtextOnClick()} className="sign-up">
                Login
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
