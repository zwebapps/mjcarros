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
  const [status, setStatus] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Stripe return
  useEffect(() => {
    if (!isMounted) return;
    if (success === "1") {
      const processed = sessionStorage.getItem("stripe-success-processed");
      if (!processed) {
        cart.removeAllCart();
        sessionStorage.setItem("stripe-success-processed", "1");
      }
      setStatus("success");
      const t = setTimeout(() => router.push("/shop"), 2500);
      return () => clearTimeout(t);
    }
    if (canceled === "1") {
      setStatus("canceled");
    }
  }, [isMounted, success, canceled, cart, router]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="bg-white ">
      <div className="mx-auto max-w-7xl min-h-screen">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-black">Shopping Cart</h1>

          {status === "success" && (
            <div className="mt-4 rounded bg-green-50 border border-green-200 text-green-800 px-4 py-3">
              Payment successful. Your order is confirmed. Redirecting to shop...
            </div>
          )}
          {status === "canceled" && (
            <div className="mt-4 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3">
              Payment canceled. You can try again or continue shopping.
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
