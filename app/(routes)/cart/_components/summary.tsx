"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Trash } from "lucide-react";

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
    // Check for user in localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const totalPrice = cart.items.reduce((total, item) => {
    return total + Number(item.price);
  }, 0);

  const onCheckout = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            id: item.id,
            quantity: 1,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Handle successful checkout
        cart.removeAll();
        router.push('/');
      }
    } catch (error) {
      console.error('Checkout error:', error);
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
      <Button
        onClick={onCheckout}
        disabled={cart.items.length === 0}
        className="w-full mt-6"
      >
        {user ? 'Checkout' : 'Sign in to checkout'}
      </Button>
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          or{" "}
          <Button
            variant="link"
            className="p-0 text-base text-black underline-offset-4 hover:underline"
            onClick={() => cart.removeAll()}
          >
            Continue Shopping
          </Button>
        </p>
      </div>
    </div>
  );
};
