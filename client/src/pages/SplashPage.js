import './SplashPage.css';
import { useState, useEffect } from 'react';
import LoadingModal from '../components/LoadingModal';
import Heart from '../components/Heart';
import { useNavigate } from 'react-router-dom';
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
  BsHeart,
} from 'react-icons/bs';

export default function SplashPage({ loggedIn, imageSet }) {
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [randomImages, setRandomImages] = useState();

  useEffect(() => {
    async function getRandomImages() {
      try {
        setIsLoading(true);
        const data = await fetch('/api/museum/random');
        const images = await data.json();
        console.log('Returned images is: ', images);
        setRandomImages(images);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    getRandomImages();
  }, []);

  function increment() {
    setIndex((index + 1) % randomImages.length);
  }

  function decrement() {
    setIndex(customModulo(index - 1, randomImages.length));
  }

  if (isLoading) return <LoadingModal />;

  return (
    <div className="splash-page">
      <div className="row">
        <div className="col-full">
          <div className="arrow-wrap">
            <BsFillArrowLeftCircleFill
              onClick={() => decrement()}
              className="arrow"
            />
          </div>
          {/* <div className="img-wrap">
            {loggedIn && <SplashHeart />}
            <img src={randomImages[index].imageUrl} alt="splash-page art" />
          </div> */}
          <SplashArt artObj={randomImages[index]} loggedIn={loggedIn} />
          <div className="arrow-wrap">
            <BsFillArrowRightCircleFill
              onClick={() => increment()}
              className="arrow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SplashHeart({ onClick }) {
  return (
    <div className="heart-wrap hover-pointer">
      <BsHeart className="heart" />
    </div>
  );
}

function customModulo(n, m) {
  // used because Javascript doesn't handle negative modulo 'correctly'.
  return ((n % m) + m) % m;
}

function SplashArt({ artObj, loggedIn }) {
  const navigate = useNavigate();

  return (
    <div className="img-wrap">
      {loggedIn && (
        <div className="splash-heart-wrap">
          {' '}
          <Heart
            artId={artObj.id}
            userId={JSON.parse(sessionStorage.getItem('userObj'))?.user.userId}
            userLiked={
              JSON.parse(sessionStorage.getItem('favorites'))
                ? JSON.parse(sessionStorage.getItem('favorites')).includes(
                    artObj.id
                  )
                : false
            }
          />
        </div>
      )}
      <img
        onClick={() => navigate(`/object/${artObj.id}`)}
        src={artObj.imageUrl}
        className={`splash-image ${loggedIn && 'hover-pointer'}`}
        alt="splash-page art"
      />
    </div>
  );
}
