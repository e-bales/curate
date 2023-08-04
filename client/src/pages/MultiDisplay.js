import './MultiDisplay.css';
import LoadingModal from '../components/LoadingModal';
import Heart from '../components/Heart';
import { departments } from '../department';
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BsArrowBarLeft, BsArrowBarRight, BsHeart } from 'react-icons/bs';

export default function MultiDisplay() {
  const { departmentId, pageNum: page } = useParams();
  // const [page, setPage] = useState(pageNum);
  const [moreData, setMoreData] = useState(true);
  const [requestedArt, setRequestedArt] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const navigate = useNavigate();

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
  }, [departmentId, page]);

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
    return <div>{error.message}</div>;
  }

  return (
    <div className="display-wrap">
      <div className="display-title">
        <h1 className="title bebas-font">
          {departments[departmentId].displayName}
        </h1>
      </div>
      <div className="display-column">
        {requestedArt?.map((artPiece) => (
          <div key={artPiece.objectID} className="piece-wrap">
            <ArtDisplay art={artPiece} />
          </div>
        ))}
      </div>
      <div className="page-traversal">
        <PageLink
          departmentId={departmentId}
          page={Number(page)}
          left={true}
          moreData={moreData}
          onClick={() =>
            navigate(`/department/${departmentId}/${Number(page) - 1}`)
          }
        />
        <p className="page-number bebas-font">{page}</p>
        <PageLink
          departmentId={departmentId}
          page={Number(page)}
          left={false}
          moreData={moreData}
          onClick={() =>
            navigate(`/department/${departmentId}/${Number(page) + 1}`)
          }
        />
      </div>
    </div>
  );
}

// async function getArtData(id) {
//   try {
//     const req = {
//       method: 'GET',
//     };
//     console.log('Attempting to connect to server to cache...');
//     const res = await fetch(`/api/museum/${id}`, req);
//     if (!res.ok) {
//       throw new Error(`fetch Error ${res.status}`);
//     }
//     // const data = res.json();
//     // return data;
//   } catch (err) {
//     throw new Error(`Could not store department data...: ${err.message}`);
//   }
// }

async function getServerData(id, page) {
  try {
    const req = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      },
    };
    const res = await fetch(`/api/museum/department/${id}/${page}`, req);
    if (!res.ok) {
      // console.log('Res: ', res);
      // const msg = await res.json();
      // console.log(res.status);
      if (res.status === 401) {
        throw new Error('Please log in to access this page.');
      }
      throw new Error(`fetch Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
    throw new Error(`Could not RETRIEVE department data...: ${err.message}`);
  }
}

function ArtDisplay(art) {
  art = art.art;
  console.log('Creating art for: ', art);
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
                  JSON.parse(sessionStorage.getItem('userObj'))?.user.userId
                }
                userLiked={
                  JSON.parse(sessionStorage.getItem('favorites'))
                    ? JSON.parse(sessionStorage.getItem('favorites')).includes(
                        art.objectID
                      )
                    : false
                }
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

// function SplashHeart({ onClick }) {
//   return (
//     <div className="heart-wrap-display hover-pointer">
//       <BsHeart onClick={() => onClick()} className="heart" />
//     </div>
//   );
// }

function PageLink({ departmentId, page, left, moreData, onClick }) {
  let link = `/department/${departmentId}/`;
  // const length = dataArray?.length;
  if (left) {
    link += `${page - 1}`;
    return (
      <Link to={link}>
        <BsArrowBarLeft
          onClick={() => onClick()}
          className={`traversal-button hover-pointer ${
            page === 1 ? 'blank' : ''
          }`}
        />
      </Link>
    );
  } else {
    link += `${page + 1}`;
    return (
      <Link to={link}>
        <BsArrowBarRight
          onClick={() => onClick()}
          className={`traversal-button hover-pointer ${
            !moreData ? 'blank' : ''
          }`}
        />
      </Link>
    );
  }
}
