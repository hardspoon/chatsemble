export interface Session {
	webSocket: WebSocket;
	name?: string;
}

export type WsMessage =
	| { type: "message"; data: string }
	| { type: "quit"; id: string }
	| { type: "join"; id: string };
