import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export type NIGHTSCOUT_READING = {
  sgv: number
  dateString: string
  direction: string
}

export type NORMALIZED_READING = {
  mmol_l: number
  last_cgm_reading: string
  trend_arrow: string
}

const { NIGHTSCOUT_URL } = process.env
export const getReadings = async (
  req: NextApiRequest,
  res: NextApiResponse<NIGHTSCOUT_READING>,
) => {
  const results = await axios.get(`${NIGHTSCOUT_URL}`)
  const { data } = results
  const normalizedData = data
    .map((reading: NIGHTSCOUT_READING) => ({
      mmol_l: reading.sgv / 18,
      last_cgm_reading: new Date(reading.dateString).toISOString(),
      trend_arrow: reading.direction,
    }))
    .sort(
      (a: NORMALIZED_READING, b: NORMALIZED_READING) =>
        new Date(b.last_cgm_reading).getTime() -
        new Date(a.last_cgm_reading).getTime(),
    )
  return res.status(200).json(normalizedData)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case 'GET':
      return await getReadings(req, res)
  }
}
