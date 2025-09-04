"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for user in localStorage on component mount
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">({user.role})</span>
              </div>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
