import { getPhotoUrl, handleImgError } from '../lib/images';

export default function DepartmentCard({ department, onSelect }) {
  return (
    <div className="col-md-6 col-lg-4">
      <div className="cardx">
        <img
          src={getPhotoUrl(department.image_index)}
          alt={`${department.name} department`}
          loading="lazy"
          onError={handleImgError}
        />
        <div className="bd">
          <div className="d-flex gap-3 align-items-center mb-2">
            <div className="ico">
              <i className={`fa-solid ${department.icon}`} />
            </div>
            <h4 className="m-0 fs-5">{department.name}</h4>
          </div>
          <p className="text-mut small">{department.description}</p>
          <button
            type="button"
            className="btn btn-line btn-sm"
            onClick={() => onSelect(department)}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
