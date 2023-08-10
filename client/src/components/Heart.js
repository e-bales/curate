import './Heart.css';
import { useState } from 'react';
import {
  BsHeart,
  BsHeartFill,
  BsHeartbreak,
  BsHeartbreakFill,
} from 'react-icons/bs';

export default function Heart({ artId, userId, userLiked }) {
  const [liked, setLiked] = useState(userLiked);
  const [error, setError] = useState(false);

  async function sendServerLike() {
    try {
      const req = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      const res = await fetch(`/api/favorites/add/${userId}/${artId}`, req);
      if (!res.ok) {
        throw new Error('Could not add to your favorites.');
      }
      const array = JSON.parse(localStorage.getItem('favorites'));
      const newFavorites = array.concat([artId]);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async function sendServerUnlike() {
    try {
      const req = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      const res = await fetch(`/api/favorites/delete/${userId}/${artId}`, req);
      if (!res.ok) {
        throw new Error('Could not remove from your favorites.');
      }
      const array = JSON.parse(localStorage.getItem('favorites'));
      const index = array.indexOf(artId);
      if (index > -1) {
        array.splice(index, 1);
      }
      localStorage.setItem('favorites', JSON.stringify(array));
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async function likeHeart() {
    try {
      await sendServerLike();
      setLiked(true);
    } catch (err) {
      setError(err);
    }
  }

  async function unLikeHeart() {
    try {
      await sendServerUnlike();
      setLiked(false);
    } catch (err) {
      setError(err);
    }
  }

  if (error) {
    if (liked) {
      return (
        <div className="heart-wrap-display hover-pointer liked">
          <BsHeartbreakFill
            onClick={() => {
              alert(error.message);
            }}
            className="heart"
          />
        </div>
      );
    }
    return (
      <div className="heart-wrap-display hover-pointer unliked">
        <BsHeartbreak
          onClick={() => {
            alert(error.message);
          }}
          className="heart"
        />
      </div>
    );
  }

  if (liked) {
    return (
      <div className="heart-wrap-display hover-pointer liked">
        <BsHeartFill
          onClick={() => {
            unLikeHeart();
          }}
          className="heart"
        />
      </div>
    );
  } else {
    return (
      <div className="heart-wrap-display hover-pointer unliked">
        <BsHeart
          onClick={() => {
            likeHeart();
          }}
          className="heart"
        />
      </div>
    );
  }
}
