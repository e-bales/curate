import './MultiDisplay.css';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function MultiDisplay() {
  const { departmentId } = useParams();
  const [page, setPage] = useState(1);
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
    async function getFirstData() {
      try {
        console.log('Requesting to retrieve first 10 data pieces...');
        const data = await getCachedData(departmentId, 1);
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
  }, [departmentId]);

  if (isLoading) return <div>Loading data...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className="display-wrap">
      <div className="display-title">
        <h1 className="title">Display Test</h1>
      </div>
      <div className="display-column">
        {requestedArt?.map((artPiece) => (
          <div className="piece-wrap">
            <h1>artPiece found!</h1>
          </div>
        ))}
      </div>
    </div>
  );
}

async function sendApiRequest(id) {
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

async function getCachedData(id, page) {
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
