import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DoctorCard from '../components/DoctorCard';
import api from '../services/api';

const specialties = [
  { name: 'Cardiologist', icon: '❤️' },
  { name: 'Dermatologist', icon: '🧴' },
  { name: 'Dentist', icon: '🦷' },
  { name: 'Neurologist', icon: '🧠' },
  { name: 'Orthopedic', icon: '🦴' },
  { name: 'General Physician', icon: '🩺' }
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/doctors?sortBy=rating')
      .then((res) => setFeaturedDoctors(res.data.slice(0, 3)))
      .catch(() => setFeaturedDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/doctors${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight">
            Book Appointments with <span className="text-indigo-600">Trusted Doctors</span>
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto">
            Search, compare, and book verified doctors near you in a few clicks — no phone calls, no waiting rooms.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name or specialty..."
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Find a Doctor</button>
          </form>
        </div>
      </section>

      {/* Popular Specialties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Popular Specialties</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {specialties.map((s) => (
            <Link
              key={s.name}
              to={`/doctors?specialty=${encodeURIComponent(s.name)}`}
              className="card p-5 flex flex-col items-center gap-2 hover:-translate-y-1 transform transition-transform"
            >
              <span className="text-3xl">{s.icon}</span>
              <span className="text-sm font-medium text-slate-700 text-center">{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Doctors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Featured Doctors</h2>
          <Link to="/doctors" className="text-indigo-600 font-medium hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-72 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDoctors.map((d) => <DoctorCard key={d._id} doctor={d} />)}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Search', desc: 'Find the right doctor by specialty, price, or rating.' },
              { step: '2', title: 'Book', desc: 'Pick a date and time slot that works for you.' },
              { step: '3', title: 'Visit', desc: 'Get confirmation and show up for your appointment.' }
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-indigo-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to book your next appointment?</h2>
          <p className="text-indigo-100 mb-8">Join thousands of patients who trust MediBook for their healthcare needs.</p>
          <Link to="/doctors" className="inline-block bg-white text-indigo-600 font-medium px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors">
            Browse Doctors
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
