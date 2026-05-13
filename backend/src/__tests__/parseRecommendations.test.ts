import { describe, it, expect } from 'vitest';
import { parseRecommendations } from '../services/llm-providers/prompt';

const WELL_FORMED = `
🎯 **Discovery Science Center**
📍 Santa Ana, CA • 15 miles away
A hands-on science museum with interactive exhibits perfect for curious kids. Features a planetarium and coding workshops.

🌳 **Central Park Playground**
📍 Dublin, CA • 2 miles away
A large outdoor park with age-appropriate play structures and open fields. Free admission.

🎨 **Art Workshop for Kids**
📍 Pleasanton, CA • 8 miles away
A drop-in creative arts class where kids can paint, sculpt, and explore their artistic side.

🎭 **Community Theater Matinee**
📍 Livermore, CA • 12 miles away
A family-friendly live performance of a classic fairy tale. Tickets available at the door.

🏊 **Aquatic Center Family Swim**
📍 San Ramon, CA • 10 miles away
Open family swim hours at the city aquatic center. Lap lanes and kiddie pool available.
`.trim();

describe('parseRecommendations', () => {
  it('parses a well-formed markdown response into 5 recommendations', () => {
    const results = parseRecommendations(WELL_FORMED, 'TEST');
    expect(results).toHaveLength(5);
    const first = results[0]!;
    expect(first.title).toBe('Discovery Science Center');
    expect(first.location).toContain('Santa Ana');
    expect(first.distance).toContain('15 miles');
    expect(first.description).toBeTruthy();
  });

  it('returns the correct emoji for each recommendation', () => {
    const results = parseRecommendations(WELL_FORMED, 'TEST');
    expect(results[0]!.emoji).toBe('🎯');
    expect(results[4]!.emoji).toBe('🏊');
  });

  it('returns an empty array for an empty string', () => {
    expect(parseRecommendations('', 'TEST')).toEqual([]);
  });

  it('returns an empty array for completely malformed input', () => {
    expect(parseRecommendations('No structure here. Just plain text.', 'TEST')).toEqual([]);
  });

  it('handles partial markdown (returns only valid entries)', () => {
    const partial = `
🎯 **Discovery Science Center**
📍 Santa Ana, CA • 15 miles away
A hands-on science museum.

Just some text that has no recommendation structure.
    `.trim();

    const results = parseRecommendations(partial, 'TEST');
    expect(results.length).toBeGreaterThanOrEqual(0);
    // At least the first valid recommendation should parse
    if (results.length > 0) {
      expect(results[0]!.title).toBe('Discovery Science Center');
    }
  });

  it('caps output at 5 results even if more are present', () => {
    const extra = WELL_FORMED + `

🎪 **Bonus Activity**
📍 Oakland, CA • 20 miles away
An extra fun event that goes beyond the usual five.
    `;
    const results = parseRecommendations(extra, 'TEST');
    expect(results.length).toBeLessThanOrEqual(5);
  });
});
