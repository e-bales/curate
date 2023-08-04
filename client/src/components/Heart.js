import './Heart.css';
import { useState } from 'react';
import { BsHeart, BsHeartFill } from 'react-icons/bs';

export default function Heart({ artId, userId, userLiked }) {
  const [liked, setLiked] = useState(userLiked);

  async function sendServerLike() {
    try {
      console.log('Adding like to db?');
      const req = {
        method: 'POST',
      };
      const res = await fetch(`/api/favorites/add/${userId}/${artId}`, req);
      if (!res.ok) {
        throw new Error(
          `Could not add favorite for user: ${userId} and artId: ${artId}`
        );
      }
      const newFavorites = JSON.parse(sessionStorage.getItem('favorites')).push(
        artId
      );
      sessionStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (err) {
      throw new Error('Could not perform liking db call on this piece.');
    }
  }

  async function sendServerUnlike() {
    try {
      const req = {
        method: 'DELETE',
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
      throw new Error('Could not perform disliking db call on this piece.');
    }
  }

  async function likeHeart() {
    console.log(`UserID: ${userId} liked art of ID ${artId}`);
    await sendServerLike();
    setLiked(true);
  }

  async function unLikeHeart() {
    console.log(`UserID: ${userId} unliked art of ID ${artId}`);
    await sendServerUnlike();
    setLiked(false);
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
