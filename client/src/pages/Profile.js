import './Profile.css';
import LoadingModal from '../components/LoadingModal';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
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
      console.log(event);
      const formData = new FormData(event.target);
      console.log(formData);
      const userData = Object.fromEntries(formData.entries());
      const query = userData.search;
      console.log(query);
    } catch (err) {}
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
          <div className="search-results"></div>
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

function SearchBar({ onSubmit }) {
  return (
    <div className="search-bar-wrap">
      <form onSubmit={(event) => onSubmit(event)}>
        <input
          type="text"
          className="search-bar"
          name="search"
          placeholder="Search for fellow curators..."></input>
      </form>
    </div>
  );
}
