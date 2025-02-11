export interface Session {
	webSocket: WebSocket;
	userId: string;
	userName: string;
}

export type WsMessage =
	| { type: "message"; userId: string; userName: string; data: string }
	| { type: "quit"; userId: string; userName: string }
	| { type: "join"; userId: string; userName: string };
