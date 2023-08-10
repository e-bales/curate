import './Favorites.css';
import LoadingModal from '../components/LoadingModal';
import Heart from '../components/Heart';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BsArrowBarLeft, BsArrowBarRight } from 'react-icons/bs';

export default function Favorites() {
  const { pageNum: page } = useParams();
  // const [page, setPage] = useState(pageNum);
  const [moreData, setMoreData] = useState(true);
  const [requestedArt, setRequestedArt] = useState();
  const [galleryMax, setGalleryMax] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * Gets the server to retrieve the objectId's of 10 of the art pieces
     */
    async function getFirstData() {
      try {
        const id = JSON.parse(localStorage.getItem('userObj'))?.user.userId;
        if (!id) {
          throw new Error(' : Please log in to access this page.');
        }
        const data = await getFavoritesData(id, page);
        setGalleryMax(data.galleryFull);
        setMoreData(data.more);
        setRequestedArt(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    getFirstData();
  }, [page]);

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
    <div className="display-wrap">
      <div className="display-title">
        <h1 className="title bebas-font">Your Favorites</h1>
      </div>
      <div className="display-column">
        {requestedArt.length === 0 ? (
          <p className="no-favorites bebas-font">
            Explore the site to add to your favorites!
          </p>
        ) : (
          requestedArt?.map((artPiece) => (
            <div key={artPiece.objectID} className="piece-wrap">
              <FavoritesDisplay art={artPiece} galleryMax={galleryMax} />
            </div>
          ))
        )}
      </div>
      {requestedArt.length !== 0 && (
        <div className="page-traversal">
          <FavoritesLink
            page={Number(page)}
            left={true}
            moreData={moreData}
            onClick={() => navigate(`/favorites/${Number(page) - 1}`)}
          />
          <p className="page-number bebas-font">{page}</p>
          <FavoritesLink
            page={Number(page)}
            left={false}
            moreData={moreData}
            onClick={() => navigate(`/favorites/${Number(page) + 1}`)}
          />
        </div>
      )}
    </div>
  );
}

async function getFavoritesData(id, page) {
  try {
    const req = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    };
    const res = await fetch(`/api/favorites/${id}/${page}`, req);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Please log in to access this page.');
      }
      throw new Error(`fetch Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw new Error(`Could not RETRIEVE department data...: ${err.message}`);
  }
}

function FavoritesDisplay({ art, galleryMax }) {
  if (art.message === 'Not a valid object') {
    return;
  }
  return (
    <div className="art-object-wrap">
      <div className="art-row">
        <div className="inner-display-column">
          <Link
            to={`/object/${art.objectID}`}
            className="image-link multi-link">
            <div className="art-wrap">
              <img
                className="art"
                src={art.primaryImageSmall}
                alt={`Piece by ${art.artistDisplayName}`}
              />
            </div>
          </Link>
        </div>
        <div className="information-column">
          <div className="information-row">
            <div className="title-column">
              <Link to={`/object/${art.objectID}`} className="multi-link">
                <div className="art-title belleza-font">{art.title}</div>
              </Link>
            </div>
            <div className="heart-column">
              <Heart
                artId={art.objectID}
                userId={
                  JSON.parse(localStorage.getItem('userObj'))?.user.userId
                }
                userLiked={
                  JSON.parse(localStorage.getItem('favorites'))
                    ? JSON.parse(localStorage.getItem('favorites')).includes(
                        art.objectID
                      )
                    : false
                }
              />
            </div>
          </div>
          <div className="information-row favorites-col belleza-font">
            <div className="artist-title">
              <p>
                {art.artistAlphaSort ? art.artistAlphaSort : 'Unknown artist'}
              </p>
              <p className="art-date">
                {art.objectDate ? `${art.objectDate}` : 'Unknown date'}
              </p>
            </div>
            {galleryMax ? (
              <p className="gallery-addition">Your Gallery is Full</p>
            ) : !art.isGallery ? (
              <Link to={`/gallery/submission/${art.objectID}`}>
                <p className="gallery-addition">Add to your Gallery</p>
              </Link>
            ) : (
              <p className="gallery-addition">Already in your Gallery</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoritesLink({ page, left, moreData, onClick }) {
  if (left) {
    return (
      <BsArrowBarLeft
        onClick={() => onClick()}
        className={`traversal-button hover-pointer ${
          page === 1 ? 'blank' : ''
        }`}
      />
    );
  } else {
    return (
      <BsArrowBarRight
        onClick={() => onClick()}
        className={`traversal-button hover-pointer ${!moreData ? 'blank' : ''}`}
      />
    );
  }
}
