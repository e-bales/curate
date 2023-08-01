import './GrayOut.css';

export default function GrayOut({ onClick }) {
  return <div onClick={() => onClick()} className="gray-out"></div>;
}
