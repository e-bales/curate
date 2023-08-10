import './Gallery.css';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BsPencilSquare } from 'react-icons/bs';
import LoadingModal from '../components/LoadingModal';
import holderImage from '../default-product-img.jpg';

export default function Gallery() {
  const { userId } = useParams();
  const [requestedArt, setRequestedArt] = useState();
  const [userArtInfo, setUserArtInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sameUser, setSameUser] = useState(true);
  const [error, setError] = useState();
  const [name, setName] = useState(undefined);
  // let name;

  useEffect(() => {
    async function getGalleryData() {
      try {
        setIsLoading(true);
        console.log('Requesting gallery data...');
        const id = JSON.parse(localStorage.getItem('userObj'))?.user.userId;
        if (!id) {
          throw new Error(' : Please log in to access this page.');
        }
        const req = {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        };
        if (id !== Number(userId)) {
          setSameUser(false);
          const data = await fetch(`/api/db/${userId}`);
          const otherJson = await data.json();
          setName(otherJson.username);
          console.log("Other user's data is: ", data);
        }
        const response = await fetch(`/api/gallery/${userId}`, req);
        if (!response.ok) {
          throw new Error('Could not retrieve gallery data...');
        }
        const json = await response.json();
        console.log(json);
        setUserArtInfo(json);
        const artData = [];
        for (let i = 0; i < 5; i++) {
          if (json[i]) {
            const artResponse = await fetch(
              `/api/museum/object/${json[i].artId}`,
              req
            );
            artData.push(await artResponse.json());
          } else {
            artData.push({});
          }
        }
        console.log('RequestedArt is: ', artData);
        setRequestedArt(artData);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    getGalleryData();
  }, [userId]);

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
    <div className="gallery-wrap">
      <div className="gallery-title-wrap bebas-font">
        {sameUser ? 'Curate Your Gallery' : `${name}'s Gallery`}
      </div>
      <div className="gallery-content-wrap">
        {requestedArt?.map((element, index) => (
          <GalleryDisplay
            key={index}
            artInfo={element}
            userInfo={userArtInfo[index]}
            sameUser={sameUser}
          />
        ))}
      </div>
    </div>
  );
}

function GalleryDisplay({ userInfo, artInfo, sameUser }) {
  console.log('ArtInfo is: ', artInfo);
  console.log('UserInfo is: ', userInfo);
  const artId = artInfo.objectID;
  const description = userInfo?.description;

  if (!userInfo) {
    return (
      <div className="gd-wrap belleza-font">
        <div className="gd-col">
          <div className="gd-row gd-image">
            {sameUser ? (
              <Link to={`/favorites/1`} className="gd-image-link">
                <div className="gd-image-wrap">
                  <img src={holderImage} alt="Holder Piece" />
                </div>
              </Link>
            ) : (
              <div className="gd-image-link">
                <div className="gd-image-wrap">
                  <img src={holderImage} alt="Holder Piece" />
                </div>
              </div>
            )}
          </div>
          <div className="gd-row gd-info">
            <h3 className="gd-art-title">
              {sameUser
                ? 'Curate your Gallery!'
                : 'Encourage others to add to their Gallery!'}
            </h3>
            <h3 className="gd-art-artist">
              {sameUser ? 'Add from Your Favorites' : ''}
            </h3>
          </div>
          <div className="gd-row gd-description"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="gd-wrap belleza-font">
      <div className="gd-col">
        {sameUser && <EditPencil artId={artId} description={description} />}
        <div className="gd-row gd-image">
          <Link to={`/object/${artId}`} className="gd-image-link">
            <div className="gd-image-wrap">
              <img
                className="gd-art-image"
                src={artInfo.primaryImageSmall}
                alt={`Piece by ${
                  artInfo.artistDisplayName
                    ? artInfo.artistDisplayName
                    : 'Unknown artist'
                }`}
              />
            </div>
          </Link>
        </div>
        <div className="gd-row gd-info">
          <h3 className="gd-art-title">{artInfo.title}</h3>
          <h3 className="gd-art-artist">
            {artInfo.artistAlphaSort
              ? artInfo.artistAlphaSort
              : 'Unknown artist'}
          </h3>
          <div className="gd-row gd-description">{description}</div>
        </div>
      </div>
    </div>
  );
}

function EditPencil({ artId, description }) {
  const navigate = useNavigate();

  function toEdit() {
    localStorage.setItem('editData', JSON.stringify(description));
    navigate(`/gallery/submission/${artId}/edit`);
  }

  return (
    <div className="edit-pencil-wrap">
      <BsPencilSquare
        onClick={() => toEdit()}
        className="edit-pencil hover-pointer"
      />
    </div>
  );
}
