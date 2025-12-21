import { WS_URL } from '../config/env';
import { io } from 'socket.io-client';

// WebSocket client instance configured for production origin
export const socket = io(WS_URL, {
	withCredentials: true,
	transports: ['websocket', 'polling']
});
