import type { NextApiRequest, NextApiResponse } from 'next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import axios from 'axios'
import { NORMALIZED_READING, normalizeNightscoutData } from './reading'

dayjs.extend(relativeTime)

const fetchReadings = async () => {
  const { NIGHTSCOUT_URL } = process.env
  try {
    const response = await axios.get(`${NIGHTSCOUT_URL}`)
    const readings = normalizeNightscoutData(response.data)
    const oneHourAgo = dayjs().subtract(1, 'hour')
    return readings.filter((reading: NORMALIZED_READING) =>
      dayjs(reading.last_cgm_reading).isAfter(oneHourAgo),
    )
  } catch (error) {
    throw new Error(
      `Failed to fetch readings from ${NIGHTSCOUT_URL}: ${(error as Error).message}`,
    )
  }
}

const fetchWeather = async (location: string) => {
  const { OPENWEATHERMAP_API_KEY } = process.env
  const url = `https://api.openweathermap.org/data/2.5/weather`
  try {
    const response = await axios.get(url, {
      params: {
        q: location,
        appid: OPENWEATHERMAP_API_KEY,
        units: 'metric',
      },
    })
    return response.data
  } catch (error) {
    throw new Error(
      `Failed to fetch weather from ${url} for location ${location}: ${(error as Error).message}`,
    )
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { prompt, location } = req.body
  if (!prompt || !location) {
    return res.status(400).json({ message: 'Prompt and location are required' })
  }

  try {
    const readings = await fetchReadings()
    const weather = await fetchWeather(location)

    const readingsContext = readings
      .map(
        (reading: NORMALIZED_READING) =>
          `Time: ${reading.last_cgm_reading}, Value: ${reading.mmol_l}`,
      )
      .join('\n')

    const weatherContext = `Weather in ${location}: ${weather.weather[0].description}, Temperature: ${weather.main.temp}°C`

    const fullPrompt = `I have T1 Diabetes and am on a YpsoPump. ${prompt}\n\nContext:\n${readingsContext}\n\n${weatherContext}. What should I input into the pump to prepare for this meal and when to ensure my blood glucose levels are stable? Explain in simple terms.`

    const chatGPTResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant providing diabetes management advice.',
            },
            { role: 'user', content: fullPrompt }, // Dynamic prompt input
          ],
          temperature: 0.7,
        }),
      },
    )

    const data = await chatGPTResponse.json()
    res.status(200).json({
      ...data,
      fullPrompt,
      readingsContext,
      weatherContext,
      message: data.choices[0].message.content,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: (error as Error).message,
    })
  }
}

export default handler
