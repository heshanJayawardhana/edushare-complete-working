import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'paypal'
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Card form state (only what backend needs: last4 + expiry)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState(''); // MM/YY
  const [cvv, setCvv] = useState('');

  const formattedTotal = useMemo(() => Number(totalPrice).toFixed(2), [totalPrice]);

  function formatCardInput(v) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiryInput(v) {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  function validateCard() {
    if (paymentMethod !== 'card') return { ok: true };

    const cardDigits = cardNumber.replace(/\s/g, '');
    const cardOk = /^\d{16}$/.test(cardDigits);

    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
    const cvvOk = /^\d{3}$/.test(cvv);

    if (!cardOk) return { ok: false, message: 'Card number must be exactly 16 digits.' };
    if (!expiryMatch) return { ok: false, message: 'Expiry date must be in MM/YY format.' };
    if (!cvvOk) return { ok: false, message: 'CVV must be exactly 3 digits.' };

    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);

    if (Number.isNaN(month) || month < 1 || month > 12) return { ok: false, message: 'Expiry month must be 01-12.' };
    if (year < 2000 || year > 2099) return { ok: false, message: 'Expiry year is invalid.' };

    return { ok: true };
  }

  async function pay() {
    setError(null);

    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }

    // Cart items are stored in localStorage, so they can become stale
    // when the backend in-memory DB restarts. Verify they still exist.
    const resourceIds = items.map((item) => item._id).filter(Boolean);
    try {
      const results = await Promise.allSettled(resourceIds.map((id) => api.get(`/resources/${id}`)));
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        clearCart();
        setError('Some cart items are no longer available. Please add them again and try again.');
        return;
      }

      // We only validate that the resource IDs still exist. (Purchase approval is handled elsewhere.)
    } catch (_e) {
      clearCart();
      setError('Cart validation failed. Please add the resources again.');
      return;
    }

    const cardValidation = validateCard();
    if (!cardValidation.ok) {
      setError(cardValidation.message);
      return;
    }

    setProcessing(true);
    try {
      const cardPayload =
        paymentMethod === 'card'
          ? (() => {
              const digits = cardNumber.replace(/\s/g, '');
              const cardLast4 = digits.slice(-4);
              const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
              const mm = Number(expiryMatch[1]);
              const yy = 2000 + Number(expiryMatch[2]);
              return { cardLast4, expiryMonth: mm, expiryYear: yy };
            })()
          : undefined;

      await api.post('/payments/checkout', {
        paymentMethod,
        items: items.map((item) => ({ resourceId: item._id, quantity: 1 })),
        card: cardPayload
      });

      clearCart();
      navigate('/profile');
    } catch (e) {
      const message = e?.response?.data?.message || 'Payment failed. Please try again.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h1 className="text-xl font-bold">Make payment</h1>
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
          <h1 className="text-2xl font-bold text-slate-900">Make Payment</h1>
          <p className="mt-1 text-sm text-slate-600">Select a method and complete your purchase.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-lg font-bold text-slate-900">LKR {formattedTotal}</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Payment method</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                paymentMethod === 'card' ? 'border-brand-600 bg-brand-50 text-brand-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="mx-auto mb-2 h-5 w-5" />
              Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                paymentMethod === 'paypal' ? 'border-brand-600 bg-brand-50 text-brand-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                P
              </div>
              PayPal
            </button>
          </div>
        </div>

        {paymentMethod === 'card' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Card details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="cardNumber">
                  Card number
                </label>
                <input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="expiry">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                    inputMode="numeric"
                    placeholder="MM/YY"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="cvv">
                    CVV
                  </label>
                  <input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    inputMode="numeric"
                    placeholder="123"
                    type="password"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'paypal' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">PayPal</h2>
            <p className="mt-3 text-sm text-slate-600">
              For now, PayPal payment is simulated. Your payment will be processed instantly.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={processing}
            onClick={pay}
            className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-600/60"
          >
            {processing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                Pay LKR {formattedTotal}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

