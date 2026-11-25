import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useToast } from '../context/ToastContext';
import DepartmentCard from '../components/DepartmentCard';
import DepartmentModal from '../components/DepartmentModal';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    apiFetch('/api/departments')
      .then((res) => setDepartments(res.departments || []))
      .catch((err) => showToast(err.message, 'danger'))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <section className="sec fade-in">
      <div className="container">
        <div className="mb-4">
          <h2>Departments</h2>
          <p className="text-mut">Specialized clinics, one caring team.</p>
        </div>

        {loading ? (
          <p className="text-mut">Loading departments...</p>
        ) : (
          <div className="row g-4">
            {departments.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} onSelect={setSelectedDept} />
            ))}
          </div>
        )}
      </div>

      <DepartmentModal department={selectedDept} onClose={() => setSelectedDept(null)} />
    </section>
  );
}
