import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-xl text-white mb-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">M</span>
            MediBook
          </div>
          <p className="text-sm text-slate-400">Book trusted doctors near you, anytime, anywhere.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/doctors" className="hover:text-white">Find a Doctor</Link></li>
            <li><Link to="/appointments" className="hover:text-white">My Appointments</Link></li>
            <li><Link to="/register" className="hover:text-white">Sign Up</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Specialties</h4>
          <ul className="space-y-2 text-sm">
            <li>Cardiologist</li>
            <li>Dermatologist</li>
            <li>Dentist</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <p className="text-sm text-slate-400">support@medibook.com</p>
          <p className="text-sm text-slate-400">+91 22 1234 5678</p>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MediBook. All rights reserved.
      </div>
    </footer>
  );
}
