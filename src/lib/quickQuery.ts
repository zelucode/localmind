import { AITool } from '../types';
import { safeHttpUrl } from './bookmarkTransfer';

/** Longest link we are willing to open; browsers and servers start refusing somewhere past this. */
export const MAX_QUERY_URL_LENGTH = 8000;

export type QuickQueryPlan =
  /** No prompt typed: just open the tool. */
  | { kind: 'open'; url: string }
  /** The tool takes the prompt from the link. */
  | { kind: 'prefilled'; url: string }
  /** The tool cannot take a prompt from a link, so the prompt is copied and the tool opened. */
  | { kind: 'copy'; url: string; text: string; reason: 'no-prompt-link' | 'too-long' };

/** True when the tool's link template has a place for the prompt and is a web link. */
export function acceptsPromptLink(tool: Pick<AITool, 'quickSearchUrlTemplate'>): boolean {
  const t = tool.quickSearchUrlTemplate;
  return !!t && t.includes('{query}') && safeHttpUrl(t.replace(/\{query\}/g, 'x')) !== null;
}

/** Decide what "Launch" should do for this tool and prompt. Never drops the user's prompt silently. */
export function planQuickQuery(tool: Pick<AITool, 'url' | 'quickSearchUrlTemplate'>, query: string): QuickQueryPlan {
  const text = query.trim();
  if (!text) return { kind: 'open', url: tool.url };

  if (!acceptsPromptLink(tool)) return { kind: 'copy', url: tool.url, text, reason: 'no-prompt-link' };

  const url = tool.quickSearchUrlTemplate!.split('{query}').join(encodeURIComponent(text));
  if (url.length > MAX_QUERY_URL_LENGTH) return { kind: 'copy', url: tool.url, text, reason: 'too-long' };
  return { kind: 'prefilled', url };
}
