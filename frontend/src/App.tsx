import { useState, useRef } from 'react';
import { ActivityForm } from './components/ActivityForm';
import { RecommendationCard } from './components/RecommendationCard';
import { MultiProviderResults } from './components/MultiProviderResults';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorPanel } from './components/ErrorPanel';
import { EmptyState } from './components/EmptyState';
import type { ActivityFormData, Recommendation, MultiProviderResponse } from './types/index.ts';
import { getRecommendations, getAllProviderRecommendations } from './services/api';

function App() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [multiProviderResults, setMultiProviderResults] = useState<MultiProviderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isMultiProvider, setIsMultiProvider] = useState(false);

  // Cancels any in-flight request when a new submission arrives
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFormSubmit = async (formData: ActivityFormData) => {
    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (formData.provider === 'all') {
      setIsMultiProvider(true);
      setError(null);
      setMultiProviderResults([]);
      setIsLoading(true);
      setLoadingStates({});

      try {
        const { provider: _provider, ...formDataWithoutProvider } = formData;
        const results = await getAllProviderRecommendations(formDataWithoutProvider, controller.signal);

        const completedLoadingStates: Record<string, boolean> = {};
        results.forEach((result) => {
          completedLoadingStates[result.provider] = false;
        });
        setLoadingStates(completedLoadingStates);
        setMultiProviderResults(results);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (import.meta.env.DEV) {
          console.error('Error fetching multi-provider recommendations:', err);
        }
        setError(err instanceof Error ? err.message : 'Failed to load recommendations. Please try again.');
        setLoadingStates({});
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsMultiProvider(false);
      setIsLoading(true);
      setError(null);
      setRecommendations([]);

      try {
        const data = await getRecommendations(formData, controller.signal);
        setRecommendations(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (import.meta.env.DEV) {
          console.error('Error fetching recommendations:', err);
        }
        setError(err instanceof Error ? err.message : 'Failed to load recommendations. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNewSearch = () => {
    setRecommendations([]);
    setMultiProviderResults([]);
    setError(null);
    setIsMultiProvider(false);
    setLoadingStates({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1574px] mx-auto flex items-center justify-between">
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
      <div className="max-w-[1574px] mx-auto p-6">
        <div className="flex gap-6">
          {/* Left Column - Form */}
          <div className="sticky top-6 self-start w-full lg:w-[418px] flex-shrink-0">
            <ActivityForm onSubmit={handleFormSubmit} />
          </div>

          {/* Right Column - Results */}
          <div className="flex-1 min-h-[600px]">
            {/* Multi-Provider Results */}
            {isMultiProvider && (
              <>
                {isLoading && multiProviderResults.length === 0 && (
                  <LoadingSpinner message="Searching with all AI providers..." />
                )}
                {error && (
                  <ErrorPanel error={error} onDismiss={() => setError(null)} />
                )}
                {!isLoading && multiProviderResults.length > 0 && (
                  <MultiProviderResults results={multiProviderResults} loadingStates={loadingStates} />
                )}
                {!isLoading && multiProviderResults.length === 0 && !error && (
                  <EmptyState />
                )}
              </>
            )}

            {/* Single Provider Results */}
            {!isMultiProvider && (
              <>
                {isLoading && (
                  <LoadingSpinner message="Searching the web for activities..." />
                )}

                {!isLoading && error && (
                  <ErrorPanel error={error} onDismiss={() => setError(null)} dismissLabel="Try Again" />
                )}

                {!isLoading && !error && recommendations.length === 0 && (
                  <EmptyState />
                )}

                {!isLoading && recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm">
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

                    <div className="divide-y divide-gray-100">
                      {recommendations.map((rec, index) => (
                        <RecommendationCard
                          key={`${rec.title}-${rec.location}`}
                          recommendation={rec}
                          number={index + 1}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
