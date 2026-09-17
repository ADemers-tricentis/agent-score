export const JSON_PREVIEW_MAX_NODES = 2_000;
export const JSON_PREVIEW_MAX_DEPTH = 20;
export const JSON_PREVIEW_MAX_CHARACTERS = 65_536;
export const JSON_PREVIEW_MAX_STRING_CHARACTERS = 4_096;

export type JsonPreviewValue =
  | null
  | boolean
  | number
  | string
  | JsonPreviewValue[]
  | { [key: string]: JsonPreviewValue };

export interface JsonPreview {
  value: JsonPreviewValue;
  truncated: boolean;
}

interface Budget {
  nodes: number;
  characters: number;
  truncated: boolean;
  seen: WeakSet<object>;
}

const TRUNCATED = "… preview truncated";

export function createJsonPreview(value: unknown): JsonPreview {
  const budget: Budget = {
    nodes: 0,
    characters: 0,
    truncated: false,
    seen: new WeakSet<object>(),
  };
  return { value: project(value, 0, budget), truncated: budget.truncated };
}

function project(value: unknown, depth: number, budget: Budget): JsonPreviewValue {
  if (budget.nodes >= JSON_PREVIEW_MAX_NODES) return truncate(budget);
  budget.nodes += 1;

  if (typeof value === "string") return projectString(value, depth, budget);
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value !== "object") return boundedString(String(value), budget);
  if (depth >= JSON_PREVIEW_MAX_DEPTH) return truncate(budget);
  if (budget.seen.has(value)) {
    budget.truncated = true;
    return "[Circular]";
  }
  budget.seen.add(value);

  if (Array.isArray(value)) {
    const output: JsonPreviewValue[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (budget.nodes >= JSON_PREVIEW_MAX_NODES) {
        budget.truncated = true;
        break;
      }
      output.push(project(value[index], depth + 1, budget));
    }
    return output;
  }

  const output = Object.create(null) as Record<string, JsonPreviewValue>;
  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    if (!consumeCharacters(key.length, budget) || budget.nodes >= JSON_PREVIEW_MAX_NODES) {
      budget.truncated = true;
      break;
    }
    output[key] = project((value as Record<string, unknown>)[key], depth + 1, budget);
  }
  return output;
}

function projectString(value: string, depth: number, budget: Budget): JsonPreviewValue {
  const remaining = JSON_PREVIEW_MAX_CHARACTERS - budget.characters;
  const examined = value.slice(0, Math.max(0, remaining));
  budget.characters += examined.length;
  if (examined.length < value.length) budget.truncated = true;

  const trimmed = examined.trim();
  if (examined.length === value.length && looksLikeJson(trimmed)) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return project(parsed, depth, budget);
    } catch {
      // Invalid embedded JSON remains a string.
    }
  }
  return displayString(examined, value.length, budget);
}

function looksLikeJson(value: string): boolean {
  return (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]")) ||
    (value.length > 1 && value.startsWith('"') && value.endsWith('"'))
  );
}

function boundedString(value: string, budget: Budget): string {
  const remaining = JSON_PREVIEW_MAX_CHARACTERS - budget.characters;
  const examined = value.slice(0, Math.max(0, remaining));
  budget.characters += examined.length;
  return displayString(examined, value.length, budget);
}

function displayString(value: string, originalLength: number, budget: Budget): string {
  if (value.length <= JSON_PREVIEW_MAX_STRING_CHARACTERS && value.length === originalLength) {
    return value;
  }
  budget.truncated = true;
  return `${value.slice(0, JSON_PREVIEW_MAX_STRING_CHARACTERS - 1)}…`;
}

function consumeCharacters(count: number, budget: Budget): boolean {
  const remaining = JSON_PREVIEW_MAX_CHARACTERS - budget.characters;
  budget.characters += Math.min(count, Math.max(0, remaining));
  if (count <= remaining) return true;
  budget.truncated = true;
  return false;
}

function truncate(budget: Budget): string {
  budget.truncated = true;
  return TRUNCATED;
}
