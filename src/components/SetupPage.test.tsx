import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/backend', () => ({
  listSetupRecipes: vi.fn(),
  detectSetupTools: vi.fn(),
  installSetupTool: vi.fn(),
  cancelSetupInstall: vi.fn(),
}));
vi.mock('../lib/errorLog', () => ({ logInfo: vi.fn(), logWarn: vi.fn(), logError: vi.fn() }));

import { cancelSetupInstall, detectSetupTools, installSetupTool, listSetupRecipes } from '../lib/backend';
import { BackendUnavailableError } from '../lib/tauri';
import { SetupPage } from './SetupPage';

const list = vi.mocked(listSetupRecipes);
const detect = vi.mocked(detectSetupTools);
const install = vi.mocked(installSetupTool);
const cancel = vi.mocked(cancelSetupInstall);

const recipes = [
  { id: 'ollama', name: 'Ollama', description: 'Local models', command: 'winget install --id Ollama.Ollama', requires: ['winget'], manualUrl: 'https://ollama.com/download' },
  { id: 'gemini-cli', name: 'Gemini CLI', description: 'Google agent', command: 'npm install -g @google/gemini-cli', requires: ['Node.js (npm)'], manualUrl: 'https://example.com/g' },
  { id: 'manual-only', name: 'Manual Tool', description: 'No installer here', command: null, requires: [], manualUrl: 'https://example.com/m' },
];

const found = (status: 'installed' | 'not-installed' | 'missing-requirement', extra = {}) => ({ status, version: null, location: null, missing: null, ...extra });

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue(recipes);
  detect.mockResolvedValue([
    { id: 'ollama', ...found('installed', { version: '0.5.1' }) },
    { id: 'gemini-cli', ...found('not-installed') },
    { id: 'manual-only', ...found('not-installed') },
  ]);
});

const card = (id: string) => document.getElementById(`setup-recipe-${id}`)!;
const installBtn = (id: string) => within(card(id)).getByRole('button', { name: 'Install' });

async function confirmInstall(id: string) {
  await userEvent.click(installBtn(id));
  await userEvent.click(screen.getByRole('button', { name: 'Run it' }));
}

describe('SetupPage', () => {
  it('shows the real status of each tool and the exact command', async () => {
    render(<SetupPage />);
    expect(await screen.findByText('Installed')).toBeInTheDocument();
    expect(screen.getByText('Version 0.5.1')).toBeInTheDocument();
    expect(screen.getByText('npm install -g @google/gemini-cli')).toBeInTheDocument();
    expect(detect).toHaveBeenCalledWith(['ollama', 'gemini-cli', 'manual-only']);
  });

  it('says where a tool was found when it has no version to show', async () => {
    detect.mockResolvedValue([
      { id: 'ollama', ...found('installed', { location: 'C:\Users\me\.lmstudio\bin\lms.exe' }) },
      { id: 'gemini-cli', ...found('not-installed') },
      { id: 'manual-only', ...found('not-installed') },
    ]);
    render(<SetupPage />);
    expect(await screen.findByText('Found at C:\Users\me\.lmstudio\bin\lms.exe')).toBeInTheDocument();
  });

  it('offers Install only for tools that are missing and have a command', async () => {
    render(<SetupPage />);
    await screen.findByText('Installed');
    expect(within(card('ollama')).queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
    expect(installBtn('gemini-cli')).toBeInTheDocument();
    expect(card('manual-only')).toHaveTextContent(/No one-click install on this system/);
    expect(within(card('manual-only')).queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
  });

  it('asks for confirmation showing the command, and does not run anything until confirmed', async () => {
    render(<SetupPage />);
    await screen.findByText('Installed');
    await userEvent.click(installBtn('gemini-cli'));
    expect(screen.getByRole('alertdialog', { name: /Confirm installing Gemini CLI/ })).toHaveTextContent('npm install -g @google/gemini-cli');
    expect(install).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(install).not.toHaveBeenCalled();
  });

  it('runs the install by id after confirming, shows the output, then checks again', async () => {
    install.mockImplementation(async (_id, onLine) => {
      onLine('added 1 package');
      return 'Gemini CLI was installed.';
    });
    render(<SetupPage />);
    await screen.findByText('Installed');
    await confirmInstall('gemini-cli');
    expect(install).toHaveBeenCalledWith('gemini-cli', expect.any(Function));
    expect(await screen.findByText(/Gemini CLI was installed/)).toBeInTheDocument();
    expect(screen.getByLabelText('Gemini CLI install output')).toHaveTextContent('added 1 package');
    await waitFor(() => expect(detect).toHaveBeenCalledTimes(2));
  });

  it('shows a failed install with its reason', async () => {
    install.mockRejectedValue(new Error('The install failed (exit code 1).'));
    render(<SetupPage />);
    await screen.findByText('Installed');
    await confirmInstall('gemini-cli');
    expect(await screen.findByText('The install failed (exit code 1).')).toBeInTheDocument();
  });

  it('can cancel a running install', async () => {
    let finish: (v: string) => void = () => {};
    install.mockImplementation(() => new Promise<string>((res) => (finish = res)));
    cancel.mockResolvedValue();
    render(<SetupPage />);
    await screen.findByText('Installed');
    await confirmInstall('gemini-cli');
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel install' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    finish('done');
  });

  it('tells the user what is missing instead of offering a doomed install', async () => {
    detect.mockResolvedValue([
      { id: 'ollama', ...found('not-installed') },
      { id: 'gemini-cli', ...found('missing-requirement', { missing: 'Node.js (npm)' }) },
      { id: 'manual-only', ...found('not-installed') },
    ]);
    render(<SetupPage />);
    expect((await screen.findAllByText(/Needs Node\.js \(npm\)/)).length).toBeGreaterThan(0);
    expect(installBtn('gemini-cli')).toBeDisabled();
  });

  it('says so plainly outside the desktop app, without faking any status', async () => {
    list.mockRejectedValue(new BackendUnavailableError('Tool setup'));
    render(<SetupPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Tool setup needs the LocalMind desktop app.');
    expect(screen.queryByText('Installed')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
  });
});
