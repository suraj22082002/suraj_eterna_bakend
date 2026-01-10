import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { orderRoutes } from './routes/orders';
import { config } from './config';
import { orderEvents } from './utils/events';
import { WebSocket } from 'ws';

const app = Fastify({ logger: true });

app.register(cors);
app.register(websocket);

app.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection: any, req) => {
    const query = req.query as { orderId?: string };
    const orderId = query.orderId;

    if (!orderId) {
      connection.socket.close(1008, "orderId required");
      return;
    }

    fastify.log.info(`WS Connected for order ${orderId}`);

    const handleUpdate = (data: any) => {
      if (data.orderId === orderId) {
        connection.socket.send(JSON.stringify(data));
      }
    };

    // Subscribe
    orderEvents.on('update', handleUpdate);

    connection.socket.on('close', () => {
      orderEvents.off('update', handleUpdate);
    });
  });
});

app.register(orderRoutes, { prefix: '/api/orders' });

const start = async () => {
  try {
    await app.listen({ port: Number(config.PORT), host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
