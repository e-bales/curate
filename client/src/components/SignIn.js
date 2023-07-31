import './SignIn.css';

export default function SignIn({ subtextOnClick }) {
  function handleSubmit(event) {
    event.preventDefault();
    try {
      const formData = new FormData(event.target);
      const userData = Object.fromEntries(formData.entries());
      console.log(userData);
    } catch (err) {}
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
                  <button className="login-button bebas-font">Login</button>
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
