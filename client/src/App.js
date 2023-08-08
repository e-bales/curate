import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
// import logo from './logo.svg';
import art from './san-giorgio-maggiore-at-dusk.jpg';
import art2 from './christ-with-angels.jpg';
import artLarge from './Large-Test-img.jpg';
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

const images = [art, art2, artLarge];

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggingIn, setLoggingIn] = useState('');
  const [grayOut, setGrayOut] = useState(false);

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

  useEffect(() => {
    if (JSON.parse(sessionStorage.getItem('userObj'))?.user !== undefined) {
      setLoggedIn(true);
    }
  }, []);
  // const [serverData, setServerData] = useState('');

  // useEffect(() => {
  //   async function readServerData() {
  //     const resp = await fetch('/api/hello');
  //     const data = await resp.json();

  //     console.log('Data from server:', data);

  //     setServerData(data.message);
  //   }

  //   readServerData();
  // }, []);

  return (
    <div className="app">
      {grayOut && <GrayOut onClick={() => closeModal()} />}
      {/* {loggingIn === undefined ? '' : loggingIn === null ? <SignUp /> : loggingIn ? <SignIn /> : ''} */}
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
            <NavBar logInOnClick={() => openLogin()} loggedIn={loggedIn} />
          }>
          <Route
            index
            element={<SplashPage loggedIn={loggedIn} imageSet={images} />}
          />
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

    // <NavBar loggedIn={loggedIn} />
    // <SplashPage loggedIn={loggedIn} imageSet={images} />

    // <div className="App">
    //   <NavBar />
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />
    //     <h1>{serverData}</h1>
    //   </header>
    // </div>
  );
}

export default App;
