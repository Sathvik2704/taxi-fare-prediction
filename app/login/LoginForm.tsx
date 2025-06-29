"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter} from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaxiAnimation } from "@/components/taxi-animation";
import { TaxiNav } from "@/components/taxi-nav";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import dynamic from 'next/dynamic';
import { SocialLoginHandler } from "@/components/SocialLoginHandler";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleAdminLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("admin-token", data.token);
          toast({
            title: "Admin Login Successful!",
            description: "Welcome, Admin!",
            variant: "default",
          });
          router.push("/admin");
          return true;
        }
      }
    } catch (err) {
      console.error("Admin login error:", err);
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (email === "sathwik272004@gmail.com") {
      const adminSuccess = await handleAdminLogin();
      if (adminSuccess) {
        setLoading(false);
        return;
      }
    }

    const success = await login(email, password);
    if (success) {
      router.push("/");
    } else {
      setError("Invalid email or password. Please check your credentials or register for a new account.");
    }
    
    setLoading(false);
  };

  const handleSocialLogin = (provider: string) => {
    setSocialLoading(provider);
    window.location.href = `${API_URL}/auth/${provider.toLowerCase()}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 py-12 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-20 bg-yellow-400 skew-y-3 transform -translate-y-10 z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-20 bg-yellow-400 skew-y-3 transform translate-y-10 z-0"></div>

      {/* Nav links */}
      <TaxiNav />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-8 text-center">
          <TaxiAnimation />
          <div className="space-y-2 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
              <span className="text-yellow-500">Taxi</span> Login
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
              Sign in to access your account and manage your taxi rides.
            </p>
          </div>

          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl animate-slide-up">
            <Suspense fallback={null}>
              <SocialLoginHandler setError={setError} />
            </Suspense>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="my-4 flex items-center">
              <div className="flex-grow border-t border-gray-300" />
              <span className="mx-4 text-sm text-gray-500">
                Or continue with
              </span>
              <div className="flex-grow border-t border-gray-300" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin("Google")}
                disabled={!!socialLoading}
              >
                {socialLoading === "Google" ? (
                  "Redirecting..."
                ) : (
                  <>
                    <FaGoogle /> Google
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin("Facebook")}
                disabled={!!socialLoading}
              >
                {socialLoading === "Facebook" ? (
                  "Redirecting..."
                ) : (
                  <>
                    <FaFacebook /> Facebook
                  </>
                )}
              </Button>
            </div>

            <p className="mt-4 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-yellow-600 hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 