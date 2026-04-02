import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import RatingStars from '../components/RatingStars';
import CommentSection from '../components/CommentSection';
import InquiryForm from '../components/InquiryForm';
import { useCart } from '../contexts/CartContext';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [ratingsSummary, setRatingsSummary] = useState({ averageRating: 0, count: 0 });
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const tasks = [
      api.get(`/resources/${id}`),
      api.get(`/comments/${id}`),
      api.get(`/ratings/${id}`)
    ];

    if (isAuthenticated) {
      tasks.push(api.get(`/ratings/user/${id}`));
    }

    const [resourceRes, commentsRes, ratingsRes, userRatingRes] = await Promise.all(tasks);
    setResource(resourceRes.data.resource);
    setComments(commentsRes.data.comments || []);
    setRatingsSummary(ratingsRes.data.summary || { averageRating: 0, count: 0 });
    setUserRating(userRatingRes?.data?.rating?.rating || 0);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [id, isAuthenticated]);

  async function saveRating(nextRating) {
    await api.post('/ratings', { resourceId: id, rating: nextRating });
    await load();
  }

  async function handleDownload() {
    const { data } = await api.post(`/resources/${id}/download`);
    window.open(data.fileUrl, '_blank', 'noopener,noreferrer');
    await load();
  }

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-10 text-slate-500">Loading resource...</main>;
  }

  if (!resource) {
    return <main className="mx-auto max-w-6xl px-4 py-10 text-red-600">Resource not found.</main>;
  }

  const isFree = Number(resource.price || 0) === 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">{resource.category}</p>
              <h1 className="text-3xl font-bold text-slate-900">{resource.title}</h1>
              <p className="mt-3 text-slate-600">{resource.description}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-right">
              <p className="text-sm text-slate-500">Price</p>
              <p className="text-2xl font-bold text-brand-700">{isFree ? 'Free' : `LKR ${Number(resource.price).toFixed(2)}`}</p>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Uploader</p>
              <p className="font-semibold text-slate-900">{resource.uploaderId?.name}</p>
              <p className="text-sm text-slate-500">{resource.uploaderId?.badge}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Faculty / Year</p>
              <p className="font-semibold text-slate-900">{resource.faculty}</p>
              <p className="text-sm text-slate-500">{resource.academicYear}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">File</p>
              <p className="font-semibold text-slate-900">{resource.fileName}</p>
              <p className="text-sm text-slate-500">{resource.fileType?.toUpperCase()}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => addToCart(resource)} className="rounded-xl bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700">
              Add to cart
            </button>
            {isAuthenticated && (
              <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
                <Download size={18} />
                Download / open file
              </button>
            )}
          </div>

          <div className="mt-10">
            <CommentSection resourceId={id} comments={comments} onReload={load} />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Ratings</h2>
            <RatingStars value={ratingsSummary.averageRating || 0} />
            <p className="mt-2 text-sm text-slate-600">
              {ratingsSummary.averageRating || 0} average · {ratingsSummary.count || 0} ratings
            </p>

            {isAuthenticated ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Your rating</p>
                <RatingStars value={userRating} onChange={saveRating} size={20} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Sign in to submit a rating.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-100 p-3 text-brand-700">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{resource.fileName}</p>
                <p className="text-sm text-slate-500">Downloads: {resource.downloads}</p>
              </div>
            </div>
          </section>

          <InquiryForm resourceId={id} />
        </aside>
      </div>
    </main>
  );
}
