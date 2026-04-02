import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import ResourceCard from '../components/ResourceCard';

const FILTERS = {
  category: ['', 'Computer Science', 'Engineering', 'Business', 'Science', 'Mathematics'],
  faculty: ['', 'Science', 'Engineering', 'Business', 'Arts'],
  academicYear: ['', '2024', '2025', '2026']
};

export default function HomePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: '', faculty: '', academicYear: '' });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await api.get('/resources', { params: filters });
      setResources(data.resources || []);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [filters]);

  const stats = useMemo(() => ({
    count: resources.length,
    paid: resources.filter((item) => Number(item.price) > 0).length,
    free: resources.filter((item) => Number(item.price) === 0).length
  }), [resources]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Browse resources</h1>
        <p className="mt-2 text-slate-600">Search academic materials and add them to your cart or open the detail view.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search by title, description, category..."
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500 lg:col-span-2"
          />

          {Object.entries(FILTERS).map(([key, values]) => (
            <select
              key={key}
              value={filters[key]}
              onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            >
              {values.map((value) => (
                <option key={value || 'all'} value={value}>
                  {value || `All ${key}`}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">Resources: {stats.count}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Free: {stats.free}</span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-brand-700">Paid: {stats.paid}</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-soft">Loading resources...</div>
      ) : resources.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => <ResourceCard key={resource._id} resource={resource} />)}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-soft">
          No resources found for the selected filters.
        </div>
      )}
    </main>
  );
}
