import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AppointmentCard from '../components/AppointmentCard';
import api from '../services/api';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments/my');
      setAppointments(data);
    } catch (err) {
      setError('Failed to load your appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (id) => {
    try {
      await api.put(`/appointments/${id}/cancel`);
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.');
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">My Appointments</h1>

        <div className="flex gap-2 mb-8">
          {['all', 'upcoming', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg mb-4">No {filter !== 'all' ? filter : ''} appointments found.</p>
            <Link to="/doctors" className="btn-primary inline-block">Book an Appointment</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <AppointmentCard key={a._id} appointment={a} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
