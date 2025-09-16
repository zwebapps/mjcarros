"use client";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import formatDate, { sortByDate } from "@/app/utils/formateDate";
import ReactPaginate from "react-paginate";
import { useState } from "react";
import TitleHeader from "@/app/(admin)/_components/title-header";

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
                  <button onClick={() => handlePrint(order)} className="text-indigo-600 hover:text-indigo-500 underline">
                    Invoice (PDF)
                  </button>
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
