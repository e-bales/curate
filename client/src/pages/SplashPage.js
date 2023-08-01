import './SplashPage.css';
import { useState } from 'react';
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
  BsHeart,
} from 'react-icons/bs';

export default function SplashPage({ loggedIn, imageSet }) {
  const [index, setIndex] = useState(0);

  function increment() {
    setIndex((index + 1) % imageSet.length);
  }

  function decrement() {
    setIndex(customModulo(index - 1, imageSet.length));
  }

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
          <div className="img-wrap">
            {loggedIn && <SplashHeart />}
            <img src={imageSet[index]} alt="splash-page art" />
          </div>
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
