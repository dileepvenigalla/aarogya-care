import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from '../context/ToastContext';
import DoctorCard from '../components/DoctorCard';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([apiFetch('/api/doctors'), apiFetch('/api/departments')])
      .then(([docRes, deptRes]) => {
        setDoctors(docRes.doctors || []);
        setDepartments(deptRes.departments || []);
      })
      .catch((err) => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      const matchDept = !deptFilter || doc.department === deptFilter;
      const matchSearch =
        !query || `${doc.name} ${doc.department} ${doc.qualification}`.toLowerCase().includes(query);
      return matchDept && matchSearch;
    });
  }, [doctors, search, deptFilter]);

  return (
    <section className="sec fade-in">
      <div className="container">
        <div className="mb-4">
          <h2>Our doctors</h2>
          <p className="text-mut">Search by name or filter by department.</p>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-8">
            <input
              className="form-control"
              placeholder="Search doctors"
              aria-label="Search doctors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              aria-label="Department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-mut">Loading doctors...</p>
        ) : filtered.length > 0 ? (
          <div className="row g-4">
            {filtered.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        ) : (
          <p className="text-mut">No doctors match your search.</p>
        )}
      </div>
    </section>
  );
}
