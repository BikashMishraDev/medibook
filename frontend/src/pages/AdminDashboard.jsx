import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';

const emptyDoctorForm = {
  name: '', email: '', specialty: '', qualification: '', experience: '',
  hospital: '', fee: '', bio: '', profileImage: '',
  availableDays: '', availableSlots: ''
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, doctorsRes, apptRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/doctors'),
        api.get('/admin/appointments')
      ]);
      setStats(statsRes.data);
      setDoctors(doctorsRes.data);
      setAppointments(apptRes.data);
    } catch (err) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm(emptyDoctorForm);
    setShowDoctorForm(true);
  };

  const openEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      ...doctor,
      availableDays: (doctor.availableDays || []).join(', '),
      availableSlots: (doctor.availableSlots || []).join(', ')
    });
    setShowDoctorForm(true);
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...doctorForm,
      experience: Number(doctorForm.experience) || 0,
      fee: Number(doctorForm.fee) || 0,
      availableDays: doctorForm.availableDays.split(',').map((s) => s.trim()).filter(Boolean),
      availableSlots: doctorForm.availableSlots.split(',').map((s) => s.trim()).filter(Boolean)
    };
    try {
      if (editingDoctor) {
        await api.put(`/doctors/${editingDoctor._id}`, payload);
        flashSuccess('Doctor updated successfully.');
      } else {
        await api.post('/doctors', payload);
        flashSuccess('Doctor added successfully.');
      }
      setShowDoctorForm(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save doctor.');
    }
  };

  const handleDeleteDoctor = async () => {
    try {
      await api.delete(`/doctors/${deleteTarget._id}`);
      flashSuccess('Doctor deleted.');
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      setError('Failed to delete doctor.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch (err) {
      setError('Failed to update appointment status.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Admin Dashboard</h1>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}

        <div className="flex gap-2 mb-8 border-b border-slate-200">
          {['overview', 'doctors', 'appointments'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <>
            {tab === 'overview' && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Doctors', value: stats.totalDoctors },
                  { label: 'Total Patients', value: stats.totalPatients },
                  { label: 'Total Appointments', value: stats.totalAppointments },
                  { label: 'Upcoming Appointments', value: stats.upcomingAppointments }
                ].map((s) => (
                  <div key={s.label} className="card p-6">
                    <p className="text-sm text-slate-500 mb-1">{s.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'doctors' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button onClick={openAddDoctor} className="btn-primary">+ Add Doctor</button>
                </div>
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Specialty</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((d) => (
                        <tr key={d._id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                          <td className="px-4 py-3 text-slate-600">{d.specialty}</td>
                          <td className="px-4 py-3 text-slate-600">₹{d.fee}</td>
                          <td className="px-4 py-3 text-slate-600">{d.rating?.toFixed(1)}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={() => openEditDoctor(d)} className="text-indigo-600 hover:underline">Edit</button>
                            <button onClick={() => setDeleteTarget(d)} className="text-red-500 hover:underline">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'appointments' && (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a._id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-700">{a.patientName}</td>
                        <td className="px-4 py-3 text-slate-700">{a.doctor?.name}</td>
                        <td className="px-4 py-3 text-slate-600">{a.date}</td>
                        <td className="px-4 py-3 text-slate-600">{a.time}</td>
                        <td className="px-4 py-3">
                          <select
                            value={a.status}
                            onChange={(e) => handleStatusChange(a._id, e.target.value)}
                            className="input-field py-1 text-xs"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add/Edit Doctor Modal */}
      {showDoctorForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDoctorForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">{editingDoctor ? 'Edit Doctor' : 'Add Doctor'}</h3>
            <form onSubmit={handleDoctorSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <input required placeholder="Name" className="input-field" value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} />
              <input required type="email" placeholder="Email" className="input-field" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} />
              <input required placeholder="Specialty" className="input-field" value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })} />
              <input placeholder="Qualification" className="input-field" value={doctorForm.qualification} onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Experience (years)" className="input-field" value={doctorForm.experience} onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })} />
                <input required type="number" placeholder="Fee (₹)" className="input-field" value={doctorForm.fee} onChange={(e) => setDoctorForm({ ...doctorForm, fee: e.target.value })} />
              </div>
              <input placeholder="Hospital" className="input-field" value={doctorForm.hospital} onChange={(e) => setDoctorForm({ ...doctorForm, hospital: e.target.value })} />
              <input placeholder="Profile Image URL" className="input-field" value={doctorForm.profileImage} onChange={(e) => setDoctorForm({ ...doctorForm, profileImage: e.target.value })} />
              <textarea placeholder="Bio" rows="2" className="input-field" value={doctorForm.bio} onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })} />
              <input placeholder="Available Days (comma separated, e.g. Monday, Wednesday)" className="input-field" value={doctorForm.availableDays} onChange={(e) => setDoctorForm({ ...doctorForm, availableDays: e.target.value })} />
              <input placeholder="Available Slots (comma separated, e.g. 09:00 AM, 09:30 AM)" className="input-field" value={doctorForm.availableSlots} onChange={(e) => setDoctorForm({ ...doctorForm, availableSlots: e.target.value })} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDoctorForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingDoctor ? 'Save Changes' : 'Add Doctor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-lg mb-2">Delete {deleteTarget.name}?</h4>
            <p className="text-sm text-slate-500 mb-6">This will permanently remove the doctor from the platform.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg" onClick={handleDeleteDoctor}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
