import './NavBar.css';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FaPalette, FaBars } from 'react-icons/fa';

/**
 * NavBar Component that persists across the app.
 * loggedIn: boolean denoting if the user is logged in or not.
 * logInOnClick: onClick function to open the Sign In modal.
 * logOut: function to log the user out.
 */
export default function NavBar({ loggedIn, logInOnClick, logOut }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const link = [
    { name: 'Profile', link: '/profile', onClick: closeDrawer },
    { name: 'View by Department', link: '/department', onClick: closeDrawer },
    { name: 'Log Out', link: '/', onClick: signOut },
  ];

  function closeDrawer() {
    setDrawerOpen(false);
  }

  // remove all data from localStorage.
  function signOut() {
    localStorage.removeItem('userObj');
    localStorage.removeItem('token');
    localStorage.removeItem('favorites');
    if (localStorage.getItem('editData')) localStorage.removeItem('editData');
    logOut();
    closeDrawer();
  }

  return (
    <div>
      <Drawer viewed={drawerOpen} loggedIn={loggedIn} drawerLinks={link} />
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
          </div>
          <div className="col-half right">
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
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

/**
 * Drawer component that opens when the user clicks the Bars on the left side of the NavBar.
 * viewed: boolean denoting if the drawer should be open or closed.
 * loggedIn: boolean denoting if the user has logged in or not.
 * drawerLinks: array of objects, denoting what links the drawer should display
 *    link Objects have: name, link, and onClick keys.
 */
function Drawer({ viewed, loggedIn, drawerLinks }) {
  return (
    <div className={`drawer ${viewed ? 'shown' : 'hidden'}`}>
      <div className="drawer-content">
        <div className="drawer-top hover-pointer">
          <h1 onClick={() => drawerLinks[0].onClick()}>Menu</h1>
        </div>
        <div className="drawer-links">
          {loggedIn ? (
            drawerLinks.map((element, index) => (
              <MenuItem
                onClick={drawerLinks[index].onClick}
                key={index}
                menuItem={element}
              />
            ))
          ) : (
            <p>Sign In and become your own Curator to continue!</p>
          )}
        </div>
        <div className="close link">
          <p className="hover-pointer" onClick={() => drawerLinks[0].onClick()}>
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
