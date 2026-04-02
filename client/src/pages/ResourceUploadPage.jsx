import { useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ResourceUploadPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
    faculty: 'Science',
    academicYear: '2024',
    price: 0,
    tags: ''
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (!file) throw new Error('Please choose a file.');

      const payload = new FormData();
      payload.append('file', file);

      const uploadRes = await api.post('/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileData = uploadRes.data;
      const { data } = await api.post('/resources', {
        ...form,
        price: Number(form.price || 0),
        tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        fileType: fileData.fileType
      });

      await refreshProfile();
      navigate(`/resource/${data.resource._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Upload a resource</h1>
        <p className="mt-2 text-slate-600">The file is uploaded first, then the resource record is saved to MongoDB.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <input
              placeholder="Category"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
            <input
              placeholder="Faculty"
              value={form.faculty}
              onChange={(event) => setForm((current) => ({ ...current, faculty: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
            <input
              placeholder="Academic year"
              value={form.academicYear}
              onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
            <input
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
            />
          </div>

          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="rounded-xl border border-slate-200 px-4 py-3"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? 'Uploading...' : 'Upload resource'}
          </button>
        </form>
      </div>
    </main>
  );
}
