import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import SplashPage from './pages/SplashPage';
import Profile from './pages/Profile';
import Department from './pages/Department';
import MultiDisplay from './pages/MultiDisplay';
import SingleDisplay from './pages/SingleDisplay';
import Favorites from './pages/Favorites';
import GallerySubmission from './pages/GallerySubmission';
import Gallery from './pages/Gallery';
import GrayOut from './components/GrayOut';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggingIn, setLoggingIn] = useState('');
  const [grayOut, setGrayOut] = useState(false);

  useEffect(() => {
    if (JSON.parse(localStorage.getItem('userObj'))?.user !== undefined) {
      setLoggedIn(true);
    }
  }, []);

  function closeModal() {
    setGrayOut(false);
    setLoggingIn('');
  }

  function openLogin() {
    setGrayOut(true);
    setLoggingIn('login');
  }

  function signedIn() {
    setLoggingIn('');
    setLoggedIn(true);
    setGrayOut(false);
  }

  function signOut() {
    setLoggedIn(false);
  }

  return (
    <div className="app">
      {grayOut && <GrayOut onClick={() => closeModal()} />}
      {loggingIn === 'login' ? (
        <SignIn
          subtextOnClick={() => setLoggingIn('signup')}
          onSignIn={() => signedIn()}
        />
      ) : loggingIn === 'signup' ? (
        <SignUp subtextOnClick={() => setLoggingIn('login')} />
      ) : loggingIn === '' ? (
        ''
      ) : (
        ''
      )}
      <Routes>
        <Route
          path="/"
          element={
            <NavBar
              logInOnClick={() => openLogin()}
              logOut={() => signOut()}
              loggedIn={loggedIn}
            />
          }>
          <Route index element={<SplashPage loggedIn={loggedIn} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="favorites/:pageNum" element={<Favorites />} />
          <Route
            path="gallery/submission/:objectId"
            element={<GallerySubmission />}
          />
          <Route
            path="gallery/submission/:objectId/edit"
            element={<GallerySubmission edit={true} />}
          />
          <Route path="department" element={<Department />} />
          <Route
            path="department/:departmentId/:pageNum"
            element={<MultiDisplay />}
          />
          <Route path="object/:objectId" element={<SingleDisplay />} />
          <Route path="gallery/:userId" element={<Gallery />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
