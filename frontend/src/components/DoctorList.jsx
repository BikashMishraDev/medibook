import DoctorCard from './DoctorCard';

export default function DoctorList({ doctors, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-44 skeleton" />
            <div className="p-5 space-y-3">
              <div className="h-4 skeleton w-2/3" />
              <div className="h-3 skeleton w-1/2" />
              <div className="h-3 skeleton w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!doctors.length) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-lg">No doctors match your search.</p>
        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor._id} doctor={doctor} />
      ))}
    </div>
  );
}
