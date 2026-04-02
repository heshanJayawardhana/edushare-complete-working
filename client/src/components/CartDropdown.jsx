import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartDropdown() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();

  async function checkout() {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    if (!items.length) return;
    navigate('/checkout');
  }

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
          <ShoppingCart size={16} />
          Cart ({totalItems})
        </summary>
        <div className="absolute right-0 z-30 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Your cart</h3>
          {!items.length ? (
            <p className="text-sm text-slate-500">No resources added yet.</p>
          ) : (
            <>
              <div className="max-h-72 space-y-3 overflow-auto">
                {items.map((item) => (
                  <div key={item._id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item._id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-brand-700">
                      {Number(item.price || 0) === 0 ? 'Free' : `LKR ${Number(item.price).toFixed(2)}`}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">Total: LKR {Number(totalPrice).toFixed(2)}</p>
                <button onClick={checkout} className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </details>
    </div>
  );
}
