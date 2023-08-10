import './Heart.css';
import { useState } from 'react';
import {
  BsHeart,
  BsHeartFill,
  BsHeartbreak,
  BsHeartbreakFill,
} from 'react-icons/bs';

/**
 * Component used for favoriting art pieces.
 * artId: id of the piece of art.
 * userId: id of the user liking the art.
 * userLiked: boolean of if the current piece is already liked by the user.
 */
export default function Heart({ artId, userId, userLiked }) {
  const [liked, setLiked] = useState(userLiked);
  const [error, setError] = useState(false);

  // connects to the server to add the art to the user's favorites
  async function sendServerLike() {
    try {
      const req = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      // server request
      const res = await fetch(`/api/favorites/add/${userId}/${artId}`, req);
      if (!res.ok) {
        throw new Error('Could not add to your favorites.');
      }
      // add the id to localStorage, to know if the user has liked the art piece
      // when we render a new page.
      const array = JSON.parse(localStorage.getItem('favorites'));
      const newFavorites = array.concat([artId]);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (err) {
      throw new Error(err.message);
    }
  }

  // connects to the server to remove the art from the user's favorites
  async function sendServerUnlike() {
    try {
      const req = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };
      // server request
      const res = await fetch(`/api/favorites/delete/${userId}/${artId}`, req);
      if (!res.ok) {
        throw new Error('Could not remove from your favorites.');
      }
      // remove the id from the localStorage, so we no longer have the heart
      // already filled when we have a re-render.
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

  // The function passed as the onClick for an unliked art piece.
  async function likeHeart() {
    try {
      await sendServerLike();
      setLiked(true);
    } catch (err) {
      setError(err);
    }
  }

  // The function passed as the onclick for a liked art piece.
  async function unLikeHeart() {
    try {
      await sendServerUnlike();
      setLiked(false);
    } catch (err) {
      setError(err);
    }
  }

  // If we have an error, than the database is probably down, or the API has changed.
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

  // Display a liked or unliked heart, varying with the state variable.
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
