import { useState } from 'react';
import type { MultiProviderResponse, Recommendation, LLMProvider } from '../types/index.ts';
import { RecommendationCard } from './RecommendationCard';
import { getProviderIcon } from '../utils/providerIcons';

/**
 * Props for MultiProviderResults component
 */
interface MultiProviderResultsProps {
  /** Array of results from multiple AI providers */
  results: MultiProviderResponse[];
  /** Loading states for each provider (key: provider ID, value: loading status) */
  loadingStates: Record<string, boolean>;
}

/**
 * MultiProviderResults component - Displays results from multiple AI providers in a tabbed interface
 * Shows loading states, success results, and error messages with expandable error details
 */
export function MultiProviderResults({ results, loadingStates }: MultiProviderResultsProps) {
  const [activeTab, setActiveTab] = useState<string>(results[0]?.provider || '');
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({});

  const toggleErrorExpansion = (provider: string) => {
    setExpandedErrors((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Providers Available</h3>
        <p className="text-gray-500">Please ensure at least one AI provider is configured.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Horizontal Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {results.map((result) => {
            const isLoading = loadingStates[result.provider] || false;
            const hasError = !!result.error;
            const hasSuccess = !!result.recommendations && result.recommendations.length > 0;

            return (
              <button
                key={result.provider}
                onClick={() => setActiveTab(result.provider)}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === result.provider
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : hasError ? (
                    <span className="text-red-500 text-lg">⚠️</span>
                  ) : hasSuccess ? (
                    <span className="text-green-500 text-lg">✓</span>
                  ) : (
                    <span className="text-lg">{getProviderIcon(result.provider as LLMProvider)}</span>
                  )}
                  <div className="text-left">
                    <div className="font-semibold capitalize flex items-center gap-1">
                      <span className="text-base">{getProviderIcon(result.provider as LLMProvider)}</span>
                      <span>{result.provider}</span>
                      <span className="text-xs text-gray-500 font-normal ml-1">- {result.modelName}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {results.map((result) => {
          if (result.provider !== activeTab) return null;

          const isLoading = loadingStates[result.provider] || false;

          // Loading State
          if (isLoading) {
            return (
              <div key={result.provider} className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-medium">
                  Searching with {result.modelName}...
                </p>
                <p className="mt-2 text-gray-500 text-sm">This may take 10-20 seconds</p>
              </div>
            );
          }

          // Error State
          if (result.error) {
            const isExpanded = expandedErrors[result.provider] || false;

            return (
              <div key={result.provider} className="space-y-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">⚠️</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        Error Loading Recommendations
                      </h3>
                      <p className="text-red-700 mb-4">{result.error}</p>
                      <button
                        onClick={() => toggleErrorExpansion(result.provider)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                      >
                        {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'Show'} Full Error Response
                      </button>
                      {isExpanded && (
                        <div className="mt-4 bg-white border border-red-200 rounded p-4">
                          <pre className="text-xs overflow-x-auto text-gray-800">
                            {JSON.stringify(result.fullErrorResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Success State
          if (result.recommendations && result.recommendations.length > 0) {
            return (
              <div key={result.provider}>
                {/* Results Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Top {result.recommendations.length} Recommendations
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    From {result.modelName}
                  </p>
                </div>

                {/* Recommendations List */}
                <div className="divide-y divide-gray-100">
                  {result.recommendations.map((rec: Recommendation, index: number) => (
                    <RecommendationCard
                      key={index}
                      recommendation={rec}
                      number={index + 1}
                    />
                  ))}
                </div>
              </div>
            );
          }

          // Empty State (shouldn't happen, but handle it)
          return (
            <div key={result.provider} className="text-center py-12">
              <div className="text-6xl mb-4">🤔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results</h3>
              <p className="text-gray-500">No recommendations were returned from {result.modelName}.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

