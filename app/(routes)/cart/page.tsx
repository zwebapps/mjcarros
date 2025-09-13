"use client";

import { useEffect, useState } from "react";

import useCart from "@/hooks/use-cart";
import CartItem from "./_components/cart-item";
import Footer from "@/components/footer";
import { ShoppingCart as ShoppingCartIcon } from "lucide-react";
import { Summary } from "./_components/summary";
import { useSearchParams, useRouter } from "next/navigation";

const CartPage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const cart = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams?.get("success");
  const canceled = searchParams?.get("canceled");
  const orderId = searchParams?.get("orderId");
  const sessionId = searchParams?.get("session_id");
  const [status, setStatus] = useState<"success" | "canceled" | "verifying" | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verify payment server-side and clear cart only on success
  useEffect(() => {
    const verify = async () => {
      if (success === "1" && orderId && sessionId) {
        const flagKey = `confirmed-${sessionId}`;
        if (sessionStorage.getItem(flagKey)) {
          setStatus("success");
          return;
        }
        setStatus("verifying");
        try {
          const res = await fetch('/api/orders/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, sessionId })
          });
          if (res.ok) {
            cart.removeAllCart();
            sessionStorage.setItem(flagKey, "1");
            setStatus("success");
            
            // Get the order data to extract email
            const orderData = await res.json();
            const email = orderData?.email || orderData?.userEmail;
            
            // Redirect to guest orders page with email pre-filled
            const t = setTimeout(() => {
              if (email) {
                router.push(`/orders/guest?email=${encodeURIComponent(email)}`);
              } else {
                router.push("/orders/guest");
              }
            }, 2000);
            return () => clearTimeout(t);
          } else {
            setStatus("canceled");
          }
        } catch (e) {
          setStatus("canceled");
        }
      }
    };
    verify();
  }, [success, orderId, sessionId, cart, router]);

  useEffect(() => {
    if (!isMounted) return;
    if (canceled === "1") {
      setStatus("canceled");
    }
  }, [isMounted, canceled]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="bg-white ">
      <div className="mx-auto max-w-7xl min-h-screen">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-black">Shopping Cart</h1>

          {status === "verifying" && (
            <div className="mt-4 rounded bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3">
              Verifying payment...
            </div>
          )}
          {status === "success" && (
            <div className="mt-4 rounded bg-green-50 border border-green-200 text-green-800 px-4 py-3">
              <div className="font-semibold">🎉 Payment successful! Your order is confirmed.</div>
              <div className="text-sm mt-1">Redirecting to your order details...</div>
            </div>
          )}
          {status === "canceled" && (
            <div className="mt-4 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3">
              Payment not completed. You can try again or continue shopping.
            </div>
          )}

          {cart.items.length === 0 && !status && (
            <div className="flex flex-col items-center justify-center py-40">
              <ShoppingCartIcon size={160} />
              <p className="text-neutral-500">Your cart is empty.</p>
            </div>
          )}
          <div className="lg:grid lg:grid-cols-12 lg:items-start gap-x-12">
            <div className="lg:col-span-7">
              <ul>
                {cart.items.map((item, index) => (
                  <CartItem key={index} data={item} />
                ))}
              </ul>
            </div>
            {cart.items.length > 0 && <Summary />}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
