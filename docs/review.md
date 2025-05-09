```json
{
 "parsePRD": {
  "main": "You are assisting with transforming a Product Requirements Document (PRD) into a structured set of development tasks.\n\nGiven the following PRD, create a comprehensive list of development tasks that would be needed to implement the described product.\n\nFor each task:\n1. Assign a short, descriptive title\n2. Write a concise description\n3. Identify dependencies (which tasks must be completed before this one), if applicable\n4. Assign a priority (high, medium, low), with high priority for critical path items and medium for other essential functionalities, with low priority for enhancements or non-essential improvements that can be added at a later phase\n5. Include detailed implementation notes\n6. Describe a test strategy to verify completion\n\nStructure the tasks in a logical order of implementation, starting with essential setup and foundation, then building core functionalities, and ending with integrations or enhancements. Make sure to preserve dependencies, priorities, implementation details, and test strategies. Only include explicitly stated information from the PRD — do not fabricate, assume, or create new requirements or tasks beyond what is explicitly mentioned. Ensure tasks accurately reflect what needs to be built. Avoid mentioning timelines or release cycles as these are out of scope for this conversion. Do not number or format the tasks as these properties will be added by Taskmaster. Each task should represent a logical unit of work, avoiding fragmentation or combining unrelated requirements. Dependencies should reflect true dependencies, and priorities should align with implementation order and task criticality. Implementation details should be thorough and specific, while test strategies should outline how each task's completion would be verified.\n\nPRD:\n{{prd_content}}",
  "research": "You are a seasoned product manager tasked with analyzing a Product Requirements Document (PRD) and constructing a set of implementable tasks, incorporating best practices, industry standards, and current market trends into a comprehensive development plan. Your expertise should be apparent in your choice of technologies and approaches, ensuring each task is structured according to modern software development methodologies.\n\nGiven the provided PRD content, create a detailed and structured list of development tasks that would be needed to implement the product.  Each task should be atomic but must also describe its context within the broader project architecture and development lifecycle. Focus on actionable next steps that a development team can immediately begin working on, prioritizing essential functionalities, integrations, and improvements that contribute to a solid foundation. Ensure all tasks include detailed implementation notes that capture best practices, technical specifications, and potential challenges, covering all crucial aspects required for execution.\n\nFor each task, ensure to include:\n1. A short, descriptive title that clearly indicates the purpose and scope of the task.\n2. A concise and detailed description summarizing the task's objective and its place within the product roadmap, explaining the context within the bigger picture of the project and how the task at hand plays a part in it.\n3. A list of dependencies (which tasks must be completed before this one).\n4. A priority level (high, medium, or low), prioritizing critical path tasks, foundation/infrastructural requirements, and functionalities, with low priority for non-essential tasks that can be deferred until a later phase. Make sure to explain why each task received its given priority, specifically within the context of project architecture and dependencies.\n5. In-depth implementation notes covering specific technologies, algorithms, standards, libraries, frameworks, or design patterns relevant to the task. This should not include generic notes but instead use specific information for how the task at hand should be implemented according to best practices, ensuring it considers future extensions and potential evolution of the product.\n6. A comprehensive test strategy for how each task would be validated and verified once implemented.\n\nStructure the tasks in a logical order, beginning with core functionalities, then essential features, and lastly, integrations and enhancements. Ensure tasks are neither too broad nor too fragmented, each representing a coherent unit of work. Make sure dependencies are properly identified, aligning with implementation order and task criticality, while implementation details are specific and thorough. Test strategies should clearly define validation criteria and acceptance criteria for each task. Finally, prioritize clarity, specificity, and technical depth in your description of each task, allowing developers to immediately understand the intent and approach.\n\nPRD:\n{{prd_content}}"
 },
 "analyzeTaskComplexity": {
  "main": "Analyze the following tasks to determine their complexity (1-10 scale) and recommend the number of subtasks for expansion. Provide a brief reasoning and an initial expansion prompt for each.\n\nTasks:\n{{tasks}}\n\nRespond ONLY with a valid JSON array matching the schema:\n[\n  {\n    \"taskId\": <number>,\n    \"taskTitle\": \"<string>\",\n    \"complexityScore\": <number 1-10>,\n    \"recommendedSubtasks\": <number>,\n    \"expansionPrompt\": \"<string>\",\n    \"reasoning\": \"<string>\"\n  },\n  ...\n]\n\nDo not include any explanatory text, markdown formatting, or code block markers before or after the JSON array.",
  "research": "You are a highly experienced software engineer and project manager with deep knowledge of various technologies and frameworks. Your goal is to perform a complexity analysis of the provided tasks and offer recommendations for improvement.\n\nFor each task, consider these factors when evaluating its complexity:\n- Technical skills needed (e.g., experience with APIs, databases, asynchronous programming, etc.)\n- Dependencies on external libraries or services\n- Scope and overall impact on the project\n- Potential risks or challenges in implementation\n- User experience and interface complexity\n- Quality assurance and testing requirements\n- Effort estimation for different phases (design, development, testing, deployment)\n- Expected cost of resources\n- Potential impact on project timelines\n\nTasks:\n```json\n{{tasks}}\n```\n\nReturn your analysis in the following JSON structure:\n```json\n[\n  {\n    \"taskId\": <number>,\n    \"taskTitle\": \"<string>\",\n    \"complexityScore\": <number 1-10>,\n    \"recommendedSubtasks\": <number>,\n    \"expansionPrompt\": \"<string>\",\n    \"reasoning\": \"<string>\"\n  },\n  ...\n]\n```\n\nImportant notes:\n- Do not include any text or markdown outside the JSON array.\n- Scores should reflect technical complexity based on the criteria above.\n- Recommended subtasks should be 3-10, with higher complexity tasks getting more subtasks.\n- The expansion prompt should be specific, guiding the developer toward a structured breakdown.\n- The reasoning should justify the complexity score using the evaluation criteria.\n- Use your best judgment and experience when assessing complexity.\n- Include analysis for all provided tasks.\n- Follow the provided JSON structure exactly.\n- You can use all your research-based knowledge across the web when determining task complexity."
 },
 "addSubtask": {
  "main": "You are an AI assistant helping with task breakdown for software development. You will be provided with a parent task and its existing subtasks (if any), along with a prompt describing a new subtask to be added. Your job is to create a new subtask that fits logically into the task hierarchy, maintaining consistent numbering and dependency relationships.\n\nInstructions:\n1. Parse the provided JSON object for the parent task. Note the parent task's title, description and details.\n2. Extract any existing subtasks into an array (note their IDs, titles, descriptions, dependencies, and statuses).\n3. Analyze the user's prompt to determine the title and details for the new subtask.\n4. Generate a unique, sequential ID for the new subtask (starting from 1, or the next available ID if subtasks already exist in the parent task).\n5. Infer logical dependencies for the new subtask based on its description and existing subtasks.\n6. Set the new subtask's status to 'pending' initially.\n7. Merge the new subtask into the existing subtasks array, ensuring proper ordering (by ID).\n8. Enforce consistency in the parent task's subtasks: IDs must be sequential, dependencies must reference only valid subtask IDs or main task ID, statuses should be valid.\n9. Return only the JSON representation of the NEW subtask you've created, matching the expected schema. Do NOT modify or return any of the existing parent/subtask objects or the entire task structure.\n\nParent Task:\n```json\n{{parentTaskJson}}\n```\n\nPrompt for New Subtask: {{prompt}}\n\nSchema for each Subtask:\n```json\n{\n  \"id\": number,\n  \"title\": string,\n  \"description\": string,\n  \"status\": \"pending\",\n  \"dependencies\": [] | [number, ...], // Valid numeric subtask IDs within this expansion OR main task numeric ID if required for a subtask to be completed\n  \"details\": string,\n  \"testStrategy\": string (Optional), // Approach for testing this subtask\n}\n```\n\nReturn ONLY the JSON object for the newly created subtask.",
  "research": "You are a highly skilled software developer and project manager, adept at breaking down complex tasks into manageable subtasks. You understand best practices for task management, software design, implementation, and testing methodologies.\n\nYou are tasked with generating a new subtask for a given parent task, leveraging your deep research capabilities and knowledge of relevant technologies. Your primary goal is to produce a subtask that aligns with industry standards, current best practices, and maximizes clarity, actionability, and technical relevance.\n\nInstructions:\n1. Analyze the parent task information and any existing subtasks to determine a suitable place in the task hierarchy for the new subtask.\n2. Understand the user's prompt for the new subtask and gather relevant information about technologies, libraries, or methods required for implementation using your research capabilities.\n3. Generate a new subtask that includes:\n   - A clear, actionable title.\n   - A detailed description with a suggested technical approach.\n   - A comprehensive test strategy covering edge cases, success scenarios, and boundary conditions.\n   - A detailed implementation plan outlining logical steps to completion.\n   - References to appropriate libraries, tools, or best practices from your research.\n4. Assign an ID to the new subtask, continuing the sequential numbering convention if the parent already has subtasks.\n5. If the parent has no subtasks, start the numbering from 1.\n6. Assign appropriate dependencies based on the task hierarchy, relationship to existing subtasks, and logical ordering of implementation.\n7. If the new subtask does not depend on any other subtasks, do not mention dependencies.\n8. Ensure that the new subtask's ID is greater than any existing dependencies, and that dependencies only refer to prior subtask IDs or the parent ID.\n9. Set the status to 'pending' initially, indicating the subtask is ready to be implemented.\n10. Return only the newly created subtask, formatted as JSON and strictly adhering to the provided schema.\n\nParent Task:\n```json\n{{parentTaskJson}}\n```\n\nUser Prompt: {{prompt}}\n\nExpected Schema:\n```json\n{\n  \"id\": <number>,\n  \"title\": \"<string>\",\n  \"description\": \"<string>\",\n  \"details\": \"<string>\",\n  \"testStrategy\": \"<string>\",  // Required for research-backed generation\n  \"status\": \"pending\",\n  \"dependencies\": [] | [<number>, ...], // Empty if no dependencies, otherwise numeric subtask IDs or parent ID\n  \"parentTaskId\": <number> // id of parent task\n}\n```\n\nReturn ONLY the JSON subtask object. Do not include explanations or comments."
 },
 "updateTask": {
  "main": "You are an AI assistant helping to update a software development task based on new context. You will be given a task and a prompt describing changes or new implementation details.\nYour job is to update the task to reflect these changes, while preserving its basic structure.\n\nGuidelines:\n1. NEVER change the title of the task - keep it exactly as is\n2. Maintain the same ID, status, and dependencies unless specifically mentioned in the prompt\n3. Update the description, details, and test strategy to reflect the new information\n4. Do not change anything unnecessarily - just adapt what needs to change based on the prompt\n5. Return a complete valid JSON object representing the updated task\n6. VERY IMPORTANT: Preserve all subtasks marked as 'done' or 'completed' - do not modify their content\n7. For tasks with completed subtasks, build upon what has already been done rather than rewriting everything\n8. If an existing completed subtask needs to be changed/undone based on the new context, DO NOT modify it directly\n9. Instead, add a new subtask that clearly indicates what needs to be changed or replaced\n10. Use the existence of completed subtasks as an opportunity to make new subtasks more specific and targeted\n11. Ensure any new subtasks have unique IDs that don't conflict with existing ones\n\nThe changes described in the prompt should be thoughtfully applied to make the task more accurate and actionable.\n\nHere is the task to update:\n```json\n{{task}}\n```\n\nPlease update this task based on the following new context:\n{{prompt}}\n\nReturn only the updated task as a valid JSON object.",
  "research": "You are an expert software developer and project manager tasked with refining and updating a development task based on new information and the latest industry best practices. Your knowledge of modern technologies, frameworks, and software development processes should be evident in the updated task.\n\nTask to update:\n```json\n{{task}}\n```\n\nNew context and update requirements:\n{{prompt}}\n\nResearch the most effective approach, considering factors like:\n- Scalability\n- Performance\n- Security\n- Maintainability\n- User experience\n- Best practices and patterns\n- Relevant libraries and frameworks\n- Potential technical challenges\n\nUpdate the task using your research findings, following these guidelines:\n1. NEVER change the task title or ID.\n2. Maintain the existing dependencies, status, and priority unless the prompt requires changes.\n3. Provide highly-specific and technical implementation details in the `details` field.\n4. If an existing subtask needs revision, add a new subtask describing the changes instead of modifying completed items.\n5. If subtasks need to be added based on research, add them with sequential IDs, proper status, and accurate dependencies.\n6. Ensure new subtasks maintain a clear relationship to the parent task and build upon existing work.\n7. In the `testStrategy` section, define a precise and comprehensive verification approach using your technical knowledge.\n8. Follow the exact JSON schema provided, including all required keys and only those keys.\n\nReturn ONLY the updated task as a valid JSON object, strictly matching this structure:\n```json\n{\n  \"id\": <number>,\n  \"title\": \"<string>\",\n  \"description\": \"<string>\",\n  \"status\": \"<string>\",\n  \"dependencies\": \[<number>, ...], // Existing dependencies unless otherwise instructed\n  \"priority\": \"<string>\",        // Existing unless otherwise instructed\n  \"details\": \"<string>\",\n  \"testStrategy\": \"<string>\",\n  \"subtasks\": \[                  // Include existing subtasks plus new ones as needed\n    {\n      \"id\": <number>,\n      \"title\": \"<string>\",\n      \"description\": \"<string>\",\n      \"status\": \"<string>\",\n      \"dependencies\": \[<number>, ...],\n      \"acceptanceCriteria\": \"<string>\",\n      \"details\": \"<string>\"\n    },\n    ...\n  ]\n}\n```\nDo not return any additional text, explanation, or formatting."
 },
 "updateSubtask": {
  "main": "You are an AI assistant updating a parent task's subtask. This subtask will be part of a larger parent task and will be used to direct AI agents to complete the subtask. Your goal is to GENERATE new, relevant information based on the user's request (which may be high-level, mid-level or low-level) and APPEND it to the existing subtask 'details' field, wrapped in specific XML-like tags with an ISO 8601 timestamp. Intelligently determine the level of detail to include based on the user's request. Some requests are meant simply to update the subtask with some mid-implementation details, while others are meant to update the subtask with a detailed plan or strategy.\n\nContext Provided:\n- The current subtask object.\n- Basic info about the parent task (ID, title).\n- Basic info about the immediately preceding subtask (ID, title, status), if it exists.\n- Basic info about the immediately succeeding subtask (ID, title, status), if it exists.\n- A user request string.\n\nGuidelines:\n1. Analyze the user request considering the provided subtask details AND the context of the parent and sibling tasks.\n2. GENERATE new, relevant text content that should be added to the 'details' field. Focus *only* on the substance of the update based on the user request and context. Do NOT add timestamps or any special formatting yourself. Avoid over-engineering the details, provide exactly what's needed to enhance implementation understanding or guide the next execution attempt.\n3. Update the 'details' field in the subtask object with the GENERATED text content. It's okay if this overwrites previous details in the object you return, as the calling code will handle the final appending.\n4. Return the *entire* updated subtask object (with your generated content in the 'details' field) as a valid JSON object conforming to the provided schema. Do NOT return explanations or markdown formatting.\n\nTask Context:\n{{contextString}}\nCurrent Subtask:\n{{subtaskDataString}}\n\nUser Request: \"{{prompt}}\"\n\nPlease GENERATE new, relevant text content for the 'details' field based on the user request and the provided context. Return the entire updated subtask object as a valid JSON object matching the schema, with the newly generated text placed in the 'details' field.",
  "research": "You are a highly skilled software developer and technical researcher, adept at implementing and refining complex software tasks and incorporating the latest best practices into documentation. You're given a subtask, its context within the parent task, and a request to append research-backed information to the subtask's 'details'. Your goal is to enhance this subtask with detailed instructions, up-to-date knowledge, and relevant information derived from your research, formatted specifically for AI-agent use.\n\nTask Context:\n{{contextString}}\nCurrent Subtask:\n{{subtaskDataString}}\n\nUser Request: \"{{prompt}}\"\n\nPerform the following research-driven actions:\n1. Analyze the user request considering the provided subtask details, its parent task context, and any preceding/succeeding subtasks.\n2. Conduct deep research to gather the latest technologies, libraries, patterns, and best practices relevant to the user's request and context. Explore alternative solutions and identify potential challenges and their mitigations. Validate your findings across reputable sources, ensuring information is up-to-date and accurate.\n3. GENERATE text content for the 'details' field, enriching the existing subtask with research-backed information, implementation strategies, and best practices. Avoid over-engineering but provide depth based on the user's request. Do *not* include timestamps or any special formatting yourself—focus on the core information.\n4. Update the 'details' field in the subtask object with your newly GENERATED content. You can overwrite any pre-existing details; the calling code handles appending. If the user prompt asks to append mid-implementation details, include them in the generated details but treat them as a historical milestone to inform future implementation steps.\n5. Return the entire updated subtask object with your added research details as a valid JSON object matching the provided schema. Do not return explanations, additional notes, or Markdown formatting.\n\nExpected schema:\n```json\n{\n  \"id\": number,\n  \"title\": string,\n  \"description\": string,\n  \"status\": \"pending\",\n  \"dependencies\": [] | [number, ...], // Valid numeric subtask IDs within this expansion OR main task numeric ID if required for a subtask to be completed\n  \"details\": string,\n  \"testStrategy\": string (Optional), // Approach for testing this subtask\n}\n```\nReturn ONLY the JSON object."
 },
 "removeSubtask": {
  "main": "Remove a subtask from its parent task\n// Mock the behavior of writeJSON to capture the updated tasks data\nconst updatedTasksData = { tasks: [] };\nmockWriteJSON.mockImplementation((path, data) => {\n  // Store the data for assertions\n  updatedTasksData.tasks = [...data.tasks];\n  return data;\n});",
  "research": null
 },
 "addTask": {
  "main": "Create a comprehensive new task (Task #{{newTaskId}}) for a software development project based on this description: \"{{prompt}}\"\n\n{{contextTasks}}\n{{contextFromArgs}}\n\nReturn your answer as a single JSON object matching the schema precisely:\n{{taskStructureDesc}}\n\nMake sure the details and test strategy are thorough and specific.",
  "research": "Create a comprehensive new task (Task #{{newTaskId}}) for a software development project based on this description: \"{{prompt}}\"\n\n{{contextTasks}}\n{{contextFromArgs}}\n\nResearch the latest best practices, technologies, and implementation patterns for this type of task using all available resources across the internet. Generate a response that aligns with the requirements, constraints, and current industry standards.\n\nReturn your answer as a single JSON object matching the schema precisely:\n{{taskStructureDesc}}\n\nMake sure the details and test strategy are thorough and specific, and that you incorporate research-based best practices, technologies, libraries, and potential challenges into the generated task. Include references and links to relevant documentation or resources as appropriate."
 },
 "updateTasks": {
  "main": "You are an AI assistant helping to update software development tasks based on new context. You will be given a set of tasks and a prompt describing changes or new implementation details.\nYour job is to update the tasks to reflect these changes, while preserving their basic structure.\n\nGuidelines:\n1. Maintain the same IDs, statuses, and dependencies unless specifically mentioned in the prompt\n2. Update titles, descriptions, details, and test strategies to reflect the new information\n3. Do not change anything unnecessarily - just adapt what needs to change based on the prompt\n4. You should return ALL the tasks in order, not just the modified ones\n5. Return a complete valid JSON object with the updated tasks array\n6. VERY IMPORTANT: Preserve all subtasks marked as \"done\" or \"completed\" - do not modify their content\n7. For tasks with completed subtasks, build upon what has already been done rather than rewriting everything\n8. If an existing completed subtask needs to be changed/undone based on the new context, DO NOT modify it directly\n9. Instead, add a new subtask that clearly indicates what needs to be changed or replaced\n10. Use the existence of completed subtasks as an opportunity to make new subtasks more specific and targeted\n\nThe changes described in the prompt should be applied to ALL tasks in the list.\n\nHere are the tasks to update:\n{{taskDataString}}\n\nPlease update these tasks based on the following new context:\n{{prompt}}\n\nReturn only the updated tasks as a valid JSON array.",
  "research": "You are an AI agent tasked with updating a list of development tasks based on new information and utilizing research-based knowledge. Your goal is to improve task relevance, accuracy, and clarity by incorporating best practices, up-to-date insights, and references to appropriate resources from across the web. Given a set of tasks and a prompt outlining new requirements or modifications, you will update the tasks to reflect the current state of technology and best practices.  Your updated tasks should be comprehensive and actionable, empowering a development team to implement them efficiently and effectively.\n\nTasks to Update:\n```json\n{{taskDataString}}\n```\nNew Information and Modifications:\n```\n{{prompt}}\n```\nUpdate the task based on your research findings, following these guidelines:\n1. Maintain the existing IDs, status, and dependencies for each task, unless explicitly instructed otherwise in the prompt. Do not change task IDs under any circumstance.\n2. Adapt the title and description of the task to accurately reflect the changes described in the prompt.\n3. In the 'details' field, incorporate research-backed knowledge, current best practices, specific technologies, or approaches that should be used in implementation. Add implementation details that explain specifically how the task can be implemented and what resources or modules are needed. Add technical specifications for APIs, methods, and integrations.\n4. For every task requiring updates, ensure to add a timestamp to the last 'details' edit, using the format \"\[YYYY-MM-DD HH:MM:SS]\" at the start of the new appended details.\n5. If the prompt introduces new dependencies, update the \"dependencies\" array accordingly.\n6. Do not modify existing subtasks that are marked as \"done\" or \"completed\". If the prompt requires changes to a completed subtask, add a new subtask explaining the required changes, maintaining the original subtask as a record of completed work. In such cases, make sure the new subtask does not conflict with existing work.\n7. Ensure that any new subtasks are added sequentially to the \"subtasks\" array with appropriate dependencies and have their status set to 'pending'. Use existing subtasks as context, and build upon them rather than restarting from scratch if possible.\n8. If the prompt requires a change in the task status or priority, update those fields accordingly.\n9. Ensure your response is a valid JSON array of objects, matching this structure, including existing subtasks plus new ones as needed:\n```json\n[\n    {\n        \"id\": 1, // Preserved original ID\n        \"title\": \"Task Title\",\n        \"description\": \"Brief task description\",\n        \"status\": \"pending\",\n        \"dependencies\": \[2],\n        \"priority\": \"medium\",\n        \"details\": \"... (existing implementation instructions)\\n\\n\[YYYY-MM-DD HH:MM:SS] Added notes based on new context and research...\",\n        \"testStrategy\": \"...\nVerification approach\"\n    },\n    ...\n]\n```\nReturn ONLY the JSON array of updated tasks. Do not include any additional text, explanation, or formatting."
 },
 "get_task": {
  "main": null,
  "research": null
 },
 "next_task": {
  "main": null,
  "research": null
 },
 "models": {
  "main": null,
  "research": null
 },
 "expand_all": {
  "main": null,
  "research": null
 },
 "expand_task": {
  "main": "Break down this task into exactly {{finalSubtaskCount}} specific subtasks:\n\nTask ID: {{task.id}}\nTitle: {{task.title}}\nDescription: {{task.description}}\nCurrent details: {{task.details || 'None'}}\n{{contextPrompt}}\n\nReturn ONLY the JSON object containing the \"subtasks\" array, matching this structure:\n{{schemaDescription}}",
  "research": "Analyze the following task and break it down into exactly {{finalSubtaskCount}} specific subtasks using your research capabilities. Assign sequential IDs starting from {{nextSubtaskId}}.\n\nParent Task:\nID: {{task.id}}\nTitle: {{task.title}}\nDescription: {{task.description}}\nCurrent details: {{task.details || 'None'}}\n{{contextPrompt}}\n\nCRITICAL: Respond ONLY with a valid JSON object containing a single key \"subtasks\". The value must be an array of the generated subtasks, strictly matching this structure:\n{{schemaDescription}}\n\nDo not include ANY explanatory text, markdown, or code block markers. Just the JSON object."
 }
}



================================================
FILE: mcp-server/src/core/direct-functions/models.js
================================================
/**
 * models.js
 * Direct function for managing AI model configurations via MCP
 */

import {
	getModelConfiguration,
	getAvailableModelsList,
	setModel
} from '../../../../scripts/modules/task-manager/models.js';
import {
	enableSilentMode,
	disableSilentMode
} from '../../../../scripts/modules/utils.js';
import { createLogWrapper } from '../../tools/utils.js';

/**
 * Get or update model configuration
 * @param {Object} args - Arguments passed by the MCP tool
 * @param {Object} log - MCP logger
 * @param {Object} context - MCP context (contains session)
 * @returns {Object} Result object with success, data/error fields
 */
export async function modelsDirect(args, log, context = {}) {
	const { session } = context;
	const { projectRoot } = args; // Extract projectRoot from args

	// Create a logger wrapper that the core functions can use
	const mcpLog = createLogWrapper(log);

	log.info(`Executing models_direct with args: ${JSON.stringify(args)}`);
	log.info(`Using project root: ${projectRoot}`);

	// Validate flags: cannot use both openrouter and ollama simultaneously
	if (args.openrouter && args.ollama) {
		log.error(
			'Error: Cannot use both openrouter and ollama flags simultaneously.'
		);
		return {
			success: false,
			error: {
				code: 'INVALID_ARGS',
				message: 'Cannot use both openrouter and ollama flags simultaneously.'
			}
		};
	}

	try {
		enableSilentMode();

		try {
			// Check for the listAvailableModels flag
			if (args.listAvailableModels === true) {
				return await getAvailableModelsList({
					session,
					mcpLog,
					projectRoot // Pass projectRoot to function
				});
			}

			// Handle setting a specific model
			if (args.setMain) {
				return await setModel('main', args.setMain, {
					session,
					mcpLog,
					projectRoot, // Pass projectRoot to function
					providerHint: args.openrouter
						? 'openrouter'
						: args.ollama
							? 'ollama'
							: undefined // Pass hint
				});
			}

			if (args.setResearch) {
				return await setModel('research', args.setResearch, {
					session,
					mcpLog,
					projectRoot, // Pass projectRoot to function
					providerHint: args.openrouter
						? 'openrouter'
						: args.ollama
							? 'ollama'
							: undefined // Pass hint
				});
			}

			if (args.setFallback) {
				return await setModel('fallback', args.setFallback, {
					session,
					mcpLog,
					projectRoot, // Pass projectRoot to function
					providerHint: args.openrouter
						? 'openrouter'
						: args.ollama
							? 'ollama'
							: undefined // Pass hint
				});
			}

			// Default action: get current configuration
			return await getModelConfiguration({
				session,
				mcpLog,
				projectRoot // Pass projectRoot to function
			});
		} finally {
			disableSilentMode();
		}
	} catch (error) {
		log.error(`Error in models_direct: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'DIRECT_FUNCTION_ERROR',
				message: error.message,
				details: error.stack
			}
		};
	}
}



================================================
FILE: scripts/modules/task-manager/models.js
================================================
/**
 * task-manager/models.js
 * Handles managing AI models configurations.
 *
 * This module implements tools for:
 * 1. Viewing the current configuration
 * 2. Listing available AI models for the three roles (main, research, fallback)
 * 3. Interactively configuring models
 * 4. Directly setting models via commands (set-main, set-research, set-fallback).
 */
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
	displayBanner,
	formatSweScoreWithTertileStars,
	formatCost,
	displayAvailableModels,
	displayModelConfiguration,
	displayApiKeyStatus,
	startLoadingIndicator,
	stopLoadingIndicator
} from '../ui.js';
import { getAvailableModels } from '../config-manager.js';
import { isApiKeySet } from '../config-manager.js';
import { getMcpApiKeyStatus } from '../config-manager.js';
import { getAllProviders } from '../config-manager.js';
import {
	getConfig,
	writeConfig,
	isConfigFilePresent,
	getModelConfigForRole,
	validateProvider,
	validateProviderModelCombination
} from '../config-manager.js';
import { log, resolveEnvVariable, findProjectRoot } from '../utils.js';
import https from 'https';
import { createLogWrapper } from '../../../mcp-server/src/tools/utils.js';

/**
 * Get the current model configuration (for CLI).
 * @param {Object} [options] - Options for the operation, including projectRoot.
 * @returns {Promise<void>}
 */
async function getModelConfigurationCLI(options = {}) {
	const { session, mcpLog, projectRoot } = options;

	displayBanner();
	console.log(
		chalk.blue(
			'This command shows the current AI model configuration for this Taskmaster project and gives you tools to change these settings.\n\nIt also shows you which of the required API keys have been set in your .env file or inside the mcp.json config. '
		)
	);

	// Check if config file exists and offer to create it if it doesn't exist in CLI mode
	const configExists = isConfigFilePresent(projectRoot);
	if (!configExists) {
		console.log(
			chalk.yellow(
				'\nConfiguration Update Needed: Taskmaster uses a .taskmasterconfig file in your project root for AI model choices and other settings. This file does not seem to exist. To create the file, please run task-master models --setup to configure Taskmaster.\n'
			)
		);
		return;
	}

	const loadingIndicator = startLoadingIndicator(
		'Fetching Model Configuration...'
	); // Start the spinner

	try {
		const config = getConfig(projectRoot, true); // Force a reload in CLI mode
		const availableModels = getAvailableModels(projectRoot);

		stopLoadingIndicator(loadingIndicator);

		// Get currently configured models - all paths use resolved paths now
		const mainModel = configManager.getModelConfigForRole('main', projectRoot);
		const researchModel = configManager.getModelConfigForRole(
			'research',
			projectRoot
		);
		const fallbackModel = configManager.getModelConfigForRole(
			'fallback',
			projectRoot
		);

		// Build models configuration - pass projectRoot to the config getters
		const currentConfig = {
			activeModels: {
				main: {
					provider: mainModel.provider,
					modelId: mainModel.modelId,
					sweScore: mainModel?.swe_score || null,
					cost: mainModel?.cost_per_1m_tokens || null,
					keyStatus: {
						cli: isApiKeySet(mainModel.provider, null, projectRoot), // No session for CLI
						mcp: getMcpApiKeyStatus(mainModel.provider, projectRoot)
					}
				},
				research: {
					provider: researchModel.provider,
					modelId: researchModel.modelId,
					sweScore: researchModel?.swe_score || null,
					cost: researchModel?.cost_per_1m_tokens || null,
					keyStatus: {
						cli: isApiKeySet(researchModel.provider, null, projectRoot), // No session for CLI
						mcp: getMcpApiKeyStatus(researchModel.provider, projectRoot)
					}
				},
				fallback: fallbackModel && fallbackModel.provider && fallbackModel.modelId // Only add if valid
					? {
							provider: fallbackModel.


```json
{
 "parsePRD": {
  "main": "You are assisting with transforming a Product Requirements Document (PRD) into a structured set of development tasks.\n\nGiven the following PRD, create a comprehensive list of development tasks that would be needed to implement the described product.\n\nFor each task:\n1. Assign a short, descriptive title\n2. Write a concise description\n3. Identify dependencies (which tasks must be completed before this one), if applicable\n4. Assign a priority (high, medium, low), with high priority for critical path items and medium for other essential functionalities, with low priority for enhancements or non-essential improvements that can be added at a later phase\n5. Include detailed implementation notes\n6. Describe a test strategy to verify completion\n\nStructure the tasks in a logical order of implementation, starting with essential setup and foundation, then building core functionalities, and ending with integrations or enhancements. Make sure to preserve dependencies, priorities, implementation details, and test strategies. Only include explicitly stated information from the PRD — do not fabricate, assume, or create new requirements or tasks beyond what is explicitly mentioned. Ensure tasks accurately reflect what needs to be built. Avoid mentioning timelines or release cycles as these are out of scope for this conversion. Do not number or format the tasks as these properties will be added by Taskmaster. Each task should represent a logical unit of work, avoiding fragmentation or combining unrelated requirements. Dependencies should reflect true dependencies, and priorities should align with implementation order and task criticality. Implementation details should be thorough and specific, while test strategies should outline how each task's completion would be verified.\n\nPRD:\n{{prd_content}}",
  "research": "You are a seasoned product manager tasked with analyzing a Product Requirements Document (PRD) and constructing a set of implementable tasks, incorporating best practices, industry standards, and current market trends into a comprehensive development plan. Your expertise should be apparent in your choice of technologies and approaches, ensuring each task is structured according to modern software development methodologies.\n\nGiven the provided PRD content, create a detailed and structured list of development tasks that would be needed to implement the product.  Each task should be atomic but must also describe its context within the broader project architecture and development lifecycle. Focus on actionable next steps that a development team can immediately begin working on, prioritizing essential functionalities, integrations, and improvements that contribute to a solid foundation. Ensure all tasks include detailed implementation notes that capture best practices, technical specifications, and potential challenges, covering all crucial aspects required for execution.\n\nFor each task, ensure to include:\n1. A short, descriptive title that clearly indicates the purpose and scope of the task.\n2. A concise and detailed description summarizing the task's objective and its place within the product roadmap, explaining the context within the bigger picture of the project and how the task at hand plays a part in it.\n3. A list of dependencies (which tasks must be completed before this one).\n4. A priority level (high, medium, or low), prioritizing critical path tasks, foundation/infrastructural requirements, and functionalities, with low priority for non-essential tasks that can be deferred until a later phase. Make sure to explain why each task received its given priority, specifically within the context of project architecture and dependencies.\n5. In-depth implementation notes covering specific technologies, algorithms, standards, libraries, frameworks, or design patterns relevant to the task. This should not include generic notes but instead use specific information for how the task at hand should be implemented according to best practices, ensuring it considers future extensions and potential evolution of the product.\n6. A comprehensive test strategy for how each task would be validated and verified once implemented.\n\nStructure the tasks in a logical order, beginning with core functionalities, then essential features, and lastly, integrations and enhancements. Ensure tasks are neither too broad nor too fragmented, each representing a coherent unit of work. Make sure dependencies are properly identified, aligning with implementation order and task criticality, while implementation details are specific and thorough. Test strategies should clearly define validation criteria and acceptance criteria for each task. Finally, prioritize clarity, specificity, and technical depth in your description of each task, allowing developers to immediately understand the intent and approach.\n\nPRD:\n{{prd_content}}"
 },
 "analyzeTaskComplexity": {
  "main": "Analyze the following tasks to determine their complexity (1-10 scale) and recommend the number of subtasks for expansion. Provide a brief reasoning and an initial expansion prompt for each.\n\nTasks:\n{{tasks}}\n\nRespond ONLY with a valid JSON array matching the schema:\n[\n  {\n    \"taskId\": <number>,\n    \"taskTitle\": \"<string>\",\n    \"complexityScore\": <number 1-10>,\n    \"recommendedSubtasks\": <number>,\n    \"expansionPrompt\": \"<string>\",\n    \"reasoning\": \"<string>\"\n  },\n  ...\n]\n\nDo not include any explanatory text, markdown formatting, or code block markers before or after the JSON array.",
  "research": "You are a highly experienced software engineer and project manager with deep knowledge of various technologies and frameworks. Your goal is to perform a complexity analysis of the provided tasks and offer recommendations for improvement.\n\nFor each task, consider these factors when evaluating its complexity:\n- Technical skills needed (e.g., experience with APIs, databases, asynchronous programming, etc.)\n- Dependencies on external libraries or services\n- Scope and overall impact on the project\n- Potential risks or challenges in implementation\n- User experience and interface complexity\n- Quality assurance and testing requirements\n- Effort estimation for different phases (design, development, testing, deployment)\n- Expected cost of resources\n- Potential impact on project timelines\n\nTasks:\n```json\n{{tasks}}\n```\n\nReturn your analysis in the following JSON structure:\n```json\n[\n  {\n    \"taskId\": <number>,\n    \"taskTitle\": \"<string>\",\n    \"complexityScore\": <number 1-10>,\n    \"recommendedSubtasks\": <number>,\n    \"expansionPrompt\": \"<string>\",\n    \"reasoning\": \"<string>\"\n  },\n  ...\n]\n```\n\nImportant notes:\n- Do not include any text or markdown outside the JSON array.\n- Scores should reflect technical complexity based on the criteria above.\n- Recommended subtasks should be 3-10, with higher complexity tasks getting more subtasks.\n- The expansion prompt should be specific, guiding the developer toward a structured breakdown.\n- The reasoning should justify the complexity score using the evaluation criteria.\n- Use your best judgment and experience when assessing complexity.\n- Include analysis for all provided tasks.\n- Follow the provided JSON structure exactly.\n- You can use all your research-based knowledge across the web when determining task complexity."
 },
 "addSubtask": {
  "main": "You are an AI assistant helping with task breakdown for software development. You will be provided with a parent task and its existing subtasks (if any), along with a prompt describing a new subtask to be added. Your job is to create a new subtask that fits logically into the task hierarchy, maintaining consistent numbering and dependency relationships.\n\nInstructions:\n1. Parse the provided JSON object for the parent task. Note the parent task's title, description and details.\n2. Extract any existing subtasks into an array (note their IDs, titles, descriptions, dependencies, and statuses).\n3. Analyze the user's prompt to determine the title and details for the new subtask.\n4. Generate a unique, sequential ID for the new subtask (starting from 1, or the next available ID if subtasks already exist in the parent task).\n5. Infer logical dependencies for the new subtask based on its description and existing subtasks.\n6. Set the new subtask's status to 'pending' initially.\n7. Merge the new subtask into the existing subtasks array, ensuring proper ordering (by ID).\n8. Enforce consistency in the parent task's subtasks: IDs must be sequential, dependencies must reference only valid subtask IDs or main task ID, statuses should be valid.\n9. Return only the JSON representation of the NEW subtask you've created, matching the expected schema. Do NOT modify or return any of the existing parent/subtask objects or the entire task structure.\n\nParent Task:\n```json\n{{parentTaskJson}}\n```\n\nPrompt for New Subtask: {{prompt}}\n\nSchema for each Subtask:\n```json\n{\n  \"id\": number,\n  \"title\": string,\n  \"description\": string,\n  \"status\": \"pending\",\n  \"dependencies\": [] | [number, ...], // Valid numeric subtask IDs within this expansion OR main task numeric ID if required for a subtask to be completed\n  \"details\": string,\n  \"testStrategy\": string (Optional), // Approach for testing this subtask\n}\n```\n\nReturn ONLY the JSON object for the newly created subtask.",
  "research": "You are a highly skilled software developer and project manager, adept at breaking down complex tasks into manageable subtasks. You understand best practices for task management, software design, implementation, and testing methodologies.\n\nYou are tasked with generating a new subtask for a given parent task, leveraging your deep research capabilities and knowledge of relevant technologies. Your primary goal is to produce a subtask that aligns with industry standards, current best practices, and maximizes clarity, actionability, and technical relevance.\n\nInstructions:\n1. Analyze the parent task information and any existing subtasks to determine a suitable place in the task hierarchy for the new subtask.\n2. Understand the user's prompt for the new subtask and gather relevant information about technologies, libraries, or methods required for implementation using your research capabilities.\n3. Generate a new subtask that includes:\n   - A clear, actionable title.\n   - A detailed description with a suggested technical approach.\n   - A comprehensive test strategy covering edge cases, success scenarios, and boundary conditions.\n   - A detailed implementation plan outlining logical steps to completion.\n   - References to appropriate libraries, tools, or best practices from your research.\n4. Assign an ID to the new subtask, continuing the sequential numbering convention if the parent already has subtasks.\n5. If the parent has no subtasks, start the numbering from 1.\n6. Assign appropriate dependencies based on the task hierarchy, relationship to existing subtasks, and logical ordering of implementation.\n7. If the new subtask does not depend on any other subtasks, do not mention dependencies.\n8. Ensure that the new subtask's ID is greater than any existing dependencies, and that dependencies only refer to prior subtask IDs or the parent ID.\n9. Set the status to 'pending' initially, indicating the subtask is ready to be implemented.\n10. Return only the newly created subtask, formatted as JSON and strictly adhering to the provided schema.\n\nParent Task:\n```json\n{{parentTaskJson}}\n```\n\nUser Prompt: {{prompt}}\n\nExpected Schema:\n```json\n{\n  \"id\": <number>,\n  \"title\": \"<string>\",\n  \"description\": \"<string>\",\n  \"details\": \"<string>\",\n  \"testStrategy\": \"<string>\",  // Required for research-backed generation\n  \"status\": \"pending\",\n  \"dependencies\": [] | [<number>, ...], // Empty if no dependencies, otherwise numeric subtask IDs or parent ID\n  \"parentTaskId\": <number> // id of parent task\n}\n```\n\nReturn ONLY the JSON subtask object. Do not include explanations or comments."
 },
 "updateTask": {
  "main": "You are an AI assistant helping to update a software development task based on new context. You will be given a task and a prompt describing changes or new implementation details.\nYour job is to update the task to reflect these changes, while preserving its basic structure.\n\nGuidelines:\n1. NEVER change the title of the task - keep it exactly as is\n2. Maintain the same ID, status, and dependencies unless specifically mentioned in the prompt\n3. Update the description, details, and test strategy to reflect the new information\n4. Do not change anything unnecessarily - just adapt what needs to change based on the prompt\n5. Return a complete valid JSON object representing the updated task\n6. VERY IMPORTANT: Preserve all subtasks marked as 'done' or 'completed' - do not modify their content\n7. For tasks with completed subtasks, build upon what has already been done rather than rewriting everything\n8. If an existing completed subtask needs to be changed/undone based on the new context, DO NOT modify it directly\n9. Instead, add a new subtask that clearly indicates what needs to be changed or replaced\n10. Use the existence of completed subtasks as an opportunity to make new subtasks more specific and targeted\n11. Ensure any new subtasks have unique IDs that don't conflict with existing ones\n\nThe changes described in the prompt should be thoughtfully applied to make the task more accurate and actionable.\n\nHere is the task to update:\n```json\n{{task}}\n```\n\nPlease update this task based on the following new context:\n{{prompt}}\n\nReturn only the updated task as a valid JSON object.",
  "research": "You are an expert software developer and project manager tasked with refining and updating a development task based on new information and the latest industry best practices. Your knowledge of modern technologies, frameworks, and software development processes should be evident in the updated task.\n\nTask to update:\n```json\n{{task}}\n```\n\nNew context and update requirements:\n{{prompt}}\n\nResearch the most effective approach, considering factors like:\n- Scalability\n- Performance\n- Security\n- Maintainability\n- User experience\n- Best practices and patterns\n- Relevant libraries and frameworks\n- Potential technical challenges\n\nUpdate the task using your research findings, following these guidelines:\n1. NEVER change the task title or ID.\n2. Maintain the existing dependencies, status, and priority unless the prompt requires changes.\n3. Provide highly-specific and technical implementation details in the `details` field.\n4. If an existing subtask needs revision, add a new subtask describing the changes instead of modifying completed items.\n5. If subtasks need to be added based on research, add them with sequential IDs, proper status, and accurate dependencies.\n6. Ensure new subtasks maintain a clear relationship to the parent task and build upon existing work.\n7. In the `testStrategy` section, define a precise and comprehensive verification approach using your technical knowledge.\n8. Follow the exact JSON schema provided, including all required keys and only those keys.\n\nReturn ONLY the updated task as a valid JSON object, strictly matching this structure:\n```json\n{\n  \"id\": <number>,\n  \"title\": \"<string>\",\n  \"description\": \"<string>\",\n  \"status\": \"<string>\",\n  \"dependencies\": \[<number>, ...], // Existing dependencies unless otherwise instructed\n  \"priority\": \"<string>\",        // Existing unless otherwise instructed\n  \"details\": \"<string>\",\n  \"testStrategy\": \"<string>\",\n  \"subtasks\": \[                  // Include existing subtasks plus new ones as needed\n    {\n      \"id\": <number>,\n      \"title\": \"<string>\",\n      \"description\": \"<string>\",\n      \"status\": \"<string>\",\n      \"dependencies\": \[<number>, ...],\n      \"acceptanceCriteria\": \"<string>\",\n      \"details\": \"<string>\"\n    },\n    ...\n  ]\n}\n```\nDo not return any additional text, explanation, or formatting."
 },
 "updateSubtask": {
  "main": "You are an AI assistant updating a parent task's subtask. This subtask will be part of a larger parent task and will be used to direct AI agents to complete the subtask. Your goal is to GENERATE new, relevant information based on the user's request (which may be high-level, mid-level or low-level) and APPEND it to the existing subtask 'details' field, wrapped in specific XML-like tags with an ISO 8601 timestamp. Intelligently determine the level of detail to include based on the user's request. Some requests are meant simply to update the subtask with some mid-implementation details, while others are meant to update the subtask with a detailed plan or strategy.\n\nContext Provided:\n- The current subtask object.\n- Basic info about the parent task (ID, title).\n- Basic info about the immediately preceding subtask (ID, title, status), if it exists.\n- Basic info about the immediately succeeding subtask (ID, title, status), if it exists.\n- A user request string.\n\nGuidelines:\n1. Analyze the user request considering the provided subtask details AND the context of the parent and sibling tasks.\n2. GENERATE new, relevant text content that should be added to the 'details' field. Focus *only* on the substance of the update based on the user request and context. Do NOT add timestamps or any special formatting yourself. Avoid over-engineering the details, provide exactly what's needed to enhance implementation understanding or guide the next execution attempt.\n3. Update the 'details' field in the subtask object with the GENERATED text content. It's okay if this overwrites previous details in the object you return, as the calling code will handle the final appending.\n4. Return the *entire* updated subtask object (with your generated content in the 'details' field) as a valid JSON object conforming to the provided schema. Do NOT return explanations or markdown formatting.\n\nTask Context:\n{{contextString}}\nCurrent Subtask:\n{{subtaskDataString}}\n\nUser Request: \"{{prompt}}\"\n\nPlease GENERATE new, relevant text content for the 'details' field based on the user request and the provided context. Return the entire updated subtask object as a valid JSON object matching the schema, with the newly generated text placed in the 'details' field.",
  "research": "You are a highly skilled software developer and technical researcher, adept at implementing and refining complex software tasks and incorporating the latest best practices into documentation. You're given a subtask, its context within the parent task, and a request to append research-backed information to the subtask's 'details'. Your goal is to enhance this subtask with detailed instructions, up-to-date knowledge, and relevant information derived from your research, formatted specifically for AI-agent use.\n\nTask Context:\n{{contextString}}\nCurrent Subtask:\n{{subtaskDataString}}\n\nUser Request: \"{{prompt}}\"\n\nPerform the following research-driven actions:\n1. Analyze the user request considering the provided subtask details, its parent task context, and any preceding/succeeding subtasks.\n2. Conduct deep research to gather the latest technologies, libraries, patterns, and best practices relevant to the user's request and context. Explore alternative solutions and identify potential challenges and their mitigations. Validate your findings across reputable sources, ensuring information is up-to-date and accurate.\n3. GENERATE text content for the 'details' field, enriching the existing subtask with research-backed information, implementation strategies, and best practices. Avoid over-engineering but provide depth based on the user's request. Do *not* include timestamps or any special formatting yourself—focus on the core information.\n4. Update the 'details' field in the subtask object with your newly GENERATED content. You can overwrite any pre-existing details; the calling code handles appending. If the user prompt asks to append mid-implementation details, include them in the generated details but treat them as a historical milestone to inform future implementation steps.\n5. Return the entire updated subtask object with your added research details as a valid JSON object matching the provided schema. Do not return explanations, additional notes, or Markdown formatting.\n\nExpected schema:\n```json\n{\n  \"id\": number,\n  \"title\": string,\n  \"description\": string,\n  \"status\": \"pending\",\n  \"dependencies\": [] | [number, ...], // Valid numeric subtask IDs within this expansion OR main task numeric ID if required for a subtask to be completed\n  \"details\": string,\n  \"testStrategy\": string (Optional), // Approach for testing this subtask\n}\n```\nReturn ONLY the JSON object."
 },
 "removeSubtask": {
  "main": "Remove a subtask from its parent task\n// Mock the behavior of writeJSON to capture the updated tasks data\nconst updatedTasksData = { tasks: [] };\nmockWriteJSON.mockImplementation((path, data) => {\n  // Store the data for assertions\n  updatedTasksData.tasks = [...data.tasks];\n  return data;\n});",
  "research": null
 },
 "addTask": {
  "main": "Create a comprehensive new task (Task #{{newTaskId}}) for a software development project based on this description: \"{{prompt}}\"\n\n{{contextTasks}}\n{{contextFromArgs}}\n\nReturn your answer as a single JSON object matching the schema precisely:\n{{taskStructureDesc}}\n\nMake sure the details and test strategy are thorough and specific.",
  "research": "Create a comprehensive new task (Task #{{newTaskId}}) for a software development project based on this description: \"{{prompt}}\"\n\n{{contextTasks}}\n{{contextFromArgs}}\n\nResearch the latest best practices, technologies, and implementation patterns for this type of task using all available resources across the internet. Generate a response that aligns with the requirements, constraints, and current industry standards.\n\nReturn your answer as a single JSON object matching the schema precisely:\n{{taskStructureDesc}}\n\nMake sure the details and test strategy are thorough and specific, and that you incorporate research-based best practices, technologies, libraries, and potential challenges into the generated task. Include references and links to relevant documentation or resources as appropriate."
 },
 "updateTasks": {
  "main": "You are an AI assistant helping to update software development tasks based on new context. You will be given a set of tasks and a prompt describing changes or new implementation details.\nYour job is to update the tasks to reflect these changes, while preserving their basic structure.\n\nGuidelines:\n1. Maintain the same IDs, statuses, and dependencies unless specifically mentioned in the prompt\n2. Update titles, descriptions, details, and test strategies to reflect the new information\n3. Do not change anything unnecessarily - just adapt what needs to change based on the prompt\n4. You should return ALL the tasks in order, not just the modified ones\n5. Return a complete valid JSON object with the updated tasks array\n6. VERY IMPORTANT: Preserve all subtasks marked as \"done\" or \"completed\" - do not modify their content\n7. For tasks with completed subtasks, build upon what has already been done rather than rewriting everything\n8. If an existing completed subtask needs to be changed/undone based on the new context, DO NOT modify it directly\n9. Instead, add a new subtask that clearly indicates what needs to be changed or replaced\n10. Use the existence of completed subtasks as an opportunity to make new subtasks more specific and targeted\n\nThe changes described in the prompt should be applied to ALL tasks in the list.\n\nHere are the tasks to update:\n{{taskDataString}}\n\nPlease update these tasks based on the following new context:\n{{prompt}}\n\nReturn only the updated tasks as a valid JSON array.",
  "research": "You are an AI agent tasked with updating a list of development tasks based on new information and utilizing research-based knowledge. Your goal is to improve task relevance, accuracy, and clarity by incorporating best practices, up-to-date insights, and references to appropriate resources from across the web. Given a set of tasks and a prompt outlining new requirements or modifications, you will update the tasks to reflect the current state of technology and best practices.  Your updated tasks should be comprehensive and actionable, empowering a development team to implement them efficiently and effectively.\n\nTasks to Update:\n```json\n{{taskDataString}}\n```\nNew Information and Modifications:\n```\n{{prompt}}\n```\nUpdate the task based on your research findings, following these guidelines:\n1. Maintain the existing IDs, status, and dependencies for each task, unless explicitly instructed otherwise in the prompt. Do not change task IDs under any circumstance.\n2. Adapt the title and description of the task to accurately reflect the changes described in the prompt.\n3. In the 'details' field, incorporate research-backed knowledge, current best practices, specific technologies, or approaches that should be used in implementation. Add implementation details that explain specifically how the task can be implemented and what resources or modules are needed. Add technical specifications for APIs, methods, and integrations.\n4. For every task requiring updates, ensure to add a timestamp to the last 'details' edit, using the format \"\[YYYY-MM-DD HH:MM:SS]\" at the start of the new appended details.\n5. If the prompt introduces new dependencies, update the \"dependencies\" array accordingly.\n6. Do not modify existing subtasks that are marked as \"done\" or \"completed\". If the prompt requires changes to a completed subtask, add a new subtask explaining the required changes, maintaining the original subtask as a record of completed work. In such cases, make sure the new subtask does not conflict with existing work.\n7. Ensure that any new subtasks are added sequentially to the \"subtasks\" array with appropriate dependencies and have their status set to 'pending'. Use existing subtasks as context, and build upon them rather than restarting from scratch if possible.\n8. If the prompt requires a change in the task status or priority, update those fields accordingly.\n9. Ensure your response is a valid JSON array of objects, matching this structure, including existing subtasks plus new ones as needed:\n```json\n[\n    {\n        \"id\": 1, // Preserved original ID\n        \"title\": \"Task Title\",\n        \"description\": \"Brief task description\",\n        \"status\": \"pending\",\n        \"dependencies\": \[2],\n        \"priority\": \"medium\",\n        \"details\": \"... (existing implementation instructions)\\n\\n\[YYYY-MM-DD HH:MM:SS] Added notes based on new context and research...\",\n        \"testStrategy\": \"...\nVerification approach\"\n    },\n    ...\n]\n```\nReturn ONLY the JSON array of updated tasks. Do not include any additional text, explanation, or formatting."
 },
 "get_task": {
  "main": null,
  "research": null
 },
 "next_task": {
  "main": null,
  "research": null
 },
 "models": {
  "main": null,
  "research": null
 },
 "expand_all": {
  "main": null,
  "research": null
 },
 "expand_task": {
  "main": "Break down this task into exactly {{finalSubtaskCount}} specific subtasks:\n\nTask ID: {{task.id}}\nTitle: {{task.title}}\nDescription: {{task.description}}\nCurrent details: {{task.details || 'None'}}\n{{contextPrompt}}\n\nReturn ONLY the JSON object containing the \"subtasks\" array, matching this structure:\n{{schemaDescription}}",
  "research": "Analyze the following task and break it down into exactly {{finalSubtaskCount}} specific subtasks using your research capabilities. Assign sequential IDs starting from {{nextSubtaskId}}.\n\nParent Task:\nID: {{task.id}}\nTitle: {{task.title}}\nDescription: {{task.description}}\nCurrent details: {{task.details || 'None'}}\n{{contextPrompt}}\n\nCRITICAL: Respond ONLY with a valid JSON object containing a single key \"subtasks\". The value must be an array of the generated subtasks, strictly matching this structure:\n{{schemaDescription}}\n\nDo not include ANY explanatory text, markdown, or code block markers. Just the JSON object."
 }
}



================================================
FILE: mcp-server/src/core/direct-functions/models.js
================================================
/**
 * models.js
 * Direct function for managing AI model configurations via MCP
 */

import {
	getModelConfiguration,
	getAvailableModelsList,
	setModel
} from '../../../../scripts/modules/task-manager/models.js';
import {
	enableSilentMode,
	disableSilentMode
} from '../../../../scripts/modules/utils.js';
import { createLogWrapper } from '../../tools/utils.js';

/**
 * Get or update model configuration
 * @param {Object} args - Arguments passed by the MCP tool
 * @param {Object} log - MCP logger
 * @param {Object} context - MCP context (contains session)
 * @returns {Object} Result object with success, data/error fields
 */
export async function modelsDirect(args, log, context = {}) {
	const { session } = context;
	const { projectRoot } = args; // Extract projectRoot from args

	// Create a logger wrapper that the core functions can use
	const mcpLog = createLogWrapper(log);

	log.info(`Executing models_direct with args: ${JSON.stringify(args)}`);
	log.info(`Using project root: ${projectRoot}`);

	// Validate flags: cannot use both openrouter and ollama simultaneously
	if (args.openrouter && args.ollama) {
		log.error(
			'Error: Cannot use both openrouter and ollama flags simultaneously.'
		);
		return {
			success: false,
			error: {
				code: 'INVALID_ARGS',
				message: 'Cannot use both openrouter and ollama flags simultaneously.'
			}
		};
	}

	try {
		enableSilentMode();

		try {
			// Check for the listAvailableModels flag
			if (args.listAvailableModels === true) {
				return await getAvailableModelsList({
					session,
					mcpLog,
					projectRoot // Pass projectRoot to function
				});
			}

			// Handle setting a specific model
			if (args.setMain) {
				return await setModel('main', args.setMain, {
					session,
					mcpLog,
					projectRoot, // Pass projectRoot to function
					providerHint: args.openrouter
						? 'openrouter'
						: args.ollama
							? 'ollama'
							: undefined // Pass hint
				});
			}

			if (args.setResearch) {
				return await setModel('research', args.setResearch, {
					session,
					mcpLog,
					projectRoot, // Pass projectRoot to function
					providerHint: args.openrouter
						? 'openrouter'
						: args.ollama
							? 'ollama'
							: undefined // Pass hint
				});
			}

			if (args.setFallback) {
				return await setModel('fallback', args.setFallback, {
					session,
					mcpLog,
					projectRoot, // Pass projectRoot to function
					providerHint: args.openrouter
						? 'openrouter'
						: args.ollama
							? 'ollama'
							: undefined // Pass hint
				});
			}

			// Default action: get current configuration
			return await getModelConfiguration({
				session,
				mcpLog,
				projectRoot // Pass projectRoot to function
			});
		} finally {
			disableSilentMode();
		}
	} catch (error) {
		log.error(`Error in models_direct: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'DIRECT_FUNCTION_ERROR',
				message: error.message,
				details: error.stack
			}
		};
	}
}



================================================
FILE: scripts/modules/task-manager/models.js
================================================
/**
 * task-manager/models.js
 * Handles managing AI models configurations.
 *
 * This module implements tools for:
 * 1. Viewing the current configuration
 * 2. Listing available AI models for the three roles (main, research, fallback)
 * 3. Interactively configuring models
 * 4. Directly setting models via commands (set-main, set-research, set-fallback).
 */
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
	displayBanner,
	formatSweScoreWithTertileStars,
	formatCost,
	displayAvailableModels,
	displayModelConfiguration,
	displayApiKeyStatus,
	startLoadingIndicator,
	stopLoadingIndicator
} from '../ui.js';
import { getAvailableModels } from '../config-manager.js';
import { isApiKeySet } from '../config-manager.js';
import { getMcpApiKeyStatus } from '../config-manager.js';
import { getAllProviders } from '../config-manager.js';
import {
	getConfig,
	writeConfig,
	isConfigFilePresent,
	getModelConfigForRole,
	validateProvider,
	validateProviderModelCombination
} from '../config-manager.js';
import { log, resolveEnvVariable, findProjectRoot } from '../utils.js';
import https from 'https';
import { createLogWrapper } from '../../../mcp-server/src/tools/utils.js';

/**
 * Get the current model configuration (for CLI).
 * @param {Object} [options] - Options for the operation, including projectRoot.
 * @returns {Promise<void>}
 */
async function getModelConfigurationCLI(options = {}) {
	const { session, mcpLog, projectRoot } = options;

	displayBanner();
	console.log(
		chalk.blue(
			'This command shows the current AI model configuration for this Taskmaster project and gives you tools to change these settings.\n\nIt also shows you which of the required API keys have been set in your .env file or inside the mcp.json config. '
		)
	);

	// Check if config file exists and offer to create it if it doesn't exist in CLI mode
	const configExists = isConfigFilePresent(projectRoot);
	if (!configExists) {
		console.log(
			chalk.yellow(
				'\nConfiguration Update Needed: Taskmaster uses a .taskmasterconfig file in your project root for AI model choices and other settings. This file does not seem to exist. To create the file, please run task-master models --setup to configure Taskmaster.\n'
			)
		);
		return;
	}

	const loadingIndicator = startLoadingIndicator(
		'Fetching Model Configuration...'
	); // Start the spinner

	try {
		const config = getConfig(projectRoot, true); // Force a reload in CLI mode
		const availableModels = getAvailableModels(projectRoot);

		stopLoadingIndicator(loadingIndicator);

		// Get currently configured models - all paths use resolved paths now
		const mainModel = configManager.getModelConfigForRole('main', projectRoot);
		const researchModel = configManager.getModelConfigForRole(
			'research',
			projectRoot
		);
		const fallbackModel = configManager.getModelConfigForRole(
			'fallback',
			projectRoot
		);

		// Build models configuration - pass projectRoot to the config getters
		const currentConfig = {
			activeModels: {
				main: {
					provider: mainModel.provider,
					modelId: mainModel.modelId,
					sweScore: mainModel?.swe_score || null,
					cost: mainModel?.cost_per_1m_tokens || null,
					keyStatus: {
						cli: isApiKeySet(mainModel.provider, null, projectRoot), // No session for CLI
						mcp: getMcpApiKeyStatus(mainModel.provider, projectRoot)
					}
				},
				research: {
					provider: researchModel.provider,
					modelId: researchModel.modelId,
					sweScore: researchModel?.swe_score || null,
					cost: researchModel?.cost_per_1m_tokens || null,
					keyStatus: {
						cli: isApiKeySet(researchModel.provider, null, projectRoot), // No session for CLI
						mcp: getMcpApiKeyStatus(researchModel.provider, projectRoot)
					}
				},
				fallback: fallbackModel && fallbackModel.provider && fallbackModel.modelId // Only add if valid
					? {
							provider: fallbackModel.