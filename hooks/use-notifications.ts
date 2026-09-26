"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getAuthHeaders } from "@/hooks/use-auth-headers";

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await axios.get("/api/notifications", {
        headers: getAuthHeaders(),
      });
      return data as Array<{ id: string; message: string; type: string; read: boolean; createdAt: string }>;
    },
    enabled,
    refetchInterval: 15000,
  });
}
