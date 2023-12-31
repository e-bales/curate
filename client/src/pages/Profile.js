import './Profile.css';
import LoadingModal from '../components/LoadingModal';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [searchError, setSearchError] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [followerNames, setFollowerNames] = useState([]);

  useEffect(() => {
    async function getFollowers(userId) {
      try {
        const data = await requestFollowers(userId);
        setFollowers(data);
        setFollowerNames(data.map((element) => element.username));
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    const id = JSON.parse(localStorage.getItem('userObj')).user.userId;
    getFollowers(id);
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    try {
      setSearchLoading(true);
      setSearchError(false);
      setSearchResults([]);
      const formData = new FormData(event.target);
      const userData = Object.fromEntries(formData.entries());
      const search = userData.search;
      if (search.split(' ').length > 1 || search.length < 3) {
        throw new Error(' : Invalid search parameters');
      }
      const userId = JSON.parse(localStorage.getItem('userObj'))?.user.userId;
      const req = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      const result = await getSearchData(req, userId, userData.search);
      const newArray = [];
      for (let i = 0; i < result.length; i++) {
        if (!followerNames.includes(result[i].username)) {
          newArray.push(result[i]);
        }
      }
      setSearchResults(newArray);
    } catch (err) {
      setSearchError(err);
    } finally {
      setSearchLoading(false);
    }
  }

  async function unFollowUser(requestedUser) {
    try {
      const userId = JSON.parse(localStorage.getItem('userObj'))?.user.userId;
      const req = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      await fetch(
        `/api/followers/delete/${userId}/${requestedUser.userId}`,
        req
      );
      setFollowers((prev) => {
        return prev.filter(
          (element) => element.userId !== requestedUser.userId
        );
      });
      setFollowerNames((prev) => {
        return prev.filter((element) => element !== requestedUser.username);
      });
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
    return <div className="standard-error">{error.message}</div>;
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
            <h2 className="curators-title">Find other Curators!</h2>
          </div>
          <SearchBar onSubmit={handleSearch} />
          <div className="search-error">
            {searchError &&
              'Your search must be one word and over two characters long.'}
          </div>
          <div className="search-results">
            {searchLoading && <LoadingModal />}
            {searchResults.map((element) => (
              <div key={element.userId} className="user-wrap">
                <UserResult
                  user={element}
                  setFollowers={setFollowers}
                  followers={followers}
                />
              </div>
            ))}
          </div>
          <div className="follower-list">
            <div className="followers-title">
              <h3>Curators you follow:</h3>
            </div>
            {followers.map((element, index) => (
              <div className="follower-list-wrap">
                <UserFollower
                  key={index}
                  followedUser={element}
                  onClick={() => unFollowUser(element)}
                />
              </div>
            ))}
          </div>
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
                JSON.parse(localStorage.getItem('userObj'))?.user.userId
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
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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

function UserResult({ user, setFollowers, followers }) {
  const [followed, setFollowed] = useState(false);

  for (let i = 0; i < followers.length; i++) {
    if (user.userId === followers[i].id) {
      return;
    }
  }

  async function followUser() {
    try {
      const req = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      const currId = JSON.parse(localStorage.getItem('userObj'))?.user.userId;
      const requestId = user.userId;
      const res = await fetch(`/api/followers/add/${currId}/${requestId}`, req);
      if (!res.ok) {
        throw new Error('Could not add to followers');
      }
      setFollowed(true);
      setFollowers((prev) => {
        return prev.concat([user]);
      });
    } catch (err) {
      alert('Could not follow user, please try again later.');
    }
  }

  return (
    <div className="user-result-wrap">
      <div className="user-name-wrap">
        <h3 className="user-name belleza-font">{user.username}</h3>
      </div>
      <div className="follow-button-wrap">
        <button
          onClick={() => followUser()}
          type="button"
          disabled={followed}
          className={`follow-button belleza-font ${
            followed ? 'followed' : 'hover-pointer'
          }`}>
          Follow
        </button>
      </div>
    </div>
  );
}

function UserFollower({ followedUser, onClick }) {
  return (
    <div className="followed-user-wrap">
      <div className="user-column">
        <Link to={`/gallery/${followedUser.userId}`} className="follower-link">
          <h3 className="followed-user-name">{followedUser.username}</h3>
        </Link>
      </div>
      <div className="user-column profile-right">
        <div className="unfollow hover-pointer">
          <h3 onClick={() => onClick()}>Unfollow</h3>
        </div>
      </div>
    </div>
  );
}
