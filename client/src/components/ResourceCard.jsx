import { Download, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { useCart } from '../contexts/CartContext';

export default function ResourceCard({ resource }) {
  const { addToCart } = useCart();
  const isFree = Number(resource.price || 0) === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {resource.category}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">{resource.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isFree ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'}`}>
          {isFree ? 'Free' : `LKR ${Number(resource.price).toFixed(2)}`}
        </span>
      </div>

      <p className="mb-4 line-clamp-3 text-sm text-slate-600">{resource.description}</p>

      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <div>
          <p>{resource.faculty} · {resource.academicYear}</p>
          <p>By {resource.uploaderId?.name || 'Unknown uploader'}</p>
        </div>
        <div className="text-right">
          <RatingStars value={resource.averageRating || 0} size={16} />
          <p className="mt-1">{resource.ratingCount || 0} ratings</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Download size={14} />
          {resource.downloads || 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <Tag size={14} />
          {(resource.tags || []).slice(0, 2).join(', ') || 'General'}
        </span>
      </div>

      <div className="flex gap-3">
        <Link
          to={`/resource/${resource._id}`}
          className="flex-1 rounded-xl border border-brand-200 px-4 py-2 text-center font-medium text-brand-700 transition hover:bg-brand-50"
        >
          View
        </Link>
        <button
          type="button"
          onClick={() => addToCart(resource)}
          className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-700"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
