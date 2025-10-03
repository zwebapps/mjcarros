"use client";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import formatDate, { sortByDate } from "@/app/utils/formateDate";
import ReactPaginate from "react-paginate";
import { useState } from "react";
import TitleHeader from "@/app/(admin)/_components/title-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/ui/confirm-dialog";

type OrderItem = {
  id: string;
  orderId: string;
  productName: string;
  quantity?: number;
};

type Order = {
  _id: string;
  isPaid: boolean;
  phone: string;
  address: string;
  userEmail?: string;
  customerName?: string;
  createdAt: string;
  orderItems: OrderItem[];
};

const TableOrders = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 25;

  const queryClient = useQueryClient();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Stripe");
  const [editIsPaid, setEditIsPaid] = useState(false);

  const openEdit = (order: Order) => {
    setEditing(order);
    setEditEmail(order.userEmail || "");
    setEditPhone(order.phone || "");
    setEditAddress(order.address || "");
    setEditPaymentMethod("Stripe");
    setEditIsPaid(!!order.isPaid);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' } as any;
      await axios.patch(`/api/orders/${editing._id}`, {
        userEmail: editEmail,
        phone: editPhone,
        address: editAddress,
        paymentMethod: editPaymentMethod,
        isPaid: editIsPaid,
      }, { headers });
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (e) {
      // silent; keep modal open for retry
    }
  };
  const { error, data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const { data } = await axios.get("/api/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const sortedData = sortByDate(data);
      return sortedData as Order[];
    },
  });

  const offset = currentPage * productsPerPage;
  const currentProducts = data?.slice(offset, offset + productsPerPage);

  const handlePageClick = (selectedPage: { selected: number }) => {
    setCurrentPage(selectedPage.selected);
  };

  const handlePrint = (order: Order) => {
    window.open(`/api/orders/${order._id || order._id}/invoice`, "_blank");
  };

  const handleDelete = async (order: Order) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`/api/orders/${order._id}`, { headers });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setPendingDeleteId(null);
    } catch (e) {
      // no-op; UI will remain unchanged on failure
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <p>Something went wrong!</p>;
  }

  return (
    <>
      <TitleHeader
        title="Orders"
        count={data?.length}
        description="Manage orders for your store"
      />
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative z-50 w-full max-w-md rounded-md bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Order</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Input value={editEmail} onChange={(e)=>setEditEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone</label>
                <Input value={editPhone} onChange={(e)=>setEditPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Address</label>
                <Input value={editAddress} onChange={(e)=>setEditAddress(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Payment Method</label>
                <select className="w-full border rounded-sm h-10 px-2" value={editPaymentMethod} onChange={(e)=>setEditPaymentMethod(e.target.value)}>
                  <option value="Stripe">Stripe</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input id="paid" type="checkbox" checked={editIsPaid} onChange={(e)=>setEditIsPaid(e.target.checked)} />
                <label htmlFor="paid" className="text-sm">Mark as paid</label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={()=>setEditing(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save</Button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts?.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderItems[0]?.productName || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customerName ? `${order.customerName} (${order.userEmail || ''})` : (order.userEmail || '—')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {order.address}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.isPaid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.isPaid ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => handlePrint(order)} className="text-indigo-600 hover:text-indigo-500 underline">
                      Invoice (PDF)
                    </button>
                    <button onClick={() => openEdit(order)} className="text-blue-600 hover:text-blue-800 underline">
                      Edit
                    </button>
                    {pendingDeleteId === order._id ? (
                      <ConfirmDialog
                        open
                        title="Delete order?"
                        description="This action cannot be undone."
                        onCancel={() => setPendingDeleteId(null)}
                        onConfirm={() => handleDelete(order)}
                      />
                    ) : (
                      <button onClick={() => setPendingDeleteId(order._id)} className="text-red-600 hover:text-red-800 underline">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && (
        <ReactPaginate
          previousLabel={"Previous"}
          nextLabel={"Next"}
          breakLabel={"..."}
          pageCount={Math.ceil(data?.length / productsPerPage)}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageClick}
          containerClassName={"pagination flex space-x-2 justify-end mt-4"}
          previousLinkClassName={"bg-neutral-800 px-4 py-2 rounded text-white"}
          nextLinkClassName={"bg-neutral-800 px-4 py-2 rounded text-white"}
          disabledClassName={"opacity-50 cursor-not-allowed"}
          activeClassName={"bg-blue-700"}
          pageClassName="hidden"
        />
      )}
    </>
  );
};

export default TableOrders;
