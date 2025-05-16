import Ajv from 'ajv'
import type { NextApiRequest, NextApiResponse } from 'next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import axios from 'axios'
import OpenAI from 'openai'
import { NORMALIZED_READING, normalizeNightscoutData } from '../reading'
import { systemPrompts } from './systemPrompts'
import { responseSchemas } from './responseSchemas'
import { userPersonas } from './userPersonas'

const ajv = new Ajv()
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

export type Purpose = keyof typeof systemPrompts

export type UserPersona = keyof typeof userPersonas

export interface RequestBody {
  prompt: string
  location: string
  purpose: Purpose
  userPersona: UserPersona
}

const fetchWeather = async (location: string) => {
  const { OPENWEATHERMAP_API_KEY } = process.env
  const url = `https://api.openweathermap.org/data/2.5/weather`

  // match "lat,lon" (e.g. "12.34,-56.78")
  const coordMatch = location.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/)

  const params: Record<string, string | number> = {
    appid: OPENWEATHERMAP_API_KEY!,
    units: 'metric',
  }

  if (coordMatch) {
    const [, lat, , lon] = coordMatch
    params.lat = parseFloat(lat)
    params.lon = parseFloat(lon)
  } else {
    params.q = location
  }

  try {
    const response = await axios.get(url, { params })
    return response.data
  } catch (error) {
    throw new Error(
      `Failed to fetch weather from ${url} for location ${location}: ${
        (error as Error).message
      }, params: ${JSON.stringify(params)}`,
    )
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { prompt, location, purpose, userPersona }: RequestBody = req.body
  if (!prompt || !location || !purpose || !userPersona) {
    return res.status(400).json({
      message: 'Prompt, location, purpose, and userPersona are required',
    })
  }

  try {
    const readings = await fetchReadings()
    const weather = await fetchWeather(location)

    const readingsContext = readings
      .map(
        (reading: NORMALIZED_READING) =>
          `T: ${dayjs().diff(dayjs(reading.last_cgm_reading), 'minute')}, V: ${reading.mmol_l.toFixed(1)}`,
      )
      .join('\n')

    const weatherContext = `**Weather (${location}):** ${weather.weather[0].description}, Temperature: ${weather.main.temp}°C`

    const fullPrompt = `${userPersonas[userPersona].prompt} ${prompt}.

    **System Prompt:**
    ${systemPrompts[purpose].prompt}

    **Latest CGM Readings in relative time from now:**
    ${readingsContext}.

    **Context:**
    **Location:** ${location}.\n
    ${weatherContext}.\n
    **ISF:** ${process.env.INSULIN_SENSITIVITY_FACTOR}.\n
    **Carb Ratio:** ${process.env.INSULIN_TO_CARB_RATIO}.\n
    **Current time:** ${dayjs().format('HH:mm')}.\n
    **Bedtime:** ${process.env.TARGET_TIME_BEDTIME}.\n
    **Target bedtime BGL:** ${process.env.TARGET_BGL_BEDTIME}.\n

    **Response Schema:**
    ${JSON.stringify(responseSchemas[purpose], null, 2)}

    **Return in JSON format as per the above Response Schema**`

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const chatGPTResponse = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content:
            'You are an advanced Diabetes educator specializing in Type 1 diabetes and insulin pump therapy.',
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
    const responseJson = JSON.parse(message || '{}')

    const validate = ajv.compile(responseSchemas[purpose])
    const valid = validate(responseJson)

    if (!valid) {
      return res.status(400).json({
        message: 'Response does not conform to schema',
        errors: validate.errors,
      })
    }

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
