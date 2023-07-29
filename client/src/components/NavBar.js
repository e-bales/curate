import './NavBar.css';
import { FaPalette, FaBars } from 'react-icons/fa';

export default function NavBar({ loggedIn, search }) {
  return (
    <header className="nav-bar-wrap">
      <FaBars className="bars" />
      <div className="nav-bar row">
        <div className="col-half">
          <FaPalette className="palette" />
          <p className="title-text">Curate.</p>
        </div>
        <div className="col-half right">
          <SearchBar />
          <p className="title-text small-text">
            {loggedIn ? 'Profile' : 'Sign-In'}
          </p>
        </div>
      </div>
    </header>
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
