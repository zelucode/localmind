import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScopeExplainer } from './ScopeExplainer';

describe('ScopeExplainer', () => {
  it('starts collapsed with the headline visible', () => {
    render(<ScopeExplainer />);
    expect(screen.getByRole('heading', { name: /Web vs\. Local Files/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button')[0]).toBeInTheDocument();
  });

  it('expands and collapses with its toggle button', async () => {
    const { container } = render(<ScopeExplainer />);
    const before = container.textContent!.length;
    await userEvent.click(screen.getAllByRole('button')[0]);
    const expanded = container.textContent!.length;
    expect(expanded).toBeGreaterThan(before);
    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(container.textContent!.length).toBe(before);
  });
});
