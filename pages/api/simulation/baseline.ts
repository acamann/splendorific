// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const baseUrl = req ? `${protocol}://${req.headers.host}` : ''
    fetch(`${baseUrl}/.netlify/functions/simulate-background`, {
      method: "POST",
    });
    return res.status(202).end();
  } else {
    return res.status(405).end();
  }
}
