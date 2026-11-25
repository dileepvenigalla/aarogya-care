import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { getPhotoUrl, handleImgError } from '../lib/images';
import { useToast } from '../context/ToastContext';
import DepartmentCard from '../components/DepartmentCard';
import DoctorCard from '../components/DoctorCard';
import DepartmentModal from '../components/DepartmentModal';

const FEATURES = [
  ['fa-user-doctor', 'Specialist doctors', 'Senior consultants across 10 departments.'],
  ['fa-clock', 'Short waiting times', 'Book a slot online and walk straight in.'],
  ['fa-microscope', 'Modern diagnostics', 'In-house lab and imaging, results the same day.'],
  ['fa-hand-holding-heart', 'Care that listens', 'Nurses and doctors who explain every step.'],
];

const SERVICES = [
  ['fa-truck-medical', '24/7 Emergency'],
  ['fa-flask-vial', 'Laboratory'],
  ['fa-pills', 'Pharmacy'],
  ['fa-bed-pulse', 'In-patient rooms'],
  ['fa-video', 'Video consults'],
  ['fa-syringe', 'Vaccination'],
];

const TESTIMONIALS = [
  ['Meera S.', 'Booking took two minutes and the doctor was right on time.'],
  ['Rahul K.', 'The pediatric team made my daughter feel at ease.'],
  ['Sunita P.', 'Clear billing, kind nurses and a spotless ward.'],
];

const FAQS = [
  [
    'How do I book an appointment?',
    'Use Appointments in the menu, pick a department, doctor, date and time. You get a confirmation ID right away.',
  ],
  ['Can I cancel or reschedule?', 'Yes. Log in to your patient dashboard or call the front desk.'],
  ['What should I bring?', 'A photo ID and any previous reports.'],
  ['Do you accept insurance?', 'Most major insurers are accepted. Ask at billing.'],
  [
    'Is this site safe for real records?',
    'No. This is a demo application with sample data. Do not enter real medical records.',
  ],
];

function AnimatedStat({ target, suffix = '', label }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(target / 35);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(current);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="col-6 col-lg-3">
      <div className="stat">
        <b>
          {value.toLocaleString()}
          {suffix}
        </b>
        {label}
      </div>
    </div>
  );
}

export default function HomePage({ scrollSection }) {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([apiFetch('/api/departments'), apiFetch('/api/doctors')])
      .then(([deptRes, docRes]) => {
        setDepartments(deptRes.departments || []);
        setDoctors(docRes.doctors || []);
      })
      .catch(() => {
        showToast('Could not load hospital data from server.', 'danger');
      });
  }, [showToast]);

  useEffect(() => {
    if (!scrollSection) {
      window.scrollTo(0, 0);
      return;
    }
    const timer = setTimeout(() => {
      document.getElementById(`sec-${scrollSection}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(timer);
  }, [scrollSection]);

  async function handleContactSubmit(event) {
    event.preventDefault();
    if (contact.name.trim().length < 3) {
      return showToast('Name must be at least 3 characters.', 'danger');
    }
    if (!contact.email.includes('@')) {
      return showToast('Please enter a valid email address.', 'danger');
    }
    if (contact.message.trim().length < 10) {
      return showToast('Message must be at least 10 characters.', 'danger');
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(contact),
      });
      setContact({ name: '', email: '', message: '' });
      showToast(res.message || 'Message sent.');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in">
      <section className="hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h1>
                Your Health,
                <br />
                Our Priority.
              </h1>
              <p className="fs-5 text-mut my-4" style={{ maxWidth: 480 }}>
                Quality healthcare from caring specialists, with modern diagnostics and appointments
                that fit your day.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/book" className="btn btn-blue btn-lg">
                  Book an Appointment
                </Link>
                <Link to="/departments" className="btn btn-line btn-lg">
                  Explore Departments
                </Link>
              </div>
            </div>

            <div className="col-lg-6 position-relative">
              <div className="arch">
                <img
                  src={getPhotoUrl(0)}
                  alt="Hospital corridor"
                  onError={handleImgError}
                />
              </div>
              <div className="float-card" style={{ left: -10, bottom: 60 }}>
                <small className="text-mut">Next free slot</small>
                <div className="fw-bold">Dr. Ananya Reddy · 04:30 PM</div>
              </div>
              <div
                className="float-card"
                style={{ right: -6, top: 40, animationDelay: '1.5s' }}
              >
                <small className="text-mut">Emergency 24/7</small>
                <div className="fw-bold text-danger">
                  <i className="fa-solid fa-phone me-1" />
                  +91 40 5555 0100
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-4">
            <AnimatedStat target={120} suffix="+" label="Doctors" />
            <AnimatedStat target={50000} suffix="+" label="Patients" />
            <AnimatedStat target={10} label="Departments" />
            <AnimatedStat target={25} label="Years of experience" />
          </div>
        </div>
      </section>

      <section className="sec" id="sec-depts">
        <div className="container">
          <div className="mb-4">
            <h2>Featured departments</h2>
            <p className="text-mut">Specialist care for every part of you.</p>
          </div>
          <div className="row g-4">
            {departments.slice(0, 6).map((dept) => (
              <DepartmentCard key={dept.id} department={dept} onSelect={setSelectedDept} />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/departments" className="btn btn-navy">
              All departments
            </Link>
          </div>
        </div>
      </section>

      <section className="sec bg-light" id="sec-docs">
        <div className="container">
          <div className="mb-4">
            <h2>Top specialist doctors</h2>
            <p className="text-mut">Experienced, approachable and ready to help.</p>
          </div>
          <div className="row g-4">
            {doctors.slice(0, 4).map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="sec-about">
        <div className="container">
          <div className="mb-4">
            <h2>Why choose us</h2>
          </div>
          <div className="row g-5 align-items-center">
            <div className="col-lg-5">
              <div className="arch" style={{ aspectRatio: '1' }}>
                <img src={getPhotoUrl(8)} alt="Hospital building" onError={handleImgError} />
              </div>
            </div>
            <div className="col-lg-7">
              <div className="row g-4">
                {FEATURES.map(([icon, title, desc]) => (
                  <div className="col-sm-6" key={title}>
                    <div className="ico mb-3">
                      <i className={`fa-solid ${icon}`} />
                    </div>
                    <h4 className="fs-5">{title}</h4>
                    <p className="text-mut">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec bg-light" id="sec-services">
        <div className="container">
          <div className="mb-4">
            <h2>Our services</h2>
            <p className="text-mut">Everything you need, in one place.</p>
          </div>
          <div className="row g-3">
            {SERVICES.map(([icon, title]) => (
              <div className="col-6 col-lg-2" key={title}>
                <div className="cardx text-center p-3">
                  <div className="ico mx-auto mb-2">
                    <i className={`fa-solid ${icon}`} />
                  </div>
                  <b className="small">{title}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="sec-tm">
        <div className="container">
          <div className="mb-4">
            <h2>What patients say</h2>
          </div>
          <div className="row g-4">
            {TESTIMONIALS.map(([author, quote]) => (
              <div className="col-md-4" key={author}>
                <div className="panel h-100">
                  <div className="text-warning mb-2">★★★★★</div>
                  <p>{quote}</p>
                  <b>{author}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <div className="band d-md-flex justify-content-between align-items-center gap-4">
          <div>
            <h2 className="text-white">Emergency? Call right now.</h2>
            <p className="opacity-75 mb-0">Ambulance and trauma care, open 24 hours.</p>
          </div>
          <a href="tel:+914055550100" className="btn btn-light btn-lg mt-3 mt-md-0">
            <i className="fa-solid fa-phone me-2" />
            +91 40 5555 0100
          </a>
        </div>
      </div>

      <section className="sec" id="sec-faq">
        <div className="container">
          <div className="mb-4">
            <h2>Frequently asked questions</h2>
          </div>
          <div className="accordion">
            {FAQS.map(([question, answer], idx) => (
              <div className="accordion-item" key={question}>
                <h3 className="accordion-header">
                  <button
                    type="button"
                    className={`accordion-button ${openFaq === idx ? '' : 'collapsed'}`}
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  >
                    {question}
                  </button>
                </h3>
                {openFaq === idx && (
                  <div className="accordion-collapse collapse show">
                    <div className="accordion-body">{answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="sec-contact">
        <div className="container">
          <div className="mb-4">
            <h2>Visit or write to us</h2>
          </div>
          <div className="row g-4">
            <div className="col-lg-6">
              <iframe
                title="Hospital location map"
                className="w-100 rounded-4 border-0"
                style={{ height: '100%', minHeight: 320 }}
                loading="lazy"
                src="https://maps.google.com/maps?q=Hyderabad%20India&output=embed"
              />
            </div>
            <div className="col-lg-6">
              <form className="panel" onSubmit={handleContactSubmit} noValidate>
                <div className="mb-3">
                  <input
                    className="form-control"
                    placeholder="Your name"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="How can we help?"
                    value={contact.message}
                    onChange={(e) => setContact({ ...contact, message: e.target.value })}
                    required
                  />
                </div>
                <button className="btn btn-blue" type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <DepartmentModal department={selectedDept} onClose={() => setSelectedDept(null)} />
    </div>
  );
}
