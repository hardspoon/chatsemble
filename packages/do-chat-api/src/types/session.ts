export interface Session {
	webSocket: WebSocket;
	userId: string;
}

export type WsMessage =
	| { type: "message"; userId: string; data: string }
	| { type: "quit"; userId: string }
	| { type: "join"; userId: string };
