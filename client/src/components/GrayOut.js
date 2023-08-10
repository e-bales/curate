import './GrayOut.css';

/**
 * Component used for the background when the user is signing up or signing in.
 * onClick CURRENTLY is only to close the sign up/in modal and the gray out.
 */
export default function GrayOut({ onClick }) {
  return <div onClick={() => onClick()} className="gray-out"></div>;
}
