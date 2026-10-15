import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DoctorList from '../components/DoctorList';
import api from '../services/api';

const specialtyOptions = ['Cardiologist', 'Dermatologist', 'Dentist', 'Neurologist', 'Orthopedic', 'General Physician'];

export default function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (specialty) params.specialty = specialty;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minRating) params.minRating = minRating;
      if (sortBy) params.sortBy = sortBy;

      const { data } = await api.get('/doctors', { params });
      setDoctors(data);
    } catch (err) {
      setError('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, specialty, maxPrice, minRating, sortBy]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const applyFilters = (e) => {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (specialty) params.specialty = specialty;
    if (maxPrice) params.maxPrice = maxPrice;
    if (minRating) params.minRating = minRating;
    if (sortBy) params.sortBy = sortBy;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch(''); setSpecialty(''); setMaxPrice(''); setMinRating(''); setSortBy('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Find a Doctor</h1>

        <form onSubmit={applyFilters} className="card p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Search</label>
            <input className="input-field" placeholder="Name or specialty" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Specialty</label>
            <select className="input-field" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">All</option>
              {specialtyOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Max Price (₹)</label>
            <input type="number" min="0" className="input-field" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Min Rating</label>
            <select className="input-field" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
              <option value="">Any</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Sort By</label>
            <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="">Newest</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          <div className="flex gap-2 lg:col-span-6 justify-end">
            <button type="button" onClick={clearFilters} className="btn-secondary">Clear</button>
            <button type="submit" className="btn-primary">Apply Filters</button>
          </div>
        </form>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

        <DoctorList doctors={doctors} loading={loading} />
      </main>
      <Footer />
    </div>
  );
}
