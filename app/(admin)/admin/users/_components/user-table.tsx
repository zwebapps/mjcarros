"use client";
import TitleHeader from "@/app/(admin)/_components/title-header";
import axios from "axios";
import { useState } from "react";
import { Trash2, Edit, User } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import formatDate from "@/app/utils/formateDate";
import Spinner from "@/components/Spinner";
import ReactPaginate from "react-paginate";
import toast from "react-hot-toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const UserTable = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 5;
  const queryClient = useQueryClient();

  const { error, data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        console.log('🔐 Frontend: Token available:', !!token);
        
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        console.log('📡 Frontend: Calling /api/clerk/users...');
        const res = await axios.get("/api/clerk/users", { headers });
        
        console.log('✅ Frontend: API response received:', res.status, res.data);
        
        if (res.data && Array.isArray(res.data)) {
          const formattedUsers = res.data.map((user: any) => ({
            id: user.id,
            name: user.firstName || user.username,
            email: user.emailAddresses[0].emailAddress,
            role: user.unsafeMetadata.isAdmin ? "ADMIN" : "USER",
            createdAt: user.createdAt
          })) as User[];
          
          console.log('✅ Frontend: Formatted users:', formattedUsers);
          return formattedUsers;
        }
        
        console.log('⚠️ Frontend: No valid data received, returning empty array');
        return [];
      } catch (error) {
        console.error('❌ Frontend: Failed to fetch users:', error);
        console.error('❌ Frontend: Error details:', error.response?.data);
        // Return empty array instead of mock data if API fails
        return [];
      }
    },
  });

  const deleteUser = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.delete(`/api/clerk/users/${id}`, { headers });
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error('Delete user error:', error);
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
        title="Manage Users"
        description="Manage admin users"
        url="/admin/users/new"
        count={data?.length}
      />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avatar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Link 
                      href={`/admin/users/edit/${user.id}`}
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

export default UserTable;
