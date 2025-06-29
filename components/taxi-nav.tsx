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
import { FaUser, FaPhoneAlt, FaInfoCircle, FaMapMarkerAlt, FaLocationArrow } from "react-icons/fa"
import { HelpCircle, MapPin, MessageCircle, Search } from "lucide-react"
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import dynamic from 'next/dynamic'
import { format } from "date-fns"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Dynamically import the search modal with no SSR
const GoogleMapsSearchModal = dynamic(() => Promise.resolve(({ open, onClose }: { open: boolean, onClose: () => void }) => {
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
}), { ssr: false });

export function TaxiNav() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const { toast } = useToast()
  const { authenticatedFetch } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [savedAddressesLoading, setSavedAddressesLoading] = useState(false);
  const [savedAddressesError, setSavedAddressesError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'addresses' | 'history'>('addresses');
  const userEmailRef = useRef<string | null>(null);

  // Only show interactive elements after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Poll for admin messages
  useEffect(() => {
    if (!user?.email) return;
    
    let polling = true;
    async function pollMessages() {
      while (polling) {
        try {
          const currentEmail = userEmailRef.current;
          if (!currentEmail) break; // Exit if user becomes null
          const res = await authenticatedFetch(`${API_URL}/user/admin-responses?user=${encodeURIComponent(currentEmail)}`);
          if (res.ok) {
            const messages = await res.json();
            if (messages.length > 0) {
              toast({
                title: "New Message",
                description: `You have ${messages.length} new message(s) from admin.`,
                variant: "default",
              });
            }
          }
        } catch {}
        await new Promise(r => setTimeout(r, 30000)); // 30 seconds
      }
    }
    pollMessages();
    return () => { polling = false; };
  }, [authenticatedFetch, toast]);

  // Update user email ref when user changes
  useEffect(() => {
    userEmailRef.current = user?.email || null;
  }, [user?.email]);

  const fetchUserData = async () => {
    if (!user?.email) return;
    setHistoryLoading(true);
    setSavedAddressesLoading(true);
    setHistoryError(null);
    setSavedAddressesError(null);
    
    try {
      // Fetch search history
      const historyRes = await authenticatedFetch(`${API_URL}/user/search-history`);
      if (!historyRes.ok) throw new Error('Failed to fetch search history');
      const historyData = await historyRes.json();
      setSearchHistory(historyData.searchHistory || []);
      
      // Fetch saved addresses
      const addressesRes = await authenticatedFetch(`${API_URL}/user/saved-addresses`);
      if (!addressesRes.ok) throw new Error('Failed to fetch saved addresses');
      const addressesData = await addressesRes.json();
      setSavedAddresses(addressesData.savedAddresses || []);
    } catch (err) {
      setHistoryError('Failed to load user data');
      setSavedAddressesError('Failed to load user data');
    } finally {
      setHistoryLoading(false);
      setSavedAddressesLoading(false);
    }
  };

  // Only show navigation items on pages other than register and about
  const showNavItems = mounted && pathname !== "/register" && pathname !== "/about";
  // Only show feedback button on pages other than register and about
  const showFeedbackButton = mounted && pathname !== "/register" && pathname !== "/about";
  // Only show home button on register page
  const showHomeButton = mounted && pathname === "/register";
  // Show login/register buttons on about page
  const showAuthButtons = mounted && pathname === "/about";

  // Function to delete saved address
  const deleteSavedAddress = async (addressId: string) => {
    if (!user?.email) return;
    
    try {
      const response = await authenticatedFetch(`${API_URL}/saved-address/${addressId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state
        setSavedAddresses(prev => prev.filter(addr => addr._id !== addressId));
        toast({ title: "Success", description: "Address deleted successfully." });
      } else {
        throw new Error('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting saved address:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete address. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="container relative z-20 pt-4 md:pt-6">
      <div className="flex justify-between items-center mb-8">
        <Link 
          href="/" 
          className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-1"
        >
          <div className="flex items-center">
            <span className="text-orange-600">India</span>
            <span className="text-yellow-500">Taxi</span>
            <span className="text-green-600 ml-1">Fare</span>
          </div>
        </Link>
        
        {showNavItems && (
          <div className="hidden md:flex gap-6 text-sm items-center">
            {showHomeButton && (
              <Link href="/" className="text-base font-medium text-gray-700 hover:text-orange-600 transition-colors">
                Home
              </Link>
            )}
            <button
              className={`flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-yellow-50 text-base font-medium text-gray-700 hover:text-orange-600 transition-colors shadow-sm ${pathname === "/login" ? "w-64" : ""}`}
              onClick={() => setSearchOpen(true)}
              aria-label="Open place search"
            >
              <svg xmlns="http://localhost:4000/admin/login" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
              <span>Search</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              asChild
            >
              <Link href="/about">About</Link>
            </Button>
          </div>
        )}
        
        <div className="flex gap-4 items-center">
          {showFeedbackButton && (
            <>
              <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center justify-center p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition-colors"
                    aria-label="Give Feedback"
                    onClick={() => setFeedbackOpen(true)}
                  >
                    <MessageCircle className="h-5 w-5 text-yellow-600" />
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
                            const res = await authenticatedFetch(`${apiUrl}/feedback`, {
                              method: "POST",
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
              {pathname === "/login" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium"
                  asChild
                >
                  <Link href="/register">Register</Link>
                </Button>
              )}
            </>
          )}
          {!loading && mounted && (
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
                      <button onClick={() => { setHistoryOpen(true); fetchUserData(); }} className="w-full text-left">
                        Saved Addresses
                        {savedAddresses.length > 0 && (
                          <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                            {savedAddresses.length}
                          </span>
                        )}
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {showAuthButtons && (
                    <>
                      <Link 
                        href="/login" 
                        className="text-gray-800 hover:text-orange-600 font-medium text-base"
                      >
                        Login
                      </Link>
                      <Link 
                        href="/register" 
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-4 py-2 rounded-md font-medium text-base transition-colors"
                      >
                        Register
                      </Link>
                    </>
                  )}
                  {!showNavItems && pathname !== "/about" && (
                    <Link 
                      href="/login" 
                      className="text-gray-800 hover:text-orange-600 font-medium"
                    >
                      Login
                    </Link>
                  )}
                  {!showNavItems && pathname !== "/about" && (
                    <Link 
                      href="/register" 
                      className={`${pathname === "/login" ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-4 py-2 rounded-md" : "text-gray-800 hover:text-orange-600"} font-medium transition-colors`}
                    >
                      Register
                    </Link>
                  )}
                  {showHomeButton && (
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
      {mounted && <GoogleMapsSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
      {/* Saved Addresses and Search History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>My Locations & Search History</DialogTitle>
          </DialogHeader>
          
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('addresses')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'addresses'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved Addresses
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Search History
            </button>
          </div>

          {/* Saved Addresses Tab */}
          {activeTab === 'addresses' && (
            <>
              {savedAddressesLoading ? (
                <div className="text-center py-4">Loading saved addresses...</div>
              ) : savedAddressesError ? (
                <div className="text-center py-4 text-red-500">{savedAddressesError}</div>
              ) : savedAddresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">No saved addresses yet</p>
                  <p className="text-xs text-gray-400">
                    Use the "Save" buttons next to pickup and dropoff fields to save your favorite locations
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {savedAddresses.map((address) => (
                    <div key={address._id} className="border rounded p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-500 capitalize">{address.type}</div>
                        <div className="text-sm text-gray-500">{format(new Date(address.date), 'MMM d, yyyy')}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          {address.type === 'pickup' ? (
                            <FaLocationArrow className="mt-1 text-green-600 min-w-[16px]" />
                          ) : (
                            <FaMapMarkerAlt className="mt-1 text-red-600 min-w-[16px]" />
                          )}
                          <div>
                            <div className="text-sm text-gray-500">{address.type === 'pickup' ? 'Pickup' : 'Dropoff'}</div>
                            <div>{address.name}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-red-500 text-white hover:bg-red-600"
                          onClick={() => deleteSavedAddress(address._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Search History Tab */}
          {activeTab === 'history' && (
            <>
              {historyLoading ? (
                <div className="text-center py-4">Loading search history...</div>
              ) : historyError ? (
                <div className="text-center py-4 text-red-500">{historyError}</div>
              ) : searchHistory.length === 0 ? (
                <div className="text-center py-4">No search history found</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {searchHistory.map((search) => (
                    <div key={search._id} className="border rounded p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm text-gray-500">{search.pickup} → {search.dropoff}</div>
                        <div className="text-sm text-gray-500">{format(new Date(search.date), 'MMM d, yyyy h:mm a')}</div>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 