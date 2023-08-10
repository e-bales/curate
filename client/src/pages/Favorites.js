import './Favorites.css';
import LoadingModal from '../components/LoadingModal';
import Heart from '../components/Heart';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BsArrowBarLeft, BsArrowBarRight } from 'react-icons/bs';

/**
 * The page which displays all the art pieces the user has Favorited (paginated on server side).
 */
export default function Favorites() {
  // Used for pagination
  const { pageNum: page } = useParams();
  // If we need to display the next arrow at the bottom.
  const [moreData, setMoreData] = useState(true);
  // Contains the information retrieved from the Met API
  const [requestedArt, setRequestedArt] = useState();
  // If we have hit our limit of 5 for pieces in the Gallery
  const [galleryMax, setGalleryMax] = useState(false);
  // If we are currently waiting for the API to return data
  const [isLoading, setIsLoading] = useState(true);
  // If there is an error
  const [error, setError] = useState();
  // For navigating to other pages.
  const navigate = useNavigate();

  useEffect(() => {
    // Function for retrieving the objectId's of 10 of the art pieces
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

  // Return the loading modal if we have not gotten our API response yet, and
  // return an error message if there has been an error retrieving data.
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

// Function for actually requesting our server to query our database for the user's
// favorites. Server will also query the Met API for the information for each art piece on the page.
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

/**
 * The Component for displaying a singular art piece.
 * art: the art object returned from the Met API
 * galleryMax: Boolean denoting if we can add more to our Gallery or not.
 */
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

/**
 * Component displayed at the bottom of the page. Used for navigating forward or
 * backwards in terms of pagination.
 * page: integer of the current page.
 * left: boolean denoting lleft or right arrow being rendered.
 * moreData: booleaon denoting if there is more data, used for displaying the right arrow or not.
 * onClick: navigate function to paginate forward or backwards.
 */
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
