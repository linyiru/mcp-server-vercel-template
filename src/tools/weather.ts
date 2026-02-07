/**
 * Weather Tool
 *
 * Example tool demonstrating external API calls (no auth required).
 * Uses Open-Meteo free API: https://open-meteo.com/
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { invalidInput } from './errors.js'

interface GeocodingResult {
  results?: Array<{
    name: string
    country: string
    latitude: number
    longitude: number
  }>
}

interface WeatherResponse {
  current?: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
}

export function registerWeatherTools(server: McpServer) {
  server.registerTool(
    'get_weather',
    {
      title: 'Get Weather',
      description: 'Get current weather for a city. Uses Open-Meteo free API (no API key needed).',
      inputSchema: {
        city: z.string().describe('City name (e.g., "Tokyo", "New York", "London")'),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ city }) => {
      // Geocode the city name to coordinates
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      )
      const geoData = (await geoRes.json()) as GeocodingResult

      if (!geoData.results?.length) {
        return invalidInput(
          `City "${city}" not found.`,
          'Try a different spelling or use a major city name.'
        )
      }

      const { name, country, latitude, longitude } = geoData.results[0]

      // Fetch current weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
      )
      const weatherData = (await weatherRes.json()) as WeatherResponse

      if (!weatherData.current) {
        return invalidInput('Weather data unavailable for this location.')
      }

      const { temperature_2m, relative_humidity_2m, wind_speed_10m, weather_code } =
        weatherData.current

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            location: { city: name, country, latitude, longitude },
            current: {
              temperature: `${temperature_2m}°C`,
              humidity: `${relative_humidity_2m}%`,
              wind_speed: `${wind_speed_10m} km/h`,
              condition: WEATHER_CODES[weather_code] ?? `Unknown (code ${weather_code})`,
            },
          }),
        }],
      }
    }
  )
}
