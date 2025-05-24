'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';

export function SearchForm() {
  const router = useRouter();
  const [county, setCounty] = useState('');
  const [state, setState] = useState('');

  const searchMutation = useMutation({
    mutationFn: async (data: { county: string; state: string }) => {
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      router.push(`/results?county=${encodeURIComponent(county)}&state=${encodeURIComponent(state)}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (county && state) {
      searchMutation.mutate({ county, state });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
            County
          </label>
          <input
            type="text"
            id="county"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="e.g., Loudoun"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <input
            type="text"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g., VA"
            maxLength={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={searchMutation.isPending}
        className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {searchMutation.isPending ? 'Searching...' : 'Search County'}
      </button>

      {searchMutation.isError && (
        <p className="mt-4 text-red-600 text-sm text-center">
          Search failed. Please try again.
        </p>
      )}
    </form>
  );
}