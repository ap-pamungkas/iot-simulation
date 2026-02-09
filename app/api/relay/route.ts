import Pusher from "pusher";
import { NextResponse } from "next/server";

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_APP_KEY!,
    secret: process.env.PUSHER_APP_SECRET!,
    cluster: process.env.PUSHER_APP_CLUSTER!,
    useTLS: true,
});

export async function POST(request: Request) {
  try {
    const { command } = await request.json();
    await pusher.trigger("my-channel", "my-event", { message: command });

    return NextResponse.json({ success: true, message: `Relay is ${command}` });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}