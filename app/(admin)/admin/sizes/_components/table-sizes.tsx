"use client";
import TitleHeader from "@/app/(admin)/_components/title-header";
import { Trash2, Edit } from "lucide-react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import formatDate, { sortByDate } from "@/app/utils/formateDate";
import ReactPaginate from "react-paginate";
import { useState } from "react";
import Link from "next/link";

type Sizes = {
  id: string;
  name: string;
  category: string;
  createdAt: string;
};

const TableSizes = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 5;

  const { error, data, isLoading } = useQuery({
    queryKey: ["sizes"],
    queryFn: async () => {
      const { data } = await axios.get("/api/sizes");
      const sortedData = sortByDate(data);
      return sortedData as Sizes[];
    },
  });

  const offset = currentPage * productsPerPage;
  const currentProducts = data?.slice(offset, offset + productsPerPage);

  const handlePageClick = (selectedPage: { selected: number }) => {
    setCurrentPage(selectedPage.selected);
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
        title="Sizes"
        count={data?.length}
        description="Manage sizes for your store"
        url="/admin/sizes/new"
      />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts?.map((size) => (
              <tr key={size.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {size.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {formatDate(size.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button className="text-red-600 hover:text-red-800 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Link 
                      href={`/admin/sizes/edit/${size.id}`}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
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

export default TableSizes;
