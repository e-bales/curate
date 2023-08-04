import './SingleDisplay.css';
import LoadingModal from '../components/LoadingModal';
import { useEffect, useState } from 'react';
import Heart from '../components/Heart';
import { Link, useParams } from 'react-router-dom';

export default function SingleDisplay() {
  const { objectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [artData, setArtData] = useState();

  useEffect(() => {
    async function getData() {
      try {
        console.log('Requesting to retrieve art piece...');
        const data = await getArt(objectId);
        console.log('Single art piece retreived as: ', data);
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
  if (error) return <div>{error.message}</div>;

  return (
    <div className="sg-display-wrap">
      <div className="sg-display-row">
        <div className="sg-display-col column">
          <div className="sg-art-display">
            <div className="sg-img-wrap">
              <img
                className="sg-art"
                src={artData.primaryImage}
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
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={artData.primaryImage}>
                Raw Image
              </a>
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
                  JSON.parse(sessionStorage.getItem('userObj'))?.user.userId
                }
                userLiked={JSON.parse(
                  sessionStorage.getItem('favorites')
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
    const res = await fetch(`/api/museum/object/${artId}`);
    if (!res.ok) {
      console.log('Res: ', res);
      throw new Error(`fetch Error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    throw new Error(`Could not RETRIEVE piece data...: ${err.message}`);
  }
}
