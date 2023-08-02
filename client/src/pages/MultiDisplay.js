import './MultiDisplay.css';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BsHeart } from 'react-icons/bs';

export default function MultiDisplay() {
  const { departmentId, pageNum } = useParams();
  const [page, setPage] = useState(pageNum);
  const [requestedArt, setRequestedArt] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    // async function storeApiData() {
    //   try {
    //     console.log('Requesting to cache data...');
    //     await sendApiRequest(departmentId);
    //   } catch (err) {
    //     setError(err);
    //   }
    // }
    /**
     * Gets the server to retrieve the objectId's of 10 of the art pieces
     */
    async function getFirstData() {
      try {
        console.log('Requesting to retrieve first 10 data pieces...');
        const data = await getServerData(departmentId, page);
        console.log('Retrieved art: ', data);
        setRequestedArt(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    // storeApiData();
    getFirstData();
  }, [departmentId, page]);

  if (isLoading) return <div>Loading data...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="display-wrap">
      <div className="display-title">
        <h1 className="title bebas-font">Display Test</h1>
      </div>
      <div className="display-column">
        {requestedArt?.map((artPiece) => (
          <div key={artPiece.objectID} className="piece-wrap">
            <ArtDisplay art={artPiece} />
          </div>
        ))}
      </div>
      <div className="display-buttons">
        <button type="button">Next Page!</button>
      </div>
    </div>
  );
}

async function getArtData(id) {
  try {
    const req = {
      method: 'GET',
    };
    console.log('Attempting to connect to server to cache...');
    const res = await fetch(`/api/museum/${id}`, req);
    if (!res.ok) {
      throw new Error(`fetch Error ${res.status}`);
    }
    // const data = res.json();
    // return data;
  } catch (err) {
    throw new Error(`Could not store department data...: ${err.message}`);
  }
}

async function getServerData(id, page) {
  try {
    const res = await fetch(`/api/museum/${id}/${page}`);
    if (!res.ok) {
      throw new Error(`fetch Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw new Error(`Could not RETRIEVE department data...: ${err.message}`);
  }
}

function ArtDisplay(art) {
  art = art.art;
  console.log('Creating piece for: ', art);
  // console.log('Art accession year is: ', art.art.accessionYear)
  if (art.message === 'Not a valid object') {
    return;
    // return ( <div className='art-error'>
    //            <h2>Could not retrieve art piece...</h2>
    //          </div>
    // )
  }
  return (
    <div className="art-object-wrap">
      <div className="art-row">
        <div className="inner-display-column">
          <div className="art-wrap">
            <img
              className="art"
              src={art.primaryImageSmall}
              alt={`Piece by ${art.artistDisplayName}`}
            />
          </div>
        </div>
        <div className="information-column">
          <div className="information-row">
            <div className="title-column">
              <div className="art-title belleza-font">{art.title}</div>
            </div>
            <div className="heart-column">
              <SplashHeart
                onClick={() => {
                  console.log('heart clicked!');
                }}
              />
            </div>
          </div>
          <div className="information-row">
            <div className="artist-title belleza-font">
              <p>
                {art.artistAlphaSort ? art.artistAlphaSort : 'Unknown artist'}
              </p>
              <p className="art-date">
                {art.objectDate ? `${art.objectDate}` : 'Unknown date'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplashHeart({ onClick }) {
  return (
    <div className="heart-wrap-display hover-pointer">
      <BsHeart className="heart" />
    </div>
  );
}
