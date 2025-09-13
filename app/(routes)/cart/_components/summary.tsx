"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useCart from "@/hooks/use-cart";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const Summary = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cart = useCart();
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch {}
    }
    setIsLoading(false);
  }, []);

  const totalPrice = cart.items.reduce((total, item) => {
    const unit = item.finalPrice && item.finalPrice > 0 ? item.finalPrice : Number(item.price);
    const itemTotal = item.totalPrice ?? unit * (item.quantity ?? 1);
    return total + itemTotal;
  }, 0);

  const onCheckout = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            id: item.id,
            title: item.title,
            price: (item.finalPrice && item.finalPrice > 0 ? item.finalPrice : Number(item.price)),
            quantity: item.quantity ?? 1,
            imageURLs: item.imageURLs,
          })),
          email: user?.email || 'guest@example.com',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data === 'string' ? data : data?.error || 'Checkout failed');
      if (data?.url) { 
        toast.success('Redirecting to payment...');
        window.location.href = data.url; 
        return; 
      }
      router.push('/');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please verify payment configuration.');
    }
  };

  if (isLoading) {
    return (
      <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  return (
    <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
      <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-base font-medium text-gray-900">Order total</div>
          <div className="text-base font-medium text-gray-900">
            ${totalPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Stripe */}
      <Button onClick={onCheckout} disabled={cart.items.length === 0} className="w-full mt-6">
        Checkout with Stripe
      </Button>

      {/* PayPal */}
      {paypalClientId && (
        <div className="mt-4">
          <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'EUR', intent: 'capture', components: 'buttons' }}>
            <PayPalButtons
              style={{ layout: 'horizontal' }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [
                    { amount: { currency_code: 'EUR', value: totalPrice.toFixed(2) }, description: 'MJ Carros Order' },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                await actions.order?.capture();
                try {
                  const response = await fetch('/api/paypal/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      items: cart.items.map((item) => ({ id: item.id, title: item.title })),
                      email: user?.email || 'guest@example.com',
                    }),
                  });
                  
                  if (response.ok) {
                    const orderData = await response.json();
                    cart.removeAllCart();
                    toast.success('Payment successful via PayPal!');
                    
                    // Redirect to guest orders page with email pre-filled
                    const email = user?.email || 'guest@example.com';
                    router.push(`/orders/guest?email=${encodeURIComponent(email)}`);
                  } else {
                    throw new Error('Failed to record order');
                  }
                } catch (e) {
                  console.error('Record order error', e);
                  toast.error('Payment successful but failed to record order. Please contact support.');
                }
              }}
              onError={(err) => {
                console.error('PayPal error', err);
                toast.error('PayPal payment failed. Please try again.');
              }}
              disabled={cart.items.length === 0}
            />
          </PayPalScriptProvider>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          <Button variant="link" className="p-0 text-base text-black underline-offset-4 hover:underline" onClick={() => cart.removeAllCart()}>
            Continue Shopping
          </Button>
        </p>
      </div>
    </div>
  );
};
