import './NavBar.css';
import { Link, Outlet } from 'react-router-dom';
import { FaPalette, FaBars } from 'react-icons/fa';

export default function NavBar({ loggedIn, logInOnClick, search }) {
  return (
    <div>
      <header className="nav-bar-wrap">
        <FaBars className="bars" />
        <div className="nav-bar row">
          <div className="col-half">
            <FaPalette className="palette" />
            <Link to="/" className="title-text">
              Curate.
            </Link>
            {/* <p className="title-text">Curate.</p> */}
          </div>
          <div className="col-half right">
            {loggedIn ? <SearchBar /> : ''}
            {loggedIn ? (
              <Link className="title-text small-text">Profile</Link>
            ) : (
              <p
                onClick={() => logInOnClick()}
                className="title-text small-text">
                Sign-In
              </p>
            )}
            {/* <p className="title-text small-text">
            {loggedIn ? 'Profile' : 'Sign-In'}
          </p> */}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function SearchBar() {
  return (
    <div className="search-bar-wrap">
      <input
        type="text"
        className="search-bar"
        placeholder="Search by tag..."></input>
    </div>
  );
}
