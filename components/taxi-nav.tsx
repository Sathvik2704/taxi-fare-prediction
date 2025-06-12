"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FaUser, FaPhoneAlt, FaInfoCircle } from "react-icons/fa"
import { HelpCircle, MapPin, MessageCircle } from "lucide-react"
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function GoogleMapsSearchModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&libraries=places`;
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, [open]);

  useEffect(() => {
    if (open && scriptLoaded && inputRef.current) {
      // @ts-ignore
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'name'],
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          alert(`Selected: ${place.formatted_address}`);
          onClose();
        }
      });
    }
  }, [open, scriptLoaded, onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" role="dialog" aria-modal="true" ref={modalRef}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
          onClick={onClose}
          aria-label="Close search modal"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">Search a Place in India</h2>
        <input
          ref={inputRef}
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Type a place (e.g. Mumbai, Taj Mahal)"
          aria-label="Search for a place in India"
          autoFocus
        />
        <p className="text-xs text-gray-400 mt-2">Powered by Google Maps</p>
      </div>
    </div>
  );
}

export function TaxiNav() {
  const pathname = usePathname()
  const { user, logout, loading } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    function openModal() {
      setSearchOpen(true);
    }
    window.addEventListener('open-google-maps-search', openModal);
    return () => window.removeEventListener('open-google-maps-search', openModal);
  }, []);
  
  useEffect(() => {
    if (!user || !user.email) return;
    let polling = true;
    let lastShownIds = new Set<string>(JSON.parse(localStorage.getItem("shown-admin-messages") || "[]"));

    async function pollMessages() {
      while (polling) {
        try {
          const userEmail = user?.email; // Safely access email
          if (!userEmail) break; // Exit if email is not available
          
          const res = await fetch(`${API_URL}/user/messages?user=${encodeURIComponent(userEmail)}`);
          if (res.ok) {
            const messages = await res.json();
            for (const msg of messages) {
              const id = `${msg.user}-${msg.date}`;
              if (!lastShownIds.has(id)) {
                toast({
                  title: "Message from Admin",
                  description: msg.message,
                });
                lastShownIds.add(id);
              }
            }
            localStorage.setItem("shown-admin-messages", JSON.stringify(Array.from(lastShownIds)));
          }
        } catch {}
        await new Promise(r => setTimeout(r, 30000)); // 30 seconds
      }
    }
    pollMessages();
    return () => { polling = false; };
  }, [user]);

  return (
    <div className="container relative z-20">
      <div className="flex justify-between items-center mb-8">
        <Link 
          href="/" 
          className="text-xl font-bold text-gray-900 flex items-center gap-1"
        >
          <div className="flex items-center">
            <span className="text-orange-600">India</span>
            <span className="text-yellow-500">Taxi</span>
            <span className="text-green-600 ml-1">Fare</span>
          </div>
        </Link>
        
        <div className="hidden md:flex gap-6 text-sm items-center">
          <Link href={pathname === "/" ? "/login" : "/"} className="text-base font-medium text-gray-700 hover:text-orange-600 transition-colors">
            Home
          </Link>
          <button
            className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-yellow-50 text-base font-medium text-gray-700 hover:text-orange-600 transition-colors shadow-sm"
            onClick={() => setSearchOpen(true)}
            aria-label="Open place search"
          >
            <svg xmlns="http://localhost:4000/admin/login" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
            <span>Search</span>
          </button>
        </div>
        
        <div className="flex gap-4 items-center">
          {/* Feedback Icon */}
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center justify-center p-2 rounded-full hover:bg-yellow-100 transition-colors"
                aria-label="Give Feedback"
                onClick={() => setFeedbackOpen(true)}
              >
                <MessageCircle className="h-5 w-5 text-yellow-500" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send us your Feedback</DialogTitle>
              </DialogHeader>
              <Textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Type your feedback here..."
                rows={4}
                className="mb-4"
                disabled={submitting}
              />
              <Button
                onClick={async () => {
                  if (!feedback.trim()) {
                    toast({ title: "Feedback required", description: "Please enter your feedback before submitting.", variant: "destructive" });
                    return;
                  }
                  setSubmitting(true);
                  
                  // Get the API URL with fallback
                  const apiUrl = API_URL || 'http://localhost:4000';
                  console.log("Submitting feedback to:", apiUrl);
                  
                  const feedbackData = {
                    user: user?.email || "anonymous",
                    feedback: feedback
                  };
                  console.log("Feedback data:", feedbackData);
                  
                  try {
                    // Try up to 3 times with a small delay between attempts
                    for (let attempt = 1; attempt <= 3; attempt++) {
                      try {
                        const res = await fetch(`${apiUrl}/feedback`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(feedbackData)
                        });
                        
                        if (res.ok) {
                          console.log("Feedback submitted successfully");
                          toast({ title: "Thank you!", description: "Your feedback has been submitted." });
                          setFeedback("");
                          setFeedbackOpen(false);
                          return;
                        } else {
                          console.error("Feedback submission error:", res.status, await res.text());
                          if (attempt < 3) {
                            console.log(`Retrying feedback submission (attempt ${attempt + 1})`);
                            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
                          }
                        }
                      } catch (e) {
                        console.error(`Feedback submission attempt ${attempt} failed:`, e);
                        if (attempt < 3) {
                          await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
                        }
                      }
                    }
                    
                    // All attempts failed
                    toast({
                      title: "Error",
                      description: "Failed to submit feedback after multiple attempts. Please try again later.",
                      variant: "destructive"
                    });
                  } catch (e) {
                    console.error("Feedback submission error:", e);
                    toast({
                      title: "Error",
                      description: "Could not connect to server. Please check your connection and try again.",
                      variant: "destructive"
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogContent>
          </Dialog>
          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 border-orange-200 text-orange-800">
                      <FaUser className="h-4 w-4" />
                      <span>{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">My Bookings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="#">Saved Addresses</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {pathname !== "/login" && (
                    <Link 
                      href="/login" 
                      className="text-gray-800 hover:text-orange-600 font-medium"
                    >
                      Login
                    </Link>
                  )}
                  {pathname !== "/register" && (
                    <Link 
                      href="/register" 
                      className={`${pathname === "/login" ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-4 py-2 rounded-md" : "text-gray-800 hover:text-orange-600"} font-medium transition-colors`}
                    >
                      Register
                    </Link>
                  )}
                  {(pathname === "/login" || pathname === "/register") && (
                    <Link 
                      href="/" 
                      className="text-gray-800 hover:text-orange-600 font-medium"
                    >
                      Home
                    </Link>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Indian tricolor accent bar */}
      {pathname === "/" && (
        <div className="h-1 w-full flex mb-6">
          <div className="flex-1 bg-orange-500"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-green-500"></div>
        </div>
      )}
      <GoogleMapsSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
} 