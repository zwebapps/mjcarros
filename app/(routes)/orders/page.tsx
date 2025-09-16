"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface OrderItemProduct {
  imageURLs?: string[];
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity?: number;
  product?: OrderItemProduct | null;
}

interface Order {
  _id?: string;
  id: string;
  isPaid: boolean;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setOrders([]);
          setIsLoading(false);
          return;
        }
        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data === 'string' ? data : data?.error || 'Failed to load orders');
        console.log("My Orders:", data);
        setOrders(data);
      } catch (e: any) {
        setError(e.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handlePrint = (order: Order) => {
    window.open(`/api/orders/${order._id || order.id}/invoice`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="mt-4 text-red-600">{error}</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    const token = localStorage.getItem("authToken");
    return (
      <div className="px-4 py-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
        {!token ? (
          <div className="mt-4">
            <p className="text-gray-600 mb-4">You need to be logged in to view your orders.</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Don't have an account? You can still view your orders by email:</p>
              <a 
                href="/orders/guest" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Look Up Orders by Email
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-gray-600">You have no orders yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <div className="mt-6 space-y-6">
        {orders.map((order) => {
          const primaryImage = order.orderItems[0]?.product?.imageURLs?.[0] || '';
          const dateStr = new Date(order.createdAt).toLocaleString();
          return (
            <div key={order._id || order.id} className="border rounded p-4">
              <div className="flex items-start gap-4">
                {/* Left large image */}
                <div className="relative h-28 w-40 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  {primaryImage ? (
                    <Image src={primaryImage} alt={order.orderItems[0]?.productName || 'Order'} fill className="object-cover" sizes="160px" />
                  ) : (
                    <div className="h-full w-full bg-gray-200" />
                  )}
                </div>
                {/* Right details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold truncate">Order #{(order._id || order.id).toString().slice(-6)}</p>
                      <p className="text-sm text-gray-500">{dateStr}</p>
                    </div>
                    <div className={`text-sm font-medium ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {order.isPaid ? 'Paid' : 'Pending'}
                    </div>
                  </div>

                  {/* Items list */}
                  <ul className="mt-4 divide-y">
                    {order.orderItems.map((item) => {
                      const image = item.product?.imageURLs?.[0] || "";
                      const qty = item.quantity ?? 1;
                      const soldOut = qty === 0;
                      return (
                        <li key={item.productId} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {image ? (
                              <div className="relative h-10 w-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image src={image} alt={item.productName} fill className="object-cover" sizes="40px" />
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
  );
}
