"use client";

import React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import { FaLocationArrow, FaMapMarkerAlt } from "react-icons/fa";

// Types for feedback and search history
interface FeedbackEntry {
  user: string;
  feedback: string;
  date: string;
}

interface SearchHistoryEntry {
  _id: string;
  user: string;
  pickup: string;
  dropoff: string;
  date: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [searchHistories, setSearchHistories] = useState<SearchHistoryEntry[]>([]);
  const [messageUser, setMessageUser] = useState("");
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // On mount, check for token
  useEffect(() => {
    const stored = localStorage.getItem("admin-token");
    if (stored) setToken(stored);
  }, []);

  // Helper to check if token is valid and not expired
  function isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.role !== "admin") return false;
      if (decoded.exp && Date.now() >= decoded.exp * 1000) return false;
      return true;
    } catch {
      return false;
    }
  }

  // Admin login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    // Development mode quick login
    if (process.env.NODE_ENV !== "production" && 
        email === "sathwik272004@gmail.com" && 
        password === "sathvik123") {
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdGh3aWsyNzIwMDRAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzEyNDE3NjAwLCJleHAiOjE3OTk5MDY0MDB9.ZXzXNzLyJgIrsA_7WHVi7mYiKwgUIFtj9V1Gw73KSSM";
      localStorage.setItem("admin-token", mockToken);
      setToken(mockToken);
      setIsAdmin(true);
      toast({ title: "Admin login successful (dev mode)" });
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("admin-token", data.token);
        setToken(data.token);
        setIsAdmin(true);
        toast({ title: "Admin login successful" });
      } else {
        setLoginError("Invalid credentials");
      }
    } catch (e) {
      setLoginError("Could not connect to server");
    }
  };

  // Fetch feedbacks and users if admin
  useEffect(() => {
    if (!isTokenValid(token)) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(true);
    
    // Fetch feedbacks
    fetch(`${API_URL}/admin/feedback`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeedbacks(data);
        }
      })
      .catch(err => {
        console.error("Error fetching feedback:", err);
      });
    
    // Fetch users and search history
    fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setUserCount(data.userCount || 0);
          setUsers(data.users || []);
          setSearchHistories(data.searchHistories || []);
        }
      })
      .catch(err => {
        console.error("Error fetching users:", err);
      });
  }, [token]);

  // Get all user emails for dropdown
  const userEmails = useMemo(() => Object.keys(searchHistories), [searchHistories]);

  // Send message to user
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageStatus("");
    try {
      const token = localStorage.getItem("admin-token");
      
      // Development mode handling
      if (process.env.NODE_ENV !== "production" && 
          token === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdGh3aWsyNzIwMDRAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzEyNDE3NjAwLCJleHAiOjE3OTk5MDY0MDB9.ZXzXNzLyJgIrsA_7WHVi7mYiKwgUIFtj9V1Gw73KSSM") {
        console.log("Development mode - message would be sent to:", messageUser);
        console.log("Message content:", message);
        setMessageStatus("Message sent! (Development mode)");
        setMessage("");
        setMessageUser("");
        return;
      }
      
      const res = await fetch(`${API_URL}/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user: messageUser, message })
      });
      if (res.ok) {
        setMessageStatus("Message sent!");
        setMessage("");
        setMessageUser("");
      } else {
        setMessageStatus("Failed to send message");
      }
    } catch (e) {
      setMessageStatus("Could not connect to server");
    }
  };

  if (!isTokenValid(token)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-yellow-500 text-xl">Loading or Unauthorized...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-yellow-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="mb-6 flex justify-end">
        <Link href="/">
          <Button className="bg-green-600 hover:bg-green-700 text-white">Home</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Feedbacks */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Feedbacks</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {feedbacks.length === 0 && <div>No feedbacks yet.</div>}
            {feedbacks.map((fb, i) => (
              <div key={i} className="border-b pb-2 mb-2">
                <div className="font-medium">{fb.user}</div>
                <div className="text-gray-700">{fb.feedback}</div>
                <div className="text-xs text-gray-400">{new Date(fb.date).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Search History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Search History</h2>
          <div className="mb-2">Total Users: <span className="font-bold">{userCount}</span></div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mr-2">Filter by user:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.email} value={user.email}>{user.email}</option>
              ))}
            </select>
          </div>
          <div className="overflow-y-auto max-h-96">
            {searchHistories.length === 0 ? (
              <div>No search history yet.</div>
            ) : (
              <div className="space-y-4">
                {searchHistories
                  .filter(search => !selectedUser || search.user === selectedUser)
                  .map((search) => (
                    <div key={search._id} className="border rounded p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-500">
                          {search.user}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(search.date).toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <FaLocationArrow className="mt-1 text-green-600 min-w-[16px]" />
                          <div>
                            <div className="text-sm text-gray-500">Pickup</div>
                            <div>{search.pickup}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FaMapMarkerAlt className="mt-1 text-red-600 min-w-[16px]" />
                          <div>
                            <div className="text-sm text-gray-500">Dropoff</div>
                            <div>{search.dropoff}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Send Message to User */}
      <Card className="p-6 mt-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Send Message to User</h2>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <Input
            type="email"
            placeholder="User Email"
            value={messageUser}
            onChange={e => setMessageUser(e.target.value)}
            required
          />
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            required
          />
          <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600">Send Message</Button>
          {messageStatus && <div className="text-green-600 text-sm">{messageStatus}</div>}
        </form>
      </Card>
    </main>
  );
} 