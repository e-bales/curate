import { useEffect, useState } from 'react';
// import logo from './logo.svg';
import NavBar from './components/NavBar';
// import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(true);
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
    <NavBar loggedIn={loggedIn} />
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
