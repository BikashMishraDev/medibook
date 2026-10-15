import { Link } from 'react-router-dom';

export default function DoctorCard({ doctor }) {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-44 bg-slate-100 overflow-hidden">
        <img
          src={doctor.profileImage || 'https://via.placeholder.com/300x200?text=Doctor'}
          alt={doctor.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-lg text-slate-800">{doctor.name}</h3>
          <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
            ★ {doctor.rating?.toFixed(1)}
          </span>
        </div>
        <p className="text-indigo-600 text-sm font-medium mb-2">{doctor.specialty}</p>
        <p className="text-slate-500 text-sm mb-1">{doctor.experience} years experience</p>
        <p className="text-slate-500 text-sm mb-4">₹{doctor.fee} consultation fee</p>
        <div className="mt-auto flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full ${doctor.availableDays?.length ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
            {doctor.availableDays?.length ? 'Available' : 'Unavailable'}
          </span>
          <Link to={`/doctors/${doctor._id}`} className="btn-primary text-sm py-2 px-4">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
