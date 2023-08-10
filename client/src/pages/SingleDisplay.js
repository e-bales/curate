import './SingleDisplay.css';
import LoadingModal from '../components/LoadingModal';
import { useEffect, useState } from 'react';
import Heart from '../components/Heart';
import { useParams } from 'react-router-dom';
import holderImage from '../default-product-img.jpg';

export default function SingleDisplay() {
  const { objectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [artData, setArtData] = useState();

  useEffect(() => {
    async function getData() {
      try {
        const data = await getArt(objectId);
        setArtData(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    getData();
  }, [objectId]);

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
    <div className="sg-display-wrap">
      <div className="sg-display-row">
        <div className="sg-display-col column">
          <div className="sg-art-display">
            <div className="sg-img-wrap">
              <img
                className="sg-art"
                src={artData.primaryImage ? artData.primaryImage : holderImage}
                alt={artData.title}
              />
            </div>
          </div>
          <div className="art-subtext belleza-font">
            <div className="subtext-row art-dimensions">
              {artData.dimensions
                ? artData.dimensions
                : 'Dimensions unavailable.'}
            </div>
            <div className="subtext-row">
              {artData.primaryImage && (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={artData.primaryImage}>
                  Raw Image
                </a>
              )}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={artData.objectURL}>
                More info
              </a>
            </div>
          </div>
        </div>
        <div className="sg-display-col info-col">
          <div className="sg-information-display belleza-font">
            <div className="sg-heart-wrap">
              <Heart
                artId={artData?.objectID}
                userId={
                  JSON.parse(localStorage.getItem('userObj'))?.user.userId
                }
                userLiked={JSON.parse(
                  localStorage.getItem('favorites')
                ).includes(artData?.objectID)}
              />
            </div>
            <div className="sg-title">
              <h1>{artData.title}</h1>
            </div>
            <div className="sg-artist-info">
              <div className="sg-artist">
                <h3>
                  {artData.artistAlphaSort
                    ? artData.artistAlphaSort
                    : 'Unknown Artist'}
                </h3>
              </div>
              <div className="sg-date">
                <h3>
                  {artData.objectDate ? artData.objectDate : 'Unknown date'}
                </h3>
              </div>
            </div>
            <div className="sg-art-info">
              <div className="sg-department">
                <h3>{artData.department}</h3>
              </div>
              <div className="sg-medium">
                <h3>{artData.medium}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getArt(artId) {
  try {
    const req = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    };
    const res = await fetch(`/api/museum/object/${artId}`, req);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Please log in to access this page.');
      }
      throw new Error(`fetch Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw new Error(`Could not RETRIEVE piece data...: ${err.message}`);
  }
}
