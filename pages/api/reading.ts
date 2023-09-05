import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/app/lib/prisma'
import axios from 'axios'

const { DEXCOM_JSON_URL } = process.env
export const getReadings = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const results = await axios.get(`${DEXCOM_JSON_URL}`)
  const { data } = results
  return res.status(200).json(data)
}

export const addReading = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { mmol_l, trend_arrow, trend_description, datetime } = req.body
    if (!mmol_l || !trend_arrow || !trend_description || !datetime) return {}

    const result = await prisma.readings.create({
      data: {
        mmol_l,
        trend_arrow,
        trend_description,
        datetime,
      },
    })
    return res.status(200).json(result)
  } catch (error) {
    console.log('SQL ERROR: ', error)
    return res.status(500).json({ error })
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case 'GET':
      return await getReadings(req, res)
    case 'POST':
      return await addReading(req, res)
  }
}
