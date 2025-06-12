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
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function SocialLoginHandler({ setError }: { setError: (msg: string) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socialLogin } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    const userParam = searchParams.get("user");
    // Only process once and if user param exists
    if (userParam && !processedRef.current) {
      processedRef.current = true;
      
      try {
        const userObj = JSON.parse(decodeURIComponent(userParam));
        console.log("Received OAuth user data:", userObj);
        
        // Extract user data from Google profile format
        const userData = {
          name: userObj.displayName || userObj.name || "User",
          email: userObj.emails?.[0]?.value || userObj.email || `user-${Date.now()}@example.com`,
        };
        
        console.log("Processed user data for login:", userData);
        
        // Remove the user param from URL to prevent infinite loops
        const url = new URL(window.location.href);
        url.searchParams.delete("user");
        window.history.replaceState({}, document.title, url.toString());
        
        // Login the user
        socialLogin(userObj.provider || "Google", userData)
          .then(success => {
            if (success) {
              console.log("Social login successful, redirecting to home");
              setTimeout(() => {
                router.push("/");
              }, 100);
            } else {
              setError("Failed to process social login");
            }
          })
          .catch(err => {
            console.error("Error during social login:", err);
            setError("Social login processing error");
          });
      } catch (e) {
        console.error("OAuth data parsing error:", e);
        setError("Could not process login data");
      }
    }
  }, [searchParams]);

  return null;
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();
  const { login, socialLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Check for admin credentials
      if (email === "sathwik272004@gmail.com" && password === "sathvik123") {
        // Try admin login via backend
        try {
          // First try to connect to the backend
          const res = await fetch(`${API_URL}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          }).catch(err => {
            console.log("Backend connection failed:", err);
            // Development fallback - create a mock token
            if (process.env.NODE_ENV !== "production") {
              const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdGh3aWsyNzIwMDRAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzEyNDE3NjAwLCJleHAiOjE3OTk5MDY0MDB9.ZXzXNzLyJgIrsA_7WHVi7mYiKwgUIFtj9V1Gw73KSSM";
              localStorage.setItem("admin-token", mockToken);
              router.push("/admin");
              return null;
            }
            throw err;
          });
          
          // If fetch failed but we did fallback
          if (!res) {
            setLoading(false);
            return;
          }

          if (!res.ok) {
            // Development fallback - create a mock token
            if (process.env.NODE_ENV !== "production") {
              const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdGh3aWsyNzIwMDRAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzEyNDE3NjAwLCJleHAiOjE3OTk5MDY0MDB9.ZXzXNzLyJgIrsA_7WHVi7mYiKwgUIFtj9V1Gw73KSSM";
              localStorage.setItem("admin-token", mockToken);
              router.push("/admin");
              return;
            }
            
            setError("Admin login failed. Check server connection.");
            setLoading(false);
            return;
          }
          
          const data = await res.json();
          if (data.token) {
            localStorage.setItem("admin-token", data.token);
            // Optionally validate token
            try { jwtDecode(data.token); } catch {}
            router.push("/admin");
            return;
          } else {
            setError("Invalid admin credentials");
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Admin login error:", err);
          
          // Development fallback - create a mock token
          if (process.env.NODE_ENV !== "production") {
            const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdGh3aWsyNzIwMDRAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzEyNDE3NjAwLCJleHAiOjE3OTk5MDY0MDB9.ZXzXNzLyJgIrsA_7WHVi7mYiKwgUIFtj9V1Gw73KSSM";
            localStorage.setItem("admin-token", mockToken);
            router.push("/admin");
            return;
          }
          
          setError(`Failed to connect to admin server. Please ensure the backend is running.`);
          setLoading(false);
          return;
        }
      }
      // Regular user login
      const success = await login(email, password);
      if (success) {
        router.push("/");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
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
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
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
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  disabled={socialLoading !== null}
                  className="flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
                >
                  <FaGoogle className="text-red-500" />
                  <span>{socialLoading === "Google" ? "Loading..." : "Google"}</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("Facebook")}
                  disabled={socialLoading !== null}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <FaFacebook />
                  <span>{socialLoading === "Facebook" ? "Loading..." : "Facebook"}</span>
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <Link href="/forgot-password" className="text-yellow-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/register" className="text-yellow-600 hover:underline font-medium">
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <SocialLoginHandler setError={setError} />
      </Suspense>
    </main>
  );
} 