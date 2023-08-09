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
      console.log('Adding like to db?');
      const req = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      };
      const res = await fetch(`/api/favorites/add/${userId}/${artId}`, req);
      if (!res.ok) {
        throw new Error(
          `Could not add favorite for user: ${userId} and artId: ${artId}`
        );
      }
      const array = JSON.parse(sessionStorage.getItem('favorites'));
      const newFavorites = array.concat([artId]);
      sessionStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  }

  async function sendServerUnlike() {
    try {
      const req = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      };
      const res = await fetch(`/api/favorites/delete/${userId}/${artId}`, req);
      if (!res.ok) {
        throw new Error(
          `Could not delete favorite for user: ${userId} and artId: ${artId}`
        );
      }
      const array = JSON.parse(sessionStorage.getItem('favorites'));
      const index = array.indexOf(artId);
      if (index > -1) {
        array.splice(index, 1);
      }
      sessionStorage.setItem('favorites', JSON.stringify(array));
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  }

  async function likeHeart() {
    try {
      console.log(`UserID: ${userId} liked art of ID ${artId}`);
      await sendServerLike();
      setLiked(true);
    } catch (err) {
      setError(true);
    }
  }

  async function unLikeHeart() {
    try {
      console.log(`UserID: ${userId} unliked art of ID ${artId}`);
      await sendServerUnlike();
      setLiked(false);
    } catch (err) {
      setError(true);
    }
  }

  if (error) {
    if (liked) {
      return (
        <div className="heart-wrap-display hover-pointer liked">
          <BsHeartbreakFill
            onClick={() => {
              alert('Unable to unlike artpiece at this time...');
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
            alert('Unable to like artpiece at this time...');
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
          onClick={async () => {
            await unLikeHeart();
          }}
          className="heart"
        />
      </div>
    );
  } else {
    return (
      <div className="heart-wrap-display hover-pointer unliked">
        <BsHeart
          onClick={async () => {
            await likeHeart();
          }}
          className="heart"
        />
      </div>
    );
  }
}
