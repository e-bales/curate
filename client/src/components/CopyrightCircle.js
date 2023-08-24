import './CopyrightCircle.css';
import { BsCCircle } from 'react-icons/bs';

export default function CopyrightCircle() {
  function alertCopyright() {
    alert(
      "Metropolitan Museum of Art is unable to share images of this piece with third-parties. Please click 'More Info' on the artwork's page to be redirected to their site."
    );
  }

  return (
    <div className="copyright-wrap">
      <div className="copyright">
        <BsCCircle
          onClick={() => alertCopyright()}
          className="copyright-icon hover-pointer"
        />
      </div>
    </div>
  );
}
