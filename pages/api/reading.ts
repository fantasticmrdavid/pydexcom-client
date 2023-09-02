import {NextApiRequest, NextApiResponse} from "next";
import axios from "axios";

const { DEXCOM_SERVER_URL} = process.env
export const getReadings = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  console.log("REQ: ", `${DEXCOM_SERVER_URL}/reading`)
  const results = await axios.get(`${DEXCOM_SERVER_URL}/reading`)
  return res.status(200).json(results.data)
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