import type { NextApiRequest, NextApiResponse } from 'next'

type Data =
  | { city: string; state?: string; country: string }
  | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const { lat, lon } = req.query

  if (!lat || !lon || Array.isArray(lat) || Array.isArray(lon)) {
    return res.status(400).json({ error: 'Missing or invalid lat/lon' })
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenWeatherMap API key' })
  }

  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'Location not found' })
    }

    const { name: city, state, country } = data[0]
    return res.status(200).json({ city, state, country })
  } catch (err) {
    return res
      .status(502)
      .json({ error: 'Failed to fetch reverse geocoding from OpenWeatherMap' })
  }
}
