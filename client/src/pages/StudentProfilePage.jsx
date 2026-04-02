import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function StudentProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [myResources, setMyResources] = useState([]);
  const [orders, setOrders] = useState([]);
  const [library, setLibrary] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);

  useEffect(() => {
    refreshProfile().catch(() => {});
    Promise.allSettled([
      api.get('/resources/my/list'),
      api.get('/orders/my-orders'),
      api.get('/orders/my-library'),
      api.get('/inquiries/my'),
      api.get('/payments/transactions')
    ]).then((results) => {
      const resourcesRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const ordersRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const libraryRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const inquiriesRes = results[3].status === 'fulfilled' ? results[3].value : null;
      const paymentsRes = results[4].status === 'fulfilled' ? results[4].value : null;

      setMyResources(resourcesRes?.data?.resources || []);
      setOrders(ordersRes?.data?.orders || []);
      setLibrary(libraryRes?.data?.library || []);
      setInquiries(inquiriesRes?.data?.inquiries || []);
      setPaymentTransactions(paymentsRes?.data?.transactions || []);
    }).catch(() => {});
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">{user?.name}</h1>
        <p className="mt-2 text-slate-600">{user?.email}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ['Role', user?.role],
            ['Badge', user?.badge],
            ['Uploads', user?.uploadCount || 0],
            ['Downloads', user?.totalDownloads || 0]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">My resources</h2>
          <div className="space-y-3">
            {myResources.length ? myResources.map((resource) => (
              <div key={resource._id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{resource.title}</p>
                <p className="text-sm text-slate-500">{resource.category} · Downloads: {resource.downloads}</p>
              </div>
            )) : <p className="text-sm text-slate-500">You have not uploaded any resources yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">My orders</h2>
          <div className="space-y-3">
            {orders.length ? orders.map((order) => (
              <div key={order._id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">Order #{order._id.slice(-6)}</p>
                <p className="text-sm text-slate-500">
                  {order.items.length} item(s) · LKR {Number(order.totalPrice).toFixed(2)}
                </p>
              </div>
            )) : <p className="text-sm text-slate-500">No orders yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Payment history</h2>
          <div className="space-y-3">
            {paymentTransactions.length ? paymentTransactions.slice(0, 8).map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{t.resourceName}</p>
                <p className="text-sm text-slate-500">{t.date} · LKR {Number(t.amount || 0).toFixed(2)}</p>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    t.status === 'approved'
                      ? 'text-emerald-700'
                      : t.status === 'rejected'
                      ? 'text-red-700'
                      : 'text-amber-700'
                  }`}
                >
                  {t.status}
                </p>
              </div>
            )) : <p className="text-sm text-slate-500">No payments yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">My library</h2>
          <div className="space-y-3">
            {library.length ? library.map((item, index) => (
              <div key={`${item.resourceId}-${index}`} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700">
                  Open file
                </a>
              </div>
            )) : <p className="text-sm text-slate-500">Your purchased resources will appear here.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">My inquiries</h2>
          <div className="space-y-3">
            {inquiries.length ? inquiries.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-medium text-slate-900">{item.subject}</p>
                <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                <p className="mt-2 text-xs font-semibold text-brand-700">{item.status}</p>
                {item.answer && <p className="mt-2 text-sm text-emerald-700">Answer: {item.answer}</p>}
              </div>
            )) : <p className="text-sm text-slate-500">No inquiries yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
