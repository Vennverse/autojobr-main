import { useState, useEffect } from 'react';

export interface UserLocation {
  country: string;
  countryCode: string;
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export function useLocationDetection() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // First try browser geolocation for exact coordinates
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              // Fetch location from IP-based API with coordinates as backup
              const ipLocation = await fetchLocationFromIP();
              if (ipLocation) {
                setLocation({
                  ...ipLocation,
                  latitude,
                  longitude,
                });
              }
              setLoading(false);
            },
            () => {
              // If geolocation fails, fall back to IP-based detection
              detectLocationFromIP();
            }
          );
        } else {
          detectLocationFromIP();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect location');
        setLoading(false);
      }
    };

    const detectLocationFromIP = async () => {
      try {
        const ipLocation = await fetchLocationFromIP();
        if (ipLocation) {
          setLocation(ipLocation);
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect location from IP');
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  return { location, loading, error };
}

async function fetchLocationFromIP(): Promise<UserLocation | null> {
  try {
    // Using ip-api.com (free tier, 45 requests/minute)
    const response = await fetch('https://ip-api.com/json/?fields=country,countryCode,city,regionName,lat,lon', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error('Failed to fetch location');

    const data = await response.json();

    if (data.status === 'fail') {
      // Fallback to alternate IP geolocation service
      return fetchLocationFromAlternativeAPI();
    }

    return {
      country: data.country || 'United States',
      countryCode: data.countryCode || 'US',
      city: data.city || 'Unknown',
      state: data.regionName,
      latitude: data.lat,
      longitude: data.lon,
    };
  } catch {
    // Fallback to alternate service
    return fetchLocationFromAlternativeAPI();
  }
}

async function fetchLocationFromAlternativeAPI(): Promise<UserLocation | null> {
  try {
    // Fallback to ipify geolocation
    const response = await fetch('https://geo.ipify.org/api/v2/country?apiKey=at_pblB05LhRSChZbKiSxEbgVQ0fKvZK', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error('Failed to fetch location');

    const data = await response.json();

    return {
      country: data.location?.country || 'United States',
      countryCode: data.location?.country_code || 'US',
      city: data.location?.city || 'Unknown',
      state: data.location?.region,
      latitude: data.location?.lat,
      longitude: data.location?.lng,
    };
  } catch {
    // Last resort: default to US
    return {
      country: 'United States',
      countryCode: 'US',
      city: 'Unknown',
    };
  }
}
