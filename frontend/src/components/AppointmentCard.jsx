import { useState } from 'react';

const statusStyles = {
  upcoming: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-500'
};

export default function AppointmentCard({ appointment, onCancel }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmCancel = async () => {
    setCancelling(true);
    await onCancel(appointment._id);
    setCancelling(false);
    setShowConfirm(false);
  };

  return (
    <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-slate-800">{appointment.doctor?.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[appointment.status]}`}>
            {appointment.status}
          </span>
        </div>
        <p className="text-sm text-indigo-600 mb-1">{appointment.doctor?.specialty}</p>
        <p className="text-sm text-slate-500">{appointment.date} at {appointment.time}</p>
        <p className="text-sm text-slate-500">Patient: {appointment.patientName} · ₹{appointment.fee}</p>
      </div>

      {appointment.status === 'upcoming' && (
        <div className="shrink-0">
          <button onClick={() => setShowConfirm(true)} className="btn-secondary text-sm">
            Cancel
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-lg mb-2">Cancel this appointment?</h4>
            <p className="text-sm text-slate-500 mb-6">
              Your appointment with {appointment.doctor?.name} on {appointment.date} at {appointment.time} will be cancelled. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Keep it</button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2.5 rounded-lg disabled:opacity-50"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
