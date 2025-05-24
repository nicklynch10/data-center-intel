import { SearchForm } from '@/components/search-form';
import { RecentSearches } from '@/components/recent-searches';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Data Center Intel
          </h1>
          <p className="text-xl text-center text-gray-600 mb-12">
            Track data center developments across U.S. counties
          </p>

          <SearchForm />

          <div className="mt-16">
            <RecentSearches />
          </div>
        </div>
      </div>
    </main>
  );
}