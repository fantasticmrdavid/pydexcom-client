import type { NextApiRequest, NextApiResponse } from 'next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import axios from 'axios'
import OpenAI from 'openai'
import { NORMALIZED_READING, normalizeNightscoutData } from './reading'

export const maxDuration = 15

dayjs.extend(relativeTime)

const fetchReadings = async () => {
  const { NIGHTSCOUT_URL } = process.env
  try {
    const response = await axios.get(`${NIGHTSCOUT_URL}?count=36`)
    const readings = normalizeNightscoutData(response.data)
    const hoursAgo = dayjs().subtract(3, 'hour')
    return readings.filter((reading: NORMALIZED_READING) =>
      dayjs(reading.last_cgm_reading).isAfter(hoursAgo),
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

    const fullPrompt = `You are an advanced Diabetes educator specializing in Type 1 diabetes and insulin pump therapy. I have T1 Diabetes and use a YpsoPump. ${prompt}. How should I dose my pump to keep BGL stable?

      **Guidelines:**  
      - Use **Australian carb/nutrition data**, prioritizing the most recent and region-specific data Australian sources.
      - Use **Android APS algorithm** and provided contextual data for calculations.
      - Round all insulin dosage recommendations to the nearest 0.5. Round up if BGL is high or trending up, down if low or trending down. 
      - Format response as follows:
        1. **Final dosage recommendation** (slightly larger font).
        2. **Clear, concise bullet points**.
      
      **Latest CGM Readings:**
      ${readingsContext}.

      **Context:**
      ${weatherContext}.
      **ISF:** ${process.env.INSULIN_SENSITIVITY_FACTOR}.
      **Carb Ratio:** ${process.env.INSULIN_TO_CARB_RATIO}.\n
      **Current time:** ${dayjs().format('HH:mm')}.\n
      Bedtime: 10pm.\n
      Target bedtime BGL: ${process.env.TARGET_BGL_BEDTIME}.\n
      
      **Response Schema:**
      - **finalRecommendation:** Break down the final dosage into **preBolus** and **extendedBolus**. Also include the current BGL and trend direction.
      - **dosageBreakdown:** Provide a detailed breakdown of the dosage broken down into **step** and **detail**. Format all numerical values in bold markdown for this section only. Explain when Android APS algorithm has been used.
      - **notes:** Include any additional notes or considerations.
      
      **Return in JSON format as per the above Response Schema**
      `

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const chatGPTResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant providing diabetes management advice.',
        },
        { role: 'user', content: fullPrompt },
      ],
      temperature: 0.2,
      top_p: 0.9,
      response_format: {
        type: 'json_object',
      },
    })

    const message = chatGPTResponse.choices[0].message?.content || ''
    const responseJson = JSON.parse(
      chatGPTResponse.choices[0].message?.content || '{}',
    )

    res.status(200).json({
      ...chatGPTResponse,
      fullPrompt,
      readingsContext,
      weatherContext,
      message,
      responseJson,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: (error as Error).message,
    })
  }
}

export default handler
