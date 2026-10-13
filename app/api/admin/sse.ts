import { Request, Response } from 'express';
import { getAuthenticatedUser } from '../../../actions/auth-helper.ts';

// In-memory store for connected admin clients
const adminClients = new Set<Response>();

export function sseAdminMiddleware(req: Request, res: Response) {
  if (getAuthenticatedUser(req)?.role !== 'ADMIN') {
    res.status(401).json({ success: false, error: 'Administrator session required.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE connection

  adminClients.add(res);

  // Send an initial heartbeat to confirm connection
  res.write('data: ' + JSON.stringify({ type: 'connected' }) + '\n\n');

  req.on('close', () => {
    adminClients.delete(res);
  });
}

export function broadcastAdminEvent(type: string, payload: any) {
  const message = 'data: ' + JSON.stringify({ type, payload }) + '\n\n';
  adminClients.forEach((client) => {
    client.write(message);
  });
}
