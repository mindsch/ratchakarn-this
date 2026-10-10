import type { McpClient, McpTool } from "./llm/mcp";

/** Connected MCP clients keyed by url|authorization, kept for the page lifetime. */
export const mcpCache = new Map<string, { client: McpClient; tools: McpTool[] }>();
