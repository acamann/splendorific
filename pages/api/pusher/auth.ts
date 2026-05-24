// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import Pusher from "Pusher";

// TODO: unused api, remove?
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Pusher.ChannelAuthResponse>
) {
  if (req.method === 'POST') {
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID ?? "",
      key: process.env.PUSHER_APP_KEY ?? "",
      secret: process.env.PUSHER_APP_SECRET ?? "",
      cluster: process.env.PUSHER_APP_CLUSTER ?? "",
      useTLS: true,
    });

    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    const authResponse = pusher.authorizeChannel(socketId, channel);
    res.send(authResponse);
  } else {
    res.status(405).end();
  }
}
