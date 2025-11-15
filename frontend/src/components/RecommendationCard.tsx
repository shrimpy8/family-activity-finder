import type { Recommendation } from '../types/index.ts';

interface RecommendationCardProps {
  recommendation: Recommendation;
  number: number;
}

export function RecommendationCard({ recommendation, number }: RecommendationCardProps) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Number Badge */}
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
          #{number}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg flex items-center justify-center text-2xl">
          {recommendation.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {recommendation.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {recommendation.description}
          </p>

          {/* Location & Distance */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{recommendation.location}</span>
            <span className="text-gray-300">•</span>
            <span>{recommendation.distance}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
