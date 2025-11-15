import { useState } from 'react';
import type { ActivityFormData, TimeSlot } from '../types/index.ts';

interface ActivityFormProps {
  onSubmit: (data: ActivityFormData) => void;
}

export function ActivityForm({ onSubmit }: ActivityFormProps) {
  // Helper function to get next weekend date (Saturday)
  const getNextWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // If today is already the weekend (Saturday or Sunday), use today
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      return today.toISOString().split('T')[0];
    }

    // Otherwise, calculate days until next Saturday
    const daysUntilSaturday = 6 - dayOfWeek;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday.toISOString().split('T')[0];
  };

  const [city, setCity] = useState('Dublin');
  const [state, setState] = useState('CA');
  const [zipCode, setZipCode] = useState('');
  const [agesInput, setAgesInput] = useState('7');
  const [date, setDate] = useState(getNextWeekend());
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('all_day');
  const [distance, setDistance] = useState(10);
  const [preferences, setPreferences] = useState('outdoor activities, family-friendly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse ages from comma-separated string
    const ages = agesInput
      .split(',')
      .map(age => parseInt(age.trim()))
      .filter(age => !isNaN(age));

    // Basic validation
    if (!city || !state || ages.length === 0 || !date || !timeSlot) {
      alert('Please fill in all required fields correctly');
      return;
    }

    // Submit form data
    onSubmit({
      city,
      state,
      zipCode: zipCode || undefined,
      ages,
      date,
      timeSlot,
      distance,
      preferences
    });
  };

  const handleClear = () => {
    setCity('');
    setState('');
    setZipCode('');
    setAgesInput('');
    setDate('');
    setTimeSlot('afternoon');
    setDistance(10);
    setPreferences('');
  };

  // Get tomorrow's date as minimum selectable date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5">
      {/* Form Header */}
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Search Activities</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about your family</p>
      </div>

      {/* Location Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* City Input */}
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

          {/* State Input */}
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

        {/* Zip Code Input (Optional) */}
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
        <p className="mt-1.5 text-xs text-gray-500">Enter ages separated by commas</p>
      </div>

      {/* Date and Time Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Date Picker */}
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
                min={getTomorrowDate()}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Time Slot Dropdown */}
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
            className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
          />
        </div>
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
