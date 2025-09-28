"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import toast from 'react-hot-toast';
import { useSearchParams } from "next/navigation";

interface OrderItemProduct {
  _id?: string;
  imageURLs?: string[];
}

interface OrderItem {
  _id: string;
  productId?: string;
  productName: string;
  quantity?: number;
  product?: OrderItemProduct | null;
}

interface Order {
  _id: string;
  isPaid: boolean;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function GuestOrdersPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search if email is provided in URL
  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
      // Auto-search after a short delay to ensure component is mounted
      setTimeout(() => {
        handleSearchWithEmail(emailParam);
      }, 100);
    }
  }, [searchParams]);

  const handleSearchWithEmail = async (emailToSearch: string) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch('/api/orders/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSearch }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data);
      
      if (data.length === 0) {
        toast('No orders found for this email address', {
          icon: 'ℹ️',
        });
      } else {
        toast.success(`Found ${data.length} order(s)`);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error(error.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!email || !/.+@.+\..+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    await handleSearchWithEmail(email);
  };

  const handlePrint = (order: Order) => {
    window.open(`/api/orders/${order._id || order._id}/invoice`, "_blank");
  };

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Look Up Your Orders</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Your Email</CardTitle>
          <CardDescription>
            Enter the email address you used when placing your order to view your order history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading}
              className="px-8"
            >
              {isLoading ? 'Searching...' : 'Search Orders'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Searching for your orders...</p>
        </div>
      )}

      {hasSearched && !isLoading && orders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No orders found for this email address.</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure you're using the same email address you provided when placing your order.
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
          <div className="space-y-6">
            {orders.map((order) => {
              const baseUrl = (process.env.NEXT_PUBLIC_S3_BASE_URL || "").replace(/\/$/, "");
              const normalize = (src: string): string => {
                if (!src) return '/logo.png';
                if (/^https?:\/\//.test(src)) {
                  if (src.includes('images.unsplash.com') && !src.includes('?')) {
                    return `${src}?w=600&h=400&fit=crop&auto=format`;
                  }
                  return src;
                }
                if (src.startsWith('/uploads/')) return src;
                if (baseUrl) return `${baseUrl}/${src.replace(/^\/+/, '')}`;
                return `/${src.replace(/^\/+/, '')}`;
              };

              const primaryImage = normalize(order.orderItems[0]?.product?.imageURLs?.[0] || '');
              const dateStr = new Date(order.createdAt).toLocaleString();
              return (
                <div key={order._id} className="border rounded p-4">
                  <div className="flex items-start gap-4">
                    {/* Left large image */}
                    <div className="relative h-28 w-40 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      {primaryImage ? (
                        <Image 
                          src={primaryImage} 
                          alt={order.orderItems[0]?.productName || 'Order'} 
                          fill 
                          className="object-cover" 
                          sizes="160px" 
                          onError={(e) => { (e.currentTarget as any).src = '/logo.png'; }}
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200" />
                      )}
                    </div>
                    {/* Right details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold truncate">Order #{(order._id).toString().slice(-6)}</p>
                          <p className="text-sm text-gray-500">{dateStr}</p>
                        </div>
                        <div className={`text-sm font-medium ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                          {order.isPaid ? 'Paid' : 'Pending'}
                        </div>
                      </div>

                      {/* Items list */}
                      <ul className="mt-4 divide-y">
                        {order.orderItems.map((item) => {
                          const image = normalize(item.product?.imageURLs?.[0] || "");
                          const qty = item.quantity ?? 1;
                          const soldOut = qty === 0;
                          return (
                            <li key={item._id || item.productId || item.productName} className="py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {image ? (
                                  <div className="relative h-10 w-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                    <Image 
                                      src={image} 
                                      alt={item.productName} 
                                      fill 
                                      className="object-cover" 
                                      sizes="40px" 
                                      onError={(e) => { (e.currentTarget as any).src = '/logo.png'; }}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded bg-gray-200" />
                                )}
                                <span className="text-sm text-gray-800 truncate">{item.productName}</span>
                              </div>
                              <div className="text-sm font-medium">
                                {soldOut ? (
                                  <span className="text-red-600">SOLD</span>
                                ) : (
                                  <span className="text-gray-700">Qty: {qty}</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="mt-3 flex items-center gap-4">
                        <button
                          onClick={() => handlePrint(order)}
                          className="text-indigo-600 hover:text-indigo-500 text-sm underline"
                        >
                          Invoice (PDF)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
