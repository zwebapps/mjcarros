"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../_components/Navbar";
import Sidebar from "../_components/Sidebar";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for user in localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    if (!userData || !token) {
      router.push('/sign-in');
      return;
    }

    try {
      const userObj = JSON.parse(userData);
      if (userObj.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      setUser(userObj);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      router.push('/sign-in');
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="flex h-full">
          <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
            <div className="animate-pulse bg-gray-800 h-full w-full"></div>
          </div>
          <div className="md:pl-72">
            <div className="animate-pulse bg-gray-200 h-16 w-full"></div>
            <div className="animate-pulse bg-gray-100 h-full w-full p-8">
              <div className="animate-pulse bg-gray-200 h-8 w-32 rounded mb-4"></div>
              <div className="animate-pulse bg-gray-200 h-4 w-64 rounded mb-2"></div>
              <div className="animate-pulse bg-gray-200 h-4 w-48 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="h-full">
      <div className="flex h-full">
        <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
          <Sidebar />
        </div>
        <div className="md:pl-72 flex-1 w-full min-w-0">
          <Navbar />
          <main className="p-8 w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
