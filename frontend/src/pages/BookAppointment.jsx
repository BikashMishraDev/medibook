import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Builds the next 14 candidate dates, flagging which ones the doctor is available on
const buildDateOptions = (availableDays) => {
  const options = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = dayNames[d.getDay()];
    options.push({
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      isAvailable: !availableDays?.length || availableDays.includes(dayName)
    });
  }
  return options;
};

export default function BookAppointment() {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: date/time, 2: patient details, 3: summary
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    age: '',
    gender: '',
    reason: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/book/${doctorId}` } });
      return;
    }
    api.get(`/doctors/${doctorId}`)
      .then((res) => setDoctor(res.data))
      .catch(() => setError('Doctor not found.'))
      .finally(() => setLoading(false));
  }, [doctorId, user, navigate]);

  const dateOptions = doctor ? buildDateOptions(doctor.availableDays) : [];

  // Re-fetch this doctor's existing appointments for the chosen date so we can grey out taken slots
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime('');
    // Public doctor endpoint doesn't expose bookings directly, so we infer availability
    // by attempting fetch of all appointments is not available to patients; instead we
    // rely on the backend's conflict check at submit time and simply reset here.
    setBookedSlots([]);
    setSlotsLoading(false);
  }, [selectedDate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const goToDetails = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and a time slot.');
      return;
    }
    setError('');
    setStep(2);
  };

  const goToSummary = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.email || !form.age || !form.gender) {
      setError('Please fill in all required patient details.');
      return;
    }
    setError('');
    setStep(3);
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/appointments', {
        doctorId,
        date: selectedDate,
        time: selectedTime,
        patientName: form.fullName,
        patientPhone: form.phone,
        patientEmail: form.email,
        age: Number(form.age),
        gender: form.gender,
        reason: form.reason
      });
      setConfirmed(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to book appointment. Please try again.';
      setError(message);
      if (err.response?.status === 409) {
        setStep(1);
        setSelectedTime('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 w-full flex-1">
          <div className="h-96 skeleton rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center flex-1">
          <p className="text-slate-500 mb-4">{error || 'Doctor not found.'}</p>
          <Link to="/doctors" className="text-indigo-600 hover:underline">← Back to doctors</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 w-full flex-1 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Appointment Confirmed!</h1>
          <p className="text-slate-500 mb-8">A confirmation has been recorded. Here are the details:</p>
          <div className="card p-6 text-left space-y-2 mb-8">
            <p><span className="font-medium">Doctor:</span> {doctor.name}</p>
            <p><span className="font-medium">Specialty:</span> {doctor.specialty}</p>
            <p><span className="font-medium">Date:</span> {confirmed.date}</p>
            <p><span className="font-medium">Time:</span> {confirmed.time}</p>
            <p><span className="font-medium">Patient:</span> {confirmed.patientName}</p>
            <p><span className="font-medium">Fee:</span> ₹{confirmed.fee}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/appointments" className="btn-primary">View My Appointments</Link>
            <Link to="/doctors" className="btn-secondary">Browse More Doctors</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <Link to={`/doctors/${doctorId}`} className="text-sm text-indigo-600 hover:underline mb-4 inline-block">← Back to profile</Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Book Appointment with {doctor.name}</h1>
        <p className="text-slate-500 mb-8">{doctor.specialty} · ₹{doctor.fee}</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Date & Time', 'Patient Details', 'Confirm'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${step > i ? 'bg-indigo-600 text-white' : step === i + 1 ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${step === i + 1 ? 'font-medium text-slate-800' : 'text-slate-400'}`}>{label}</span>
              {i < 2 && <div className="flex-1 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

        {step === 1 && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Select a Date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {dateOptions.map((d) => (
                <button
                  key={d.value}
                  disabled={!d.isAvailable}
                  onClick={() => setSelectedDate(d.value)}
                  className={`shrink-0 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    selectedDate === d.value ? 'bg-indigo-600 text-white border-indigo-600' :
                    d.isAvailable ? 'border-slate-200 hover:border-indigo-400 text-slate-700' :
                    'border-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {selectedDate && (
              <>
                <h3 className="font-semibold text-slate-800 mb-3">Select a Time</h3>
                {slotsLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 skeleton rounded-lg" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                    {(doctor.availableSlots || []).map((t) => (
                      <button
                        key={t}
                        disabled={bookedSlots.includes(t)}
                        onClick={() => setSelectedTime(t)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedTime === t ? 'bg-indigo-600 text-white border-indigo-600' :
                          bookedSlots.includes(t) ? 'border-slate-100 text-slate-300 cursor-not-allowed line-through' :
                          'border-slate-200 hover:border-indigo-400 text-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end">
              <button onClick={goToDetails} className="btn-primary">Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={goToSummary} className="card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name *</label>
                <input name="fullName" required className="input-field" value={form.fullName} onChange={handleChange} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Phone Number *</label>
                <input name="phone" required className="input-field" value={form.phone} onChange={handleChange} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Email *</label>
                <input name="email" type="email" required className="input-field" value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Age *</label>
                <input name="age" type="number" min="0" required className="input-field" value={form.age} onChange={handleChange} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Gender *</label>
                <select name="gender" required className="input-field" value={form.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Reason for Appointment</label>
              <textarea name="reason" rows="3" className="input-field" value={form.reason} onChange={handleChange} />
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button type="submit" className="btn-primary">Continue</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Booking Summary</h3>
            <div className="space-y-2 text-sm mb-8">
              <p><span className="font-medium text-slate-700">Doctor:</span> {doctor.name}</p>
              <p><span className="font-medium text-slate-700">Specialty:</span> {doctor.specialty}</p>
              <p><span className="font-medium text-slate-700">Date:</span> {selectedDate}</p>
              <p><span className="font-medium text-slate-700">Time:</span> {selectedTime}</p>
              <p><span className="font-medium text-slate-700">Consultation Fee:</span> ₹{doctor.fee}</p>
              <p><span className="font-medium text-slate-700">Patient Name:</span> {form.fullName}</p>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary" disabled={submitting}>Back</button>
              <button onClick={confirmBooking} className="btn-primary" disabled={submitting}>
                {submitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
