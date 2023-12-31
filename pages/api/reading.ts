import { NextApiRequest, NextApiResponse } from 'next'
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case 'GET':
      return await getReadings(req, res)
  }
}
