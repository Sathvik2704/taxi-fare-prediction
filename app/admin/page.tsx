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

// Types for feedback and search history
interface FeedbackEntry {
  user: string;
  feedback: string;
  date: string;
}
interface SearchEntry {
  search: string;
  date: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [searchHistories, setSearchHistories] = useState<Record<string, SearchEntry[]>>({});
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
    fetch(`${API_URL}/admin/feedback`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setFeedbacks);
    fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUserCount(data.userCount);
        setUsers(data.users);
        setSearchHistories(data.searchHistories);
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
          <Button className="bg-green-600 hover:bg-green-700 text-white">View Prediction</Button>
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
        {/* Users and Search History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Users & Search History</h2>
          <div className="mb-2">Total Users: <span className="font-bold">{userCount}</span></div>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mr-2">Filter by user:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="">All Users</option>
              {userEmails.map(email => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">User Email</th>
                  <th className="px-2 py-1 border">Search</th>
                  <th className="px-2 py-1 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {userEmails
                  .filter(email => !selectedUser || email === selectedUser)
                  .map(email =>
                    (Array.isArray(searchHistories[email]) ? searchHistories[email] : []).map((s, idx) => (
                      <tr key={email + idx}>
                        <td className="px-2 py-1 border align-top">{email}</td>
                        <td className="px-2 py-1 border align-top">{s.search}</td>
                        <td className="px-2 py-1 border align-top">{new Date(s.date).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
            {userEmails.length === 0 && <div>No search history yet.</div>}
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