import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { getPhotoUrl, handleImgError } from '../lib/images';

export default function DepartmentModal({ department, onClose }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!department) return;
    setLoading(true);
    apiFetch(`/api/departments/${department.id}`)
      .then((res) => setDoctors(res.doctors || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [department]);

  if (!department) return null;

  return (
    <div className="modal-backdrop-custom" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card-custom" onClick={(e) => e.stopPropagation()}>
        <div className="row g-0">
          <div className="col-md-5 d-none d-md-block">
            <img
              src={getPhotoUrl(department.image_index)}
              alt={department.name}
              style={{ width: '100%', height: '100%', minHeight: 320, objectFit: 'cover' }}
              onError={handleImgError}
            />
          </div>
          <div className="col-md-7 p-4">
            <button
              type="button"
              className="btn-close float-end"
              onClick={onClose}
              aria-label="Close"
            />
            <h3>{department.name}</h3>
            <p className="text-mut">{department.description}</p>
            <h6>Doctors</h6>
            {loading ? (
              <p className="text-mut small">Loading specialists...</p>
            ) : doctors.length > 0 ? (
              <ul>
                {doctors.map((doc) => (
                  <li key={doc.id}>
                    {doc.name} · {doc.days} · ₹{doc.fee}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-mut small">No doctors listed yet.</p>
            )}
            <Link
              to={`/book?dept=${encodeURIComponent(department.name)}`}
              className="btn btn-blue"
              onClick={onClose}
            >
              Book in {department.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
