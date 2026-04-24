#!/usr/bin/env node
/**
 * Standalone MCP Server for wiki plugin.
 * Exposes wiki tools via stdio transport.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { CallToolRequest, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { registerStandaloneShutdownHandlers } from './standalone-shutdown.js';
import { allTools, buildListToolsResponse } from './tool-registry.js';

type StandaloneCallToolHandler = (
  request: CallToolRequest,
) => Promise<CallToolResult>;

type StandaloneCallToolRequestRegistrar = (
  schema: typeof CallToolRequestSchema,
  handler: StandaloneCallToolHandler,
) => void;

const server = new Server(
  {
    name: 'wiki',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => buildListToolsResponse());

const setStandaloneCallToolRequestHandler =
  (server.setRequestHandler as unknown as StandaloneCallToolRequestRegistrar).bind(server);

setStandaloneCallToolRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = allTools.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler((args ?? {}) as unknown);
    return {
      content: result.content,
      isError: result.isError ?? false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

async function gracefulShutdown(signal: string): Promise<void> {
  const forceExitTimer = setTimeout(() => process.exit(1), 5_000);
  forceExitTimer.unref();

  console.error(`wiki MCP Server: received ${signal}, shutting down...`);

  try {
    await server.close();
  } catch {
    // Best-effort
  }
  process.exit(0);
}

registerStandaloneShutdownHandlers({
  onShutdown: gracefulShutdown,
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('wiki MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
