import { useState } from 'react';
import type { ActivityFormData, TimeSlot, LLMProvider } from '../types/index.ts';
import { getNextWeekend, getTomorrow } from '../utils/date';
import { getProviderIcon } from '../utils/providerIcons';

interface ActivityFormProps {
  onSubmit: (data: ActivityFormData) => void;
}

export function ActivityForm({ onSubmit }: ActivityFormProps) {
  const [city, setCity] = useState('Dublin');
  const [state, setState] = useState('CA');
  const [zipCode, setZipCode] = useState('');
  const [agesInput, setAgesInput] = useState('7');
  const [date, setDate] = useState(getNextWeekend());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('all_day');
  const [distance, setDistance] = useState(10);
  const [preferences, setPreferences] = useState('outdoor activities, family-friendly');
  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCity = city.trim();
    const trimmedState = state.trim().toUpperCase();
    const trimmedZip = zipCode.trim();
    const trimmedPreferences = preferences.trim();

    // Zip code pattern check (optional field)
    if (trimmedZip && !/^\d{5}$/.test(trimmedZip)) {
      setFormError('Zip code must be exactly 5 digits');
      return;
    }

    // State format check
    if (trimmedState && !/^[A-Z]{2}$/.test(trimmedState)) {
      setFormError('State must be a 2-letter code (e.g. CA)');
      return;
    }

    // Parse and validate ages
    const ages = agesInput
      .split(',')
      .map(age => parseInt(age.trim()))
      .filter(age => !isNaN(age) && age >= 0 && age <= 18);

    if (!trimmedCity || !trimmedState || ages.length === 0 || !date || !timeSlot) {
      setFormError('Please fill in all required fields correctly. Ages must be between 0 and 18.');
      return;
    }

    onSubmit({
      city: trimmedCity,
      state: trimmedState,
      zipCode: trimmedZip || undefined,
      ages,
      date,
      timeSlot,
      distance,
      preferences: trimmedPreferences,
      provider,
    });
  };

  const handleClear = () => {
    setCity('');
    setState('');
    setZipCode('');
    setAgesInput('');
    setDate(getNextWeekend());
    setTimeSlot('all_day');
    setDistance(10);
    setPreferences('');
    setProvider('anthropic');
    setFormError(null);
  };

  const providerOptions: { value: LLMProvider; label: string; model?: string }[] = [
    { value: 'anthropic', label: 'Anthropic Claude', model: 'Sonnet 4.5' },
    { value: 'perplexity', label: 'Perplexity', model: 'Sonar' },
    { value: 'gemini', label: 'Google Gemini', model: '2.5 Flash' },
    { value: 'all', label: 'All AI Providers' },
  ];

  const selectedProvider = providerOptions.find((opt) => opt.value === provider);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5">
      {/* Form Header */}
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Search Activities</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about your family</p>
      </div>

      {/* Inline form error */}
      {formError && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* LLM Provider Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          AI Provider <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {providerOptions.map((option) => (
            <label
              key={option.value}
              htmlFor={`provider-${option.value}`}
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                provider === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                id={`provider-${option.value}`}
                name="provider"
                value={option.value}
                checked={provider === option.value}
                onChange={(e) => setProvider(e.target.value as LLMProvider)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                required
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getProviderIcon(option.value)}</span>
                  <span className="font-medium text-gray-900">{option.label}</span>
                  {option.model && (
                    <span className="text-xs text-gray-500">- {option.model}</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {provider === 'all'
            ? 'All available AI providers will be queried in parallel'
            : `Selected: ${selectedProvider?.label}${selectedProvider?.model ? ` - ${selectedProvider.model}` : ''}`}
        </p>
      </div>

      {/* Location Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📍</span>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dublin"
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏛️</span>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition uppercase"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-2">
            Zip Code <span className="text-gray-400 font-normal">(optional - for more precision)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔢</span>
            <input
              type="text"
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="94568"
              maxLength={5}
              pattern="\d{5}"
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">Providing a zip code helps get more accurate results</p>
        </div>
      </div>

      {/* Kids' Ages Input */}
      <div>
        <label htmlFor="ages" className="block text-sm font-semibold text-gray-700 mb-2">
          Kids' Ages <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">👶</span>
          <input
            type="text"
            id="ages"
            value={agesInput}
            onChange={(e) => setAgesInput(e.target.value)}
            placeholder="e.g., 5, 8, 12"
            required
            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">Enter ages (0–18) separated by commas</p>
      </div>

      {/* Date and Time Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📅</span>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTomorrow()}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="timeSlot" className="block text-sm font-semibold text-gray-700 mb-2">
              Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">⏰</span>
              <select
                id="timeSlot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
              >
                <option value="all_day">All Day</option>
                <option value="morning">Morning (8 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="evening">Evening (4 PM - 8 PM)</option>
                <option value="night">Night (8 PM - 11 PM)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Distance Slider */}
      <div>
        <label htmlFor="distance" className="block text-sm font-semibold text-gray-700 mb-2">
          How far will you drive?
        </label>
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl z-10">🚗</span>
            <input
              type="range"
              id="distance"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              min="1"
              max="50"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>1 mile</span>
            <span className="font-semibold text-blue-600">{distance} miles</span>
            <span>50 miles</span>
          </div>
        </div>
      </div>

      {/* Preferences Input (Optional) */}
      <div>
        <label htmlFor="preferences" className="block text-sm font-semibold text-gray-700 mb-2">
          Any preferences? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-xl">💭</span>
          <textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g., outdoor, educational, free or low-cost"
            rows={3}
            maxLength={500}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400 text-right">{preferences.length}/500</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-sm hover:shadow-md"
        >
          Find Activities
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition duration-200"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
