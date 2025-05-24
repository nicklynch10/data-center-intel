'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { DataCenterCard } from '@/components/data-center-card';
import { StatusBanner } from '@/components/status-banner';

type LookupResponse = {
  status: 'found' | 'queued';
  location: {
    id: string;
    county: string;
    state: string;
  };
  dataCenters?: any[];
  lastUpdated?: string;
  refreshing?: boolean;
  taskId?: string;
  message?: string;
};

export function ResultsContent({ county, state }: { county: string; state: string }) {
  const [pollingEnabled, setPollingEnabled] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<LookupResponse>({
    queryKey: ['lookup', county, state],
    queryFn: async () => {
      const response = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ county, state }),
      });

      if (!response.ok) {
        throw new Error('Lookup failed');
      }

      return response.json();
    },
    refetchInterval: pollingEnabled ? 5000 : false,
  });

  useEffect(() => {
    // Enable polling if data is being gathered
    if (data?.status === 'queued' || data?.refreshing) {
      setPollingEnabled(true);
    } else {
      setPollingEnabled(false);
    }
  }, [data]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">Failed to load results. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Status Banner */}
      {(data.status === 'queued' || data.refreshing) && (
        <StatusBanner
          message={data.message || 'Updating data center information...'}
          type="info"
        />
      )}

      {/* Results Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Data Centers in {county}, {state}
        </h2>
        {data.lastUpdated && (
          <p className="text-gray-600">
            Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Data Centers */}
      {data.dataCenters && data.dataCenters.length > 0 ? (
        <div className="grid gap-6">
          {data.dataCenters.map((dc) => (
            <DataCenterCard key={dc.id} dataCenter={dc} />
          ))}
        </div>
      ) : data.status === 'found' ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 text-lg">
            No data centers found in this county.
          </p>
          <p className="text-gray-500 mt-2">
            Check back later as new developments are tracked.
          </p>
        </div>
      ) : null}

      {/* Loading State */}
      {data.status === 'queued' && (
        <div className="mt-8">
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800 font-medium">Gathering data center information...</p>
            <p className="text-blue-600 mt-2">This typically takes 2-5 minutes.</p>
          </div>
        </div>
      )}
    </div>
  );
}