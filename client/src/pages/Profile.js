import './Profile.css';
import LoadingModal from '../components/LoadingModal';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [searchError, setSearchError] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    async function getFollowers(userId) {
      try {
        console.log('Requesting to retrieve followers...');
        const data = await requestFollowers(userId);
        console.log('Followers retrieved as: ', data);
        setFollowers(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    const id = JSON.parse(sessionStorage.getItem('userObj')).user.userId;
    getFollowers(id);
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    try {
      setSearchError(false);
      const formData = new FormData(event.target);
      const userData = Object.fromEntries(formData.entries());
      const search = userData.search;
      if (search.split(' ').length > 1 || search.length < 3) {
        throw new Error(' : Invalid search parameters');
      }
      const userId = JSON.parse(sessionStorage.getItem('userObj'))?.user.userId;
      const req = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      };
      const result = await getSearchData(req, userId, userData.search);
      // console.log('result is: ', result);
      setSearchResults(result);
    } catch (err) {
      setSearchError(err);
    }
  }

  if (isLoading) return <LoadingModal />;
  if (error) {
    if (error.message.split(': ')[1] === 'Please log in to access this page.') {
      return (
        <div className="error-wrap">
          <div className="unauthenticated bebas-font">
            Please log in to access this page.
          </div>
        </div>
      );
    }
    return <div>{error.message}</div>;
  }

  return (
    <div className="profile-wrap bebas-font">
      <div className="profile-row">
        <div className="profile-title-wrap">
          <h1 className="profile-title">Your Profile</h1>
        </div>
      </div>
      <div className="profile-row">
        <div className="profile-column left">
          <div className="curators-title-wrap">
            <h2 className="curators-title">Curators you follow</h2>
          </div>
          <SearchBar onSubmit={handleSearch} />
          <div className="search-error">
            {searchError &&
              'Your search must be one word and over two characters long.'}
          </div>
          <div className="search-results">
            {searchResults.map((element) => (
              <div key={element.userId} className="user-wrap">
                <UserResult user={element} />
              </div>
            ))}
          </div>
          <div className="follower-list"></div>
        </div>
        <div className="profile-column right">
          <div className="profile-button-wrap">
            <Link to={`/favorites/1`}>
              <button
                className="profile-button bebas-font hover-pointer"
                type="button">
                View your Favorites
              </button>
            </Link>
          </div>
          <div className="profile-button-wrap">
            <Link
              to={`/gallery/${
                JSON.parse(sessionStorage.getItem('userObj'))?.user.userId
              }`}>
              <button
                className="profile-button bebas-font hover-pointer"
                type="button">
                View your Gallery
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

async function requestFollowers(userId) {
  try {
    const req = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      },
    };
    const res = await fetch(`/api/followers/${userId}`, req);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Please log in to access this page.');
      }
      throw new Error(`fetch Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw new Error(
      `Could not RETRIEVE followers for ${userId}...: ${err.message}`
    );
  }
}

async function getSearchData(req, userId, search) {
  try {
    console.log('Req is: ', req);
    const res = await fetch(`/api/user/search/${userId}/${search}`, req);
    if (!res.ok) {
      throw new Error('Could not retrieve users of that search...');
    }
    const data = await res.json();
    return data;
  } catch {
    throw new Error('Could not retrieve search data...');
  }
}

function SearchBar({ onSubmit }) {
  return (
    <div className="search-bar-wrap">
      <form onSubmit={(event) => onSubmit(event)}>
        <input
          type="text"
          className="search-bar"
          name="search"
          autoComplete="off"
          placeholder="Search for fellow curators..."></input>
      </form>
    </div>
  );
}

function UserResult({ user }) {
  async function followUser() {
    try {
      const req = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      };
      const currId = JSON.parse(sessionStorage.getItem('userObj'))?.user.userId;
      const requestId = user.userId;
      console.log(`User ${currId} is attempting to follow ${requestId}`);
      const res = await fetch(`/api/followers/add/${currId}/${requestId}`, req);
      if (!res.ok) {
        throw new Error('Could not add to followers');
      }
    } catch (err) {
      alert('Could not follow user, please try again later.');
    }
  }

  return (
    <div className="user-result-wrap">
      <div className="user-name-wrap">
        <h3 className="user-name">{user.username}</h3>
      </div>
      <div className="follow-button-wrap">
        <button
          onClick={() => followUser()}
          type="button"
          className="follow-button">
          Follow
        </button>
      </div>
    </div>
  );
}
