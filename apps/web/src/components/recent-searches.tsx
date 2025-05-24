'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

type RecentSearch = {
  county: string;
  state: string;
  lastSearched: string;
  datacenters: number;
};

export function RecentSearches() {
  const { data: searches, isLoading } = useQuery<RecentSearch[]>({
    queryKey: ['recent-searches'],
    queryFn: async () => {
      const response = await fetch('/api/recent-searches');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!searches || searches.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Recent Searches</h2>
      <div className="space-y-3">
        {searches.map((search) => (
          <Link
            key={`${search.county}-${search.state}`}
            href={`/results?county=${encodeURIComponent(search.county)}&state=${encodeURIComponent(search.state)}`}
            className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-lg">
                  {search.county}, {search.state}
                </h3>
                <p className="text-sm text-gray-500">
                  Last searched {new Date(search.lastSearched).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-semibold text-blue-600">
                  {search.datacenters}
                </span>
                <p className="text-sm text-gray-500">data centers</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}