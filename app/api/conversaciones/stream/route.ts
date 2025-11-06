import { Client } from 'pg';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        await client.connect();
        await client.query('LISTEN new_message');

        client.on('notification', (msg) => {
          if (msg.channel === 'new_message') {
            const data = `data: ${msg.payload}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        });

        const connectionData = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
        controller.enqueue(encoder.encode(connectionData));

        req.signal.addEventListener('abort', async () => {
          try {
            await client.query('UNLISTEN new_message');
            await client.end();
            controller.close();
          } catch (err) {
            console.error('Error closing connection:', err);
          }
        });

      } catch (error) {
        console.error('Error en stream:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}