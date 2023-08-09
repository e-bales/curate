import './SignIn.css';
import { useState } from 'react';

export default function SignIn({ subtextOnClick, onSignIn }) {
  const [isLoading, setIsLoading] = useState(false);
  const [invalidCred, setInvalidCred] = useState(false);

  async function delay(msecs) {
    return new Promise((resolve) => setTimeout(() => resolve(), msecs));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setIsLoading(true);
      setInvalidCred(false);
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
      console.log('User is: ', user);
      const favorites = await fetch(`/api/favorites/${user.userId}`);
      const favoritesJSON = await favorites.json();
      sessionStorage.setItem('favorites', JSON.stringify(favoritesJSON));
      // console.log('User is: ', user);
      // console.log('token is: ', token);
      const userObj = { user };
      // console.dir(userObj);
      sessionStorage.setItem('userObj', JSON.stringify(userObj));
      sessionStorage.setItem('token', token);
      delay(1500);
      onSignIn();
    } catch (err) {
      if (err.message !== 'fetch Error 401') {
        alert(`Error signing in: ${err}`);
      }
      setInvalidCred(true);
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
                  className={`form-input ${invalidCred ? 'error-input' : ''}`}
                  placeholder="Username"
                  autoComplete="off"
                />
                <input
                  required
                  name="password"
                  type="password"
                  className={`form-input ${invalidCred ? 'error-input' : ''}`}
                  placeholder="Password"
                />
                {invalidCred && (
                  <p className="error">
                    Invalid credentials...please try again.
                  </p>
                )}
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
