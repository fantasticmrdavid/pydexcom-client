import type { NextApiRequest, NextApiResponse } from 'next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import axios from 'axios'
import { NORMALIZED_READING, normalizeNightscoutData } from './reading'

export const maxDuration = 15

dayjs.extend(relativeTime)

const fetchReadings = async () => {
  const { NIGHTSCOUT_URL } = process.env
  try {
    const response = await axios.get(`${NIGHTSCOUT_URL}`)
    const readings = normalizeNightscoutData(response.data)
    const oneHourAgo = dayjs().subtract(3, 'hour')
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
          `Time: ${reading.last_cgm_reading}, Value: ${reading.mmol_l.toFixed(2)}`,
      )
      .join('\n')

    const weatherContext = `**Weather (${location}): ${weather.weather[0].description}, Temperature: ${weather.main.temp}°C`

    const fullPrompt = `Act as a Diabetes educator. I have T1 Diabetes and use a YpsoPump. ${prompt}. How should I dose my pump to keep BGL stable? Break down the dosage into **pre-bolus** and **extended bolus**.

      **Guidelines:**  
      - Use **Australian carb/nutrition data**, prioritizing newer Australian sources.  
      - Use **Android APS algorithm** and provided contextual data for calculations.  
      - Format response as follows:  
        1. **Final dosage recommendation** (slightly larger font).  
        2. **Clear, concise bullet points**.  
        3. **Bold all numeric values**.  
            
      **Latest CGM Readings:**
      ${readingsContext}.
      
      **Context:**
      ${weatherContext}.
      **ISF:** ${process.env.INSULIN_SENSITIVITY_FACTOR}.
      **Carb Ratio:** ${process.env.INSULIN_TO_CARB_RATIO}.\n
      **Current time:** ${dayjs().format('HH:mm')}.\n
      Bedtime: 10pm.\n
      Target bedtime BGL: ${process.env.TARGET_BGL_BEDTIME}.\n
      `

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
