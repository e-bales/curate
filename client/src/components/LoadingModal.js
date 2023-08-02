import './LoadingModal.css';
// import GrayOut from './GrayOut';

export default function LoadingModal() {
  return (
    <div className="loading-wrap">
      {/* <div className='grayout-wrap'>
        <GrayOut />
      </div> */}
      <div className="modal-wrap">
        <div className="modal">
          <div className="loading-row">
            <div className="loading-wrap bebas-font">
              <h1>Loading...</h1>
            </div>
          </div>
          <div className="spinner-row">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
