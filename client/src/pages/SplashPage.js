import './SplashPage.css';
import { useState, useEffect } from 'react';
import LoadingModal from '../components/LoadingModal';
import { useNavigate } from 'react-router-dom';
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from 'react-icons/bs';
import holderImage from '../default-product-img.jpg';

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
  if (error) return <div className="standard-error">{error.message}</div>;

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

function customModulo(n, m) {
  return ((n % m) + m) % m;
}

function SplashArt({ artObj, loggedIn }) {
  const navigate = useNavigate();

  return (
    <div className="img-wrap">
      <img
        onClick={
          artObj?.id
            ? () => navigate(`/object/${artObj?.id}`)
            : () => alert('Unknown Image Link')
        }
        src={artObj?.imageUrl ? artObj?.imageUrl : holderImage}
        className={`splash-image ${loggedIn && 'hover-pointer'}`}
        alt="splash-page art"
      />
    </div>
  );
}
