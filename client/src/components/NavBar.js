import './NavBar.css';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FaPalette, FaBars } from 'react-icons/fa';

export default function NavBar({ loggedIn, logInOnClick, search }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const link = [
    { name: 'Profile', link: '/profile' },
    { name: 'View by Department', link: '/department' },
    { name: 'View by Medium', link: '/medium' },
    { name: 'Log Out', link: '/' },
  ];

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <div>
      <Drawer
        viewed={drawerOpen}
        loggedIn={loggedIn}
        drawerLinks={link}
        onClick={() => closeDrawer()}
      />
      <header className="nav-bar-wrap">
        <FaBars
          className="bars hover-pointer"
          onClick={() => setDrawerOpen(true)}
        />
        <div className="nav-bar row">
          <div className="col-half">
            <FaPalette className="palette" />
            <Link to="/" className="title-text hover-pointer">
              Curate.
            </Link>
            {/* <p className="title-text">Curate.</p> */}
          </div>
          <div className="col-half right">
            {loggedIn ? <SearchBar /> : ''}
            {loggedIn ? (
              <Link
                to="/profile"
                className="title-text small-text hover-pointer">
                Profile
              </Link>
            ) : (
              <p
                onClick={() => logInOnClick()}
                className="title-text small-text hover-pointer">
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

function Drawer({ viewed, loggedIn, drawerLinks, onClick }) {
  return (
    <div className={`drawer ${viewed ? 'shown' : 'hidden'}`}>
      <div className="drawer-content">
        <div className="drawer-top hover-pointer">
          <h1 onClick={() => onClick()}>Menu</h1>
        </div>
        <div className="drawer-links">
          {loggedIn ? (
            drawerLinks.map((element, index) => (
              <MenuItem onClick={onClick} key={index} menuItem={element} />
            ))
          ) : (
            <p>Sign In and become your own Curator to continue!</p>
          )}
          {/* {drawerLinks.map((element, index) => (
            <MenuItem
              onClick={onClick}
              key={index}
              menuItem={element}
            />
          ))} */}
        </div>
        <div className="close">
          <p className="hover-pointer" onClick={() => onClick()}>
            Close
          </p>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ menuItem, onClick }) {
  return (
    <Link onClick={() => onClick()} to={menuItem.link} className="link">
      {menuItem.name}
    </Link>
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
