"use client";
import * as React from "react";
import { Trash2, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Spinner from "@/components/Spinner";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";
import ReactPaginate from "react-paginate";
import formatDate, { sortByDate } from "@/app/utils/formateDate";
import TitleHeader from "@/app/(admin)/_components/title-header";

type createData = {
  label: string;
  imageURL: string;
  id: string;
  createdAt: string;
};

export default function TableBillboards() {
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 5;
  // Use environment variable for S3 base URL
  const baseUrl = process.env.NEXT_PUBLIC_S3_BASE_URL || "https://your-s3-bucket.s3.region.amazonaws.com";

  const queryClient = useQueryClient();

  const { error, data, isLoading } = useQuery({
    queryKey: ["billboards"],
    queryFn: async () => {
      const { data } = await axios.get("/api/billboards");

      const sortedData = sortByDate(data);
      return sortedData as createData[];
    },
  });

  const deleteTask = async (id: string) => {
    try {
      const res = await axios.delete(`/api/billboards/edit/${id}`);
      queryClient.invalidateQueries({ queryKey: ["billboards"] });
      toast.success("Task deleted");
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
    <>
      <TitleHeader
        title="Billboards"
        count={data?.length}
        description="Manage billboards for your store"
        url="/admin/billboards/new"
      />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
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
            {currentProducts?.map((billboard) => (
              <tr key={billboard.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex-shrink-0 h-10 w-10">
                    <Image
                      className="h-10 w-10 rounded-full object-cover"
                      src={billboard.imageURL || "/placeholder-image.jpg"}
                      alt={billboard.label}
                      width={40}
                      height={40}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {billboard.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {formatDate(billboard.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => deleteTask(billboard.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Link 
                      href={`/admin/billboards/edit/${billboard.id}`}
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
}
