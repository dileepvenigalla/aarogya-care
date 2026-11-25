import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="foot">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <h3 className="brand text-white">
              <i className="fa-solid fa-heart-pulse me-2" />
              AAROGYA CARE
            </h3>
            <p className="opacity-75">Compassionate, specialist care under one roof.</p>
          </div>
          <div className="col-6 col-lg-2">
            <h6>Explore</h6>
            <Link to="/about">About</Link>
            <Link to="/doctors">Doctors</Link>
            <Link to="/departments">Departments</Link>
          </div>
          <div className="col-6 col-lg-2">
            <h6>Patients</h6>
            <Link to="/book">Book a visit</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
          <div className="col-lg-4">
            <h6>Emergency 24/7</h6>
            <p className="fs-4 mb-1">+91 40 5555 0100</p>
            <small className="opacity-75">
              Demo application: sample data only. Do not enter real medical or sensitive personal
              information.
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}
