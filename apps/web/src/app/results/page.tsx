import { Suspense } from 'react';
import { ResultsContent } from './results-content';
import Link from 'next/link';

export default function ResultsPage({
  searchParams,
}: {
  searchParams: { county?: string; state?: string };
}) {
  const { county, state } = searchParams;

  if (!county || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Search</h1>
          <p className="text-gray-600 mb-6">Please provide both county and state.</p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Search
            </Link>
            <h1 className="text-xl font-semibold">
              {county}, {state}
            </h1>
          </div>
        </div>
      </div>

      <Suspense fallback={<ResultsLoading />}>
        <ResultsContent county={county} state={state} />
      </Suspense>
    </main>
  );
}

function ResultsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}