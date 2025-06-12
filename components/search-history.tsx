"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { FaMapMarkerAlt, FaLocationArrow } from "react-icons/fa"
import { format } from "date-fns"

interface SearchHistory {
  _id: string
  user: string
  pickup: string
  dropoff: string
  date: string
}

export function SearchHistoryList() {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch search history');
        }

        const data = await response.json();
        setSearchHistory(data.searchHistories || []);
      } catch (err) {
        setError('Failed to load search history');
        console.error('Error fetching search history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchHistory();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading search history...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (searchHistory.length === 0) {
    return <div className="text-center py-4">No search history found</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Search History</h2>
      <div className="grid gap-4">
        {searchHistory.map((search) => (
          <Card key={search._id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium text-sm text-gray-500">
                {search.user}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(search.date), 'MMM d, yyyy h:mm a')}
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
          </Card>
        ))}
      </div>
    </div>
  );
} 