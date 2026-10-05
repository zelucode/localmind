import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolsPage } from './ToolsPage';
import { INITIAL_AI_TOOLS } from '../data/defaultTools';
import { AITool } from '../types';

const rows = () => Array.from(document.querySelectorAll('[id^="row-tool-"]'));
const cards = () => Array.from(document.querySelectorAll('[id^="card-tool-"]'));

function setup(tools: AITool[] = INITIAL_AI_TOOLS.map((t) => ({ ...t, isFavorite: false }))) {
  const props = {
    tools,
    defaultLaunchSearch: false,
    onToggleFavorite: vi.fn(),
    onDeleteCustom: vi.fn(),
    onLaunchQuickSearch: vi.fn(),
    onOpenConfigExporter: vi.fn(),
    onOpenRateLimitMatrix: vi.fn(),
    onOpenAddModal: vi.fn(),
  };
  render(<ToolsPage {...props} />);
  return props;
}

describe('ToolsPage list', () => {
  it('shows every tool as a row by default', () => {
    setup();
    expect(rows()).toHaveLength(INITIAL_AI_TOOLS.length);
    expect(screen.getByText(/Showing/)).toHaveTextContent(`${INITIAL_AI_TOOLS.length} of ${INITIAL_AI_TOOLS.length}`);
  });

  it('filters by search text', async () => {
    setup();
    await userEvent.type(screen.getByPlaceholderText(/Filter tools/), 'perplexity');
    expect(rows().length).toBeGreaterThan(0);
    expect(rows().length).toBeLessThan(INITIAL_AI_TOOLS.length);
    expect(rows().every((r) => /perplexity/i.test(r.textContent || ''))).toBe(true);
  });

  it('"Can edit local files" keeps only local agents and IDE plugins', async () => {
    setup();
    await userEvent.click(document.getElementById('pill-filter-local-files')!);
    const expected = INITIAL_AI_TOOLS.filter((t) => t.scope === 'local-agent' || t.scope === 'ide-plugin');
    expect(rows()).toHaveLength(expected.length);
    expect(expected.length).toBeGreaterThan(0);
  });

  it('"No credit card", "Live web search" and "Free API key" filters match the data', async () => {
    setup();
    await userEvent.click(document.getElementById('pill-filter-no-cc')!);
    expect(rows()).toHaveLength(INITIAL_AI_TOOLS.filter((t) => !t.freeTier.creditCardRequired).length);
    await userEvent.click(document.getElementById('pill-filter-web-search')!);
    expect(rows()).toHaveLength(
      INITIAL_AI_TOOLS.filter((t) => !t.freeTier.creditCardRequired && t.freeTier.hasWebSearch).length
    );
    await userEvent.click(document.getElementById('pill-filter-free-key')!);
    expect(rows()).toHaveLength(
      INITIAL_AI_TOOLS.filter(
        (t) => !t.freeTier.creditCardRequired && t.freeTier.hasWebSearch && t.freeTier.allowCustomApiKey
      ).length
    );
  });

  it('filters by category and shows per-category counts', async () => {
    setup();
    const web = INITIAL_AI_TOOLS.filter((t) => t.category === 'web-llm').length;
    const btn = document.getElementById('tab-cat-web-llm')!;
    expect(btn).toHaveTextContent(String(web));
    await userEvent.click(btn);
    expect(rows()).toHaveLength(web);
  });

  it('sorts by name', async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText('Sort tools'), 'name');
    const names = rows().map((r) => r.querySelector('.font-semibold')!.textContent!);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('shows an empty state with reset and add actions', async () => {
    const props = setup();
    await userEvent.type(screen.getByPlaceholderText(/Filter tools/), 'zzzzzzzz-no-match');
    expect(screen.getByText(/No AI platforms match/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add Tool' }));
    expect(props.onOpenAddModal).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Reset All Filters' }));
    expect(rows()).toHaveLength(INITIAL_AI_TOOLS.length);
  });

  it('toggles favorites from a row', async () => {
    const props = setup();
    await userEvent.click(screen.getAllByRole('button', { name: /^Favorite / })[0]);
    expect(props.onToggleFavorite).toHaveBeenCalledWith(INITIAL_AI_TOOLS[0].id);
  });

  it('lets only custom tools be deleted', async () => {
    const tools = INITIAL_AI_TOOLS.map((t, i) => ({ ...t, isFavorite: false, isCustom: i === 0 }));
    const props = setup(tools);
    const deletes = screen.getAllByRole('button', { name: /^Delete / });
    expect(deletes).toHaveLength(1);
    await userEvent.click(deletes[0]);
    expect(props.onDeleteCustom).toHaveBeenCalledWith(tools[0].id);
  });

  it('opens the config exporter only for tools that support it, with the tool id', async () => {
    const props = setup();
    const exportable = screen.getAllByRole('button', { name: /^Export config for / });
    expect(exportable.length).toBeGreaterThan(0);
    expect(exportable.length).toBeLessThan(INITIAL_AI_TOOLS.length);
    await userEvent.click(exportable[0]);
    expect(props.onOpenConfigExporter).toHaveBeenCalledTimes(1);
    expect(typeof props.onOpenConfigExporter.mock.calls[0][0]).toBe('string');
  });

  it('gives coding agents a config exporter (regression: category typo)', () => {
    setup();
    const agents = INITIAL_AI_TOOLS.filter((t) => t.category === 'coding-agent');
    expect(agents.length).toBeGreaterThan(0);
    for (const a of agents) {
      expect(document.getElementById(`btn-config-exporter-${a.id}`)).toBeInTheDocument();
    }
  });
});

describe('ToolsPage view toggle', () => {
  it('switches to the grid and remembers the choice', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(rows()).toHaveLength(0);
    expect(cards()).toHaveLength(INITIAL_AI_TOOLS.length);
    expect(localStorage.getItem('localmind_tools_view_v1')).toBe('grid');
  });

  it('starts in the remembered view', () => {
    localStorage.setItem('localmind_tools_view_v1', 'grid');
    setup();
    expect(cards()).toHaveLength(INITIAL_AI_TOOLS.length);
  });

  it('ignores a corrupt stored view', () => {
    localStorage.setItem('localmind_tools_view_v1', 'carousel');
    setup();
    expect(rows()).toHaveLength(INITIAL_AI_TOOLS.length);
  });
});
