import { useState } from 'react';
import { ActivityForm } from './components/ActivityForm';
import { RecommendationCard } from './components/RecommendationCard';
import type { ActivityFormData, Recommendation } from './types/index.ts';
import { getRecommendations } from './services/api';

function App() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: ActivityFormData) => {
    console.log('Form submitted:', formData);
    setIsLoading(true);
    setError(null);

    try {
      const data = await getRecommendations(formData);
      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setRecommendations([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
              🎯
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Family Activity Finder</h1>
              <p className="text-sm text-gray-500">Discover perfect activities for your family</p>
            </div>
          </div>
          <button
            onClick={handleNewSearch}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            New Search
          </button>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="flex gap-6">
          {/* Left Column - Form */}
          <div className="sticky top-6 self-start" style={{ width: '418px', flexShrink: 0 }}>
            <ActivityForm onSubmit={handleFormSubmit} />
          </div>

          {/* Right Column - Results */}
          <div className="flex-1 min-h-[600px]">
            {isLoading && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Searching the web for activities...</p>
                <p className="mt-2 text-gray-500 text-sm">This may take 10-20 seconds</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border-2 border-red-200">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Recommendations</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Try Again
                </button>
              </div>
            )}

            {!isLoading && !error && recommendations.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🎪</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Discover Activities</h3>
                <p className="text-gray-500">
                  Fill out the form on the left to get personalized recommendations for your family
                </p>
              </div>
            )}

            {!isLoading && recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                {/* Results Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Top 5 Recommendations</h2>
                      <p className="text-sm text-gray-500 mt-1">Perfect matches for your family</p>
                    </div>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      Sorted by relevance
                    </span>
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="divide-y divide-gray-100">
                  {recommendations.map((rec, index) => (
                    <RecommendationCard
                      key={index}
                      recommendation={rec}
                      number={index + 1}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
