import './GallerySubmission.css';
import LoadingModal from '../components/LoadingModal';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GallerySubmission({ edit }) {
  const { objectId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [artData, setArtData] = useState();

  useEffect(() => {
    async function getData() {
      try {
        const favorites = JSON.parse(localStorage.getItem('favorites'));
        if (!favorites.includes(Number(objectId))) {
          throw new Error(
            `Object ${objectId} not currently in your favorites, cannot add to your Gallery...`
          );
        }
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

  async function removeFromGallery(artId) {
    try {
      setSubmissionLoading(true);
      const req = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      };
      const response = await fetch(
        `/api/gallery/${
          JSON.parse(localStorage.getItem('userObj'))?.user.userId
        }/${artId}`,
        req
      );
      if (!response.ok) {
        throw new Error(
          'Could not remove from Gallery, please try again later.'
        );
      }
      setRemoved(true);
    } catch (err) {
      setSubmissionError(true);
    } finally {
      setSubmissionLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (removed) {
        throw new Error('Could not submit to a deleted submission.');
      }
      setSubmissionLoading(true);
      setSubmissionError(false);
      const formData = new FormData(event.target);
      const userData = Object.fromEntries(formData.entries());
      const req = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      };
      const res = await fetch(
        `/api/gallery/${
          JSON.parse(localStorage.getItem('userObj'))?.user.userId
        }/${objectId}`,
        req
      );
      if (!res.ok) {
        throw new Error(`update Error ${res.status}`);
      }
      setIsSubmitted(true);
    } catch (err) {
      setSubmissionError(true);
    } finally {
      setSubmissionLoading(false);
    }
  }

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
            <div className="gallery-submission-wrap">
              <div className="gallery-form-wrap">
                <form className="gallery-submission" onSubmit={handleSubmit}>
                  <label className="gallery-sub-title" htmlFor="gallery-text">
                    {isSubmitted
                      ? 'Succesfully submitted!'
                      : edit
                      ? 'Edit Submission'
                      : 'Gallery Submission'}
                  </label>
                  {submissionError ? (
                    <p className="sub-error">
                      Could not submit to your Gallery, please try again later.
                    </p>
                  ) : (
                    ''
                  )}
                  <div className="textarea-wrap">
                    <textarea
                      id="gallery-text"
                      className="belleza-font"
                      name="gallery-text"
                      maxLength={400}
                      disabled={removed}
                      placeholder="Add your thoughts...">
                      {edit && JSON.parse(localStorage.getItem('editData'))}
                    </textarea>
                    {edit && !removed && (
                      <div
                        onClick={() => removeFromGallery(artData.objectID)}
                        className="delete-gallery-text hover-pointer">
                        Remove from Gallery
                      </div>
                    )}
                  </div>

                  {!isSubmitted && !removed ? (
                    <div className="gallery-sub-button-wrap">
                      <button
                        disabled={submissionLoading}
                        className="gallery-button bebas-font hover-pointer">
                        {submissionLoading ? 'Loading...' : 'Curate!'}
                      </button>
                    </div>
                  ) : (
                    <ReturnText />
                  )}
                </form>
              </div>
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

function ReturnText() {
  const navigate = useNavigate();
  return (
    <div className="return-text-wrap">
      <div className="return-links">
        <div className="return-col">
          <p className="hover-pointer return-text" onClick={() => navigate(-1)}>
            Return
          </p>
        </div>
        <div className="gallery-col">
          <p
            className="hover-pointer return-text"
            onClick={() =>
              navigate(
                `/gallery/${
                  JSON.parse(localStorage.getItem('userObj'))?.user.userId
                }`
              )
            }>
            To Gallery
          </p>
        </div>
      </div>
    </div>
  );
}
