import { dbServices } from "@server/db/services";
import type { HonoContextWithAuth } from "@server/types/hono";
import { Hono } from "hono";

const app = new Hono<HonoContextWithAuth>().delete(
	"/:chatRoomId/agents/:agentId/workflows/:workflowId",
	async (c) => {
		const { AGENT_DURABLE_OBJECT } = c.env;
		const chatRoomId = c.req.param("chatRoomId");
		const agentId = c.req.param("agentId");
		const workflowId = c.req.param("workflowId");
		const session = c.get("session");
		const { activeOrganizationId } = session;

		// Get the chat room
		const chatRoom = await dbServices.room.getChatRoom({
			chatRoomId,
			organizationId: activeOrganizationId,
		});

		if (!chatRoom) {
			throw new Error("Chat room not found");
		}

		const memberAgent = await dbServices.roomMember.getChatRoomMember({
			chatRoomId,
			memberId: agentId,
		});

		if (!memberAgent) {
			throw new Error("Agent not found");
		}

		const agentDoId = AGENT_DURABLE_OBJECT.idFromString(memberAgent.memberId);
		const agentDo = AGENT_DURABLE_OBJECT.get(agentDoId);
		await agentDo.deleteWorkflow(chatRoomId, workflowId);

		return c.json({
			success: true,
		});
	},
);

export default app;
