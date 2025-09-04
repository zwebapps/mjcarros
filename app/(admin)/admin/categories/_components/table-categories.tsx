"use client";
import { Trash2, Edit } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import TitleHeader from "@/app/(admin)/_components/title-header";
import formatDate, { sortByDate } from "@/app/utils/formateDate";
import ReactPaginate from "react-paginate";
import { useState } from "react";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  billboard: string;
  category: string;
  createdAt: string;
};

const TableCategories = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 10; // Increased from 5 to show more items
  const queryClient = useQueryClient();

  const { error, data, isLoading } = useQuery({
    queryKey: ["category"],
    queryFn: async () => {
      const { data } = await axios.get("/api/categories");
      const sortedData = sortByDate(data);
      return sortedData as Category[];
    },
  });

  const deleteTask = async (id: string) => {
    try {
      const res = await axios.delete(`/api/categories/edit/${id}`);
      queryClient.invalidateQueries({ queryKey: ["category"] });
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

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
    <div className="w-full min-w-0">
      <TitleHeader
        title="Categories"
        count={data?.length}
        description="Manage categories for your store"
        url="/admin/categories/new"
      />
      <div className="bg-white rounded-lg shadow overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full min-w-0 divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  Billboard
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts?.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.billboard}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {formatDate(category.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => deleteTask(category.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link 
                        href={`/admin/categories/edit/${category.id}`}
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
    </div>
  );
};

export default TableCategories;
