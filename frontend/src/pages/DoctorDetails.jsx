import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';

export default function DoctorDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then((res) => setDoctor(res.data))
      .catch(() => setError('Doctor not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-12 w-full flex-1">
          <div className="h-64 skeleton rounded-2xl mb-6" />
          <div className="h-6 skeleton w-1/2 mb-3" />
          <div className="h-4 skeleton w-1/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-20 w-full flex-1 text-center">
          <p className="text-slate-500 text-lg mb-4">{error || 'Doctor not found.'}</p>
          <Link to="/doctors" className="text-indigo-600 font-medium hover:underline">← Back to doctors</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="card p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img
              src={doctor.profileImage || 'https://via.placeholder.com/300x300?text=Doctor'}
              alt={doctor.name}
              className="w-full aspect-square object-cover rounded-2xl"
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{doctor.name}</h1>
              <span className="flex items-center gap-1 font-medium text-amber-500">★ {doctor.rating?.toFixed(1)}</span>
            </div>
            <p className="text-indigo-600 font-medium mb-4">{doctor.specialty}</p>

            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-6">
              <p><span className="font-medium text-slate-800">Experience:</span> {doctor.experience} years</p>
              <p><span className="font-medium text-slate-800">Fee:</span> ₹{doctor.fee}</p>
              <p><span className="font-medium text-slate-800">Qualification:</span> {doctor.qualification || 'N/A'}</p>
              <p><span className="font-medium text-slate-800">Hospital:</span> {doctor.hospital || 'N/A'}</p>
            </div>

            <h3 className="font-semibold text-slate-800 mb-1">About</h3>
            <p className="text-slate-500 text-sm mb-6">{doctor.bio || 'No bio available.'}</p>

            <h3 className="font-semibold text-slate-800 mb-2">Available Days</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {doctor.availableDays?.length ? doctor.availableDays.map((d) => (
                <span key={d} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{d}</span>
              )) : <span className="text-sm text-slate-400">No availability listed</span>}
            </div>

            <h3 className="font-semibold text-slate-800 mb-2">Available Time Slots</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {doctor.availableSlots?.length ? doctor.availableSlots.map((t) => (
                <span key={t} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{t}</span>
              )) : <span className="text-sm text-slate-400">No slots listed</span>}
            </div>

            <Link to={`/book/${doctor._id}`} className="btn-primary inline-block text-base px-8 py-3">
              Book Appointment
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
