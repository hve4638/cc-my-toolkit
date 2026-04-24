/**
 * Tool Registry for the wiki MCP Server.
 * Single source of truth for the tool surface exposed by standalone-server.ts.
 * Only wiki tools are registered here — plugin is wiki-specific.
 */

import { z } from 'zod';
import { wikiTools } from '../tools/wiki-tools.js';

export interface ToolDef {
  name: string;
  description: string;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  schema: z.ZodRawShape | z.ZodObject<z.ZodRawShape>;
  handler: (
    args: unknown,
  ) => Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }>;
}

export const allTools: ToolDef[] = [
  ...(wikiTools as unknown as ToolDef[]),
];

function zodTypeToJsonSchema(zodType: z.ZodTypeAny): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (!zodType || !zodType._def) {
    return { type: 'string' };
  }

  if (zodType instanceof z.ZodOptional) {
    return zodTypeToJsonSchema(zodType._def.innerType);
  }

  if (zodType instanceof z.ZodDefault) {
    const inner = zodTypeToJsonSchema(zodType._def.innerType);
    inner.default = zodType._def.defaultValue();
    return inner;
  }

  const description = zodType._def?.description;
  if (description) {
    result.description = description;
  }

  if (zodType instanceof z.ZodString) {
    result.type = 'string';
  } else if (zodType instanceof z.ZodNumber) {
    result.type = zodType._def?.checks?.some((c: { kind: string }) => c.kind === 'int')
      ? 'integer'
      : 'number';
  } else if (zodType instanceof z.ZodBoolean) {
    result.type = 'boolean';
  } else if (zodType instanceof z.ZodArray) {
    result.type = 'array';
    result.items = zodType._def?.type ? zodTypeToJsonSchema(zodType._def.type) : { type: 'string' };
  } else if (zodType instanceof z.ZodEnum) {
    result.type = 'string';
    result.enum = zodType._def?.values;
  } else if (zodType instanceof z.ZodObject) {
    return zodToJsonSchema(zodType.shape);
  } else if (zodType instanceof z.ZodRecord) {
    result.type = 'object';
    if (zodType._def?.valueType) {
      result.additionalProperties = zodTypeToJsonSchema(zodType._def.valueType);
    }
  } else {
    result.type = 'string';
  }

  return result;
}

export function zodToJsonSchema(schema: z.ZodRawShape | z.ZodObject<z.ZodRawShape>): {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
} {
  const rawShape = schema instanceof z.ZodObject ? schema.shape : schema;

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(rawShape)) {
    const zodType = value as z.ZodTypeAny;
    properties[key] = zodTypeToJsonSchema(zodType);

    const isOptional =
      zodType && typeof zodType.isOptional === 'function' && zodType.isOptional();
    if (!isOptional) {
      required.push(key);
    }
  }

  return { type: 'object', properties, required };
}

export interface ListToolsEntry {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required: string[] };
  annotations?: ToolDef['annotations'];
}

export function buildListToolsResponse(): { tools: ListToolsEntry[] } {
  return {
    tools: allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.schema),
      ...(tool.annotations ? { annotations: tool.annotations } : {}),
    })),
  };
}
