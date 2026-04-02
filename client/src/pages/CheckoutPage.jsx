import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState(null);

  const formattedTotal = useMemo(() => Number(totalPrice).toFixed(2), [totalPrice]);

  function goMakePayment() {
    setError(null);
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }
    navigate('/payment');
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <ShoppingCart size={18} />
          </div>
          <h1 className="mt-4 text-xl font-bold">Checkout</h1>
          <p className="mt-2 text-sm text-slate-600">Your cart is empty.</p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="mt-6 rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Browse resources
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-1 text-sm text-slate-600">Review items and proceed to payment.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearCart();
            navigate('/home');
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Items</h2>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item._id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                {item.category && <p className="mt-0.5 text-xs text-slate-500">{item.category}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-semibold text-brand-700">
                  {Number(item.price || 0) === 0 ? 'Free' : `LKR ${Number(item.price).toFixed(2)}`}
                </p>
                <button
                  type="button"
                  onClick={() => removeFromCart(item._id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-red-500"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Total</p>
            <p className="text-lg font-bold text-slate-900">LKR {formattedTotal}</p>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={goMakePayment}
            className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Make payment
          </button>
        </div>
      </div>
    </div>
  );
}

