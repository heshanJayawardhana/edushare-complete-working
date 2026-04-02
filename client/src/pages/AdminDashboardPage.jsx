import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, users: [], resources: [], comments: [], inquiries: [] });
  const [loading, setLoading] = useState(true);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [dashboardRes, paymentsRes] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/payments/transactions')
    ]);

    setData(dashboardRes.data);
    setPaymentTransactions(paymentsRes.data?.transactions || []);
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

  async function updatePaymentStatus(transactionId, nextStatus) {
    setPaymentsLoading(true);
    try {
      await api.patch(`/payments/transactions/${transactionId}/status`, { status: nextStatus });
      const paymentsRes = await api.get('/payments/transactions');
      setPaymentTransactions(paymentsRes.data?.transactions || []);
    } finally {
      setPaymentsLoading(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-7xl px-4 py-10 text-slate-500">Loading admin dashboard...</main>;
  }

  const statusStyles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200'
  };

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

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Payment history</h2>
            <p className="mt-1 text-sm text-slate-600">Review student payments and set status</p>
          </div>
          {paymentsLoading ? (
            <p className="text-sm text-slate-500">Updating...</p>
          ) : (
            <p className="text-sm text-slate-500">{paymentTransactions.length} record(s)</p>
          )}
        </div>

        <div className="mt-5 overflow-x-auto">
          {paymentTransactions.length ? (
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-4 text-left font-medium text-slate-500">Date</th>
                  <th className="py-3 pr-4 text-left font-medium text-slate-500">Resource</th>
                  <th className="py-3 pr-4 text-left font-medium text-slate-500">Buyer</th>
                  <th className="py-3 pr-4 text-left font-medium text-slate-500">Amount</th>
                  <th className="py-3 pr-4 text-left font-medium text-slate-500">Status</th>
                  <th className="py-3 pr-4 text-left font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentTransactions.map((t) => {
                  const buyer = data.users.find((u) => String(u._id) === String(t.buyerId));
                  return (
                    <tr key={t.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{t.date}</td>
                      <td className="py-3 pr-4 text-slate-900 font-medium">{t.resourceName}</td>
                      <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{buyer?.name || 'Unknown'}</td>
                      <td className="py-3 pr-4 text-slate-900 font-semibold whitespace-nowrap">
                        LKR {Number(t.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[t.status] || statusStyles.pending}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {t.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updatePaymentStatus(t.id, 'approved')}
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                              disabled={paymentsLoading}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updatePaymentStatus(t.id, 'rejected')}
                              className="rounded-xl bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                              disabled={paymentsLoading}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-sm text-slate-500">No payment records found.</p>
          )}
        </div>
      </section>
    </main>
  );
}
