import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const backendApi = axios.create({
  baseURL: process.env.SPRING_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getBackendHeaders() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default backendApi;
