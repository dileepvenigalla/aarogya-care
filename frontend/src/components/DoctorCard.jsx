import { Link } from 'react-router-dom';
import { getPhotoUrl, handleImgError } from '../lib/images';

export default function DoctorCard({ doctor, colClass = 'col-md-6 col-lg-3' }) {
  return (
    <div className={colClass}>
      <div className="cardx">
        <img
          src={getPhotoUrl(doctor.image_index)}
          alt={`${doctor.name}, ${doctor.department}`}
          loading="lazy"
          onError={handleImgError}
        />
        <div className="bd">
          <h4 className="fs-5 mb-0">{doctor.name}</h4>
          <div className="text-primary fw-semibold small mb-2">{doctor.department}</div>
          <div className="small text-mut">
            <div>
              <i className="fa-solid fa-graduation-cap me-2" />
              {doctor.qualification}
            </div>
            <div>
              <i className="fa-solid fa-briefcase-medical me-2" />
              {doctor.experience} years experience
            </div>
            <div>
              <i className="fa-regular fa-calendar me-2" />
              {doctor.days}
            </div>
            <div>
              <i className="fa-solid fa-indian-rupee-sign me-2" />₹{doctor.fee} consultation
            </div>
          </div>
          <Link to={`/book?doc=${doctor.id}`} className="btn btn-blue btn-sm mt-3 w-100">
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
