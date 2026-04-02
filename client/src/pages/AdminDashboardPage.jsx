import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, users: [], resources: [], comments: [], inquiries: [] });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await api.get('/admin/dashboard');
    setData(response.data);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const statCards = useMemo(() => [
    ['Users', data.stats.totalUsers || 0],
    ['Resources', data.stats.totalResources || 0],
    ['Comments', data.stats.totalComments || 0],
    ['Orders', data.stats.totalOrders || 0],
    ['Revenue', `LKR ${Number(data.stats.totalRevenue || 0).toFixed(2)}`],
    ['Downloads', data.stats.totalDownloads || 0]
  ], [data.stats]);

  async function approveResource(id, isApproved) {
    await api.put(`/admin/resources/${id}/approve`, { isApproved });
    load();
  }

  async function deleteComment(id) {
    await api.delete(`/admin/comments/${id}`);
    load();
  }

  if (loading) {
    return <main className="mx-auto max-w-7xl px-4 py-10 text-slate-500">Loading admin dashboard...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Admin dashboard</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Users</h2>
          <div className="space-y-3">
            {data.users.map((user) => (
              <div key={user._id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                    {user.role} · {user.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Resources</h2>
          <div className="space-y-3">
            {data.resources.map((resource) => (
              <div key={resource._id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{resource.title}</p>
                    <p className="text-sm text-slate-500">{resource.uploaderId?.name} · {resource.category}</p>
                  </div>
                  <button
                    onClick={() => approveResource(resource._id, !resource.isApproved)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${resource.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {resource.isApproved ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Comments</h2>
          <div className="space-y-3">
            {data.comments.map((comment) => (
              <div key={comment._id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{comment.userId?.name} on {comment.resourceId?.title}</p>
                <p className="mt-1 text-sm text-slate-600">{comment.content}</p>
                <button onClick={() => deleteComment(comment._id)} className="mt-3 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                  Delete comment
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent inquiries</h2>
          <div className="space-y-3">
            {data.inquiries.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{item.subject}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs font-semibold text-brand-700">{item.status}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
