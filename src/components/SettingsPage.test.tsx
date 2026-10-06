import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('../lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/backend')>()),
  decryptBackup: vi.fn(),
}));

import { decryptBackup } from '../lib/backend';
import { SettingsPage } from './SettingsPage';
import { defaultThemePresets } from '../theme';

function setup(over: Partial<React.ComponentProps<typeof SettingsPage>> = {}) {
  const props: React.ComponentProps<typeof SettingsPage> = {
    currentThemeId: defaultThemePresets[0].id,
    onSelectTheme: vi.fn(),
    onSetCustomAccentColor: vi.fn(),
    onSaveCustomPresets: vi.fn(),
    allPresets: defaultThemePresets,
    showScopeExplainer: true,
    onToggleShowScopeExplainer: vi.fn(),
    defaultLaunchSearch: false,
    onToggleDefaultLaunchSearch: vi.fn(),
    onExportBackup: vi.fn(),
    onImportBackup: vi.fn(),
    onResetFactoryDefaults: vi.fn(),
    onBackToDashboard: vi.fn(),
    customToolsCount: 3,
    savedKeysCount: 2,
    bookmarksCount: 270,
    ...over,
  };
  const view = render(<SettingsPage {...props} />);
  const rerender = (next: Partial<React.ComponentProps<typeof SettingsPage>>) => view.rerender(<SettingsPage {...props} {...next} />);
  return Object.assign(props, { rerender });
}

const goTo = (name: RegExp) => userEvent.click(screen.getByRole('button', { name }));

const BACKUP = JSON.stringify({
  version: 2,
  exportedAt: '2026-10-06T12:00:00Z',
  customTools: [{ id: 't1', name: 'My Tool', url: 'https://tool.example.com' }],
  keys: [{ id: 'k1', provider: 'groq', key: 'gsk_x' }],
  bookmarks: [{ title: 'Alpha', url: 'https://alpha.example.com' }],
});

const chooseBackup = async (text: string, name = 'backup.json') => {
  const input = screen.getByLabelText('Backup file') as HTMLInputElement;
  await userEvent.upload(input, new File([text], name, { type: 'application/json' }));
};

beforeEach(() => vi.clearAllMocks());

describe('Settings: themes and preferences', () => {
  it('selects a theme with the mouse and with the keyboard', async () => {
    const props = setup();
    const card = screen.getByRole('button', { name: `${defaultThemePresets[1].name} theme` });
    await userEvent.click(card);
    expect(props.onSelectTheme).toHaveBeenLastCalledWith(defaultThemePresets[1].id);
    const other = screen.getByRole('button', { name: `${defaultThemePresets[2].name} theme` });
    other.focus();
    await userEvent.keyboard('{Enter}');
    expect(props.onSelectTheme).toHaveBeenLastCalledWith(defaultThemePresets[2].id);
    await userEvent.keyboard(' ');
    expect(props.onSelectTheme).toHaveBeenCalledTimes(3);
  });

  it('marks the active theme', () => {
    setup({ currentThemeId: defaultThemePresets[1].id });
    expect(screen.getByRole('button', { name: `${defaultThemePresets[1].name} theme` })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: `${defaultThemePresets[0].name} theme` })).toHaveAttribute('aria-pressed', 'false');
  });

  it('filters themes by mode', async () => {
    setup();
    const lights = defaultThemePresets.filter((p) => p.mode === 'light');
    const darks = defaultThemePresets.filter((p) => p.mode === 'dark');
    expect(lights.length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: /^light$/i }));
    expect(screen.getByRole('button', { name: `${lights[0].name} theme` })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `${darks[0].name} theme` })).not.toBeInTheDocument();
  });

  it('sets and resets the accent color', async () => {
    const props = setup({ customAccentColor: '#f7591f' });
    await userEvent.click(screen.getByTitle('Cyber Teal'));
    expect(props.onSetCustomAccentColor).toHaveBeenLastCalledWith('#14b8a6');
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(props.onSetCustomAccentColor).toHaveBeenLastCalledWith(undefined);
  });

  it('wires every preference toggle to its handler', async () => {
    const props = setup({ onToggleShowOnStartup: vi.fn(), onToggleShowLoadingAnimation: vi.fn() });
    await goTo(/preferences/i);
    await userEvent.click(screen.getByRole('checkbox', { name: /open the prompt box/i }));
    expect(props.onToggleDefaultLaunchSearch).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByRole('checkbox', { name: /scope explainer/i }));
    expect(props.onToggleShowScopeExplainer).toHaveBeenCalledWith(false);
    await userEvent.click(screen.getByRole('checkbox', { name: /welcome screen/i }));
    expect(props.onToggleShowOnStartup).toHaveBeenCalledWith(false);
    await userEvent.click(screen.getByRole('checkbox', { name: /loading animation/i }));
    expect(props.onToggleShowLoadingAnimation).toHaveBeenCalledWith(false);
  });

  it('opens the startup screen preview and replays the loading animation', async () => {
    const props = setup({ onOpenStartupScreen: vi.fn(), onReplayLoadingAnimation: vi.fn() });
    await goTo(/preferences/i);
    await userEvent.click(screen.getByRole('button', { name: /preview screen/i }));
    expect(props.onOpenStartupScreen).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: /replay|preview animation|play/i }));
    expect(props.onReplayLoadingAnimation).toHaveBeenCalledOnce();
  });
});

describe('Settings: custom theme JSON', () => {
  const editor = () => screen.getByRole('textbox') as HTMLTextAreaElement;

  it('rejects a broken preset with a message that names it, and does not save', async () => {
    const props = setup();
    await goTo(/custom|json/i);
    fireEvent.change(editor(), { target: { value: JSON.stringify([{ id: 'oops' }]) } });
    await userEvent.click(screen.getByRole('button', { name: /save & apply/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Preset 1 ("oops") needs a non-empty "name".');
    expect(props.onSaveCustomPresets).not.toHaveBeenCalled();
  });

  it('shows the JSON parser error for bad syntax, in the error style', async () => {
    setup();
    await goTo(/custom|json/i);
    fireEvent.change(editor(), { target: { value: '[ {' } });
    await userEvent.click(screen.getByRole('button', { name: /save & apply/i }));
    const msg = screen.getByRole('alert');
    expect(msg).toHaveTextContent(/invalid json/i);
    expect(msg.className).toMatch(/rose/);
    expect(msg.className).not.toMatch(/emerald/);
  });

  it('saves valid presets and confirms in the success style', async () => {
    const props = setup();
    await goTo(/custom|json/i);
    await userEvent.click(screen.getByRole('button', { name: /save & apply/i }));
    expect(props.onSaveCustomPresets).toHaveBeenCalledWith(defaultThemePresets);
    expect(screen.getByRole('status')).toHaveTextContent(/saved/i);
  });

  it('follows the saved presets when they change, but never overwrites text the user is editing', async () => {
    const view = setup();
    await goTo(/custom|json/i);
    view.rerender({ allPresets: [defaultThemePresets[1]] });
    expect(JSON.parse(editor().value).map((p: { id: string }) => p.id)).toEqual([defaultThemePresets[1].id]);

    fireEvent.change(editor(), { target: { value: '[ my edit' } });
    view.rerender({ allPresets: [defaultThemePresets[2]] });
    expect(editor().value).toBe('[ my edit');
  });
});

describe('Settings: backup export', () => {
  it('leaves API keys out by default and warns when they are included', async () => {
    const props = setup();
    await goTo(/data|backup/i);
    await userEvent.click(screen.getByRole('button', { name: /download backup json/i }));
    expect(props.onExportBackup).toHaveBeenLastCalledWith({ includeKeys: false });

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /include my api keys \(2\)/i }));
    // Including keys switches the passphrase on, so there is no plain-text warning yet.
    expect(screen.getByRole('checkbox', { name: /protect the file with a passphrase/i })).toBeChecked();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /protect the file with a passphrase/i }));
    expect(screen.getByRole('note')).toHaveTextContent(/plain text/i);
    await userEvent.click(screen.getByRole('button', { name: /download backup json/i }));
    expect(props.onExportBackup).toHaveBeenLastCalledWith({ includeKeys: true });
  });
});

describe('Settings: passphrase-protected backup export', () => {
  const openProtected = async (over: Partial<React.ComponentProps<typeof SettingsPage>> = {}) => {
    const props = setup(over);
    await goTo(/data|backup/i);
    await userEvent.click(screen.getByRole('checkbox', { name: /protect the file with a passphrase/i }));
    return props;
  };
  const type = async (pass: string, again = pass) => {
    await userEvent.type(screen.getByLabelText('Backup passphrase'), pass);
    await userEvent.type(screen.getByLabelText('Confirm passphrase'), again);
  };

  it('masks the passphrase by default, with an eye toggle, and warns there is no recovery', async () => {
    await openProtected();
    expect(screen.getByLabelText('Backup passphrase')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm passphrase')).toHaveAttribute('type', 'password');
    expect(screen.getByText(/no recovery/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show passphrase' }));
    expect(screen.getByLabelText('Backup passphrase')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /download protected backup/i })).toBeInTheDocument();
  });

  it('refuses a short passphrase and a mismatch, and exports nothing', async () => {
    const props = await openProtected();
    await type('short');
    await userEvent.click(screen.getByRole('button', { name: /download protected backup/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);
    await userEvent.clear(screen.getByLabelText('Backup passphrase'));
    await userEvent.clear(screen.getByLabelText('Confirm passphrase'));
    await type('long enough one', 'long enough two');
    await userEvent.click(screen.getByRole('button', { name: /download protected backup/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);
    expect(props.onExportBackup).not.toHaveBeenCalled();
  });

  it('hands the passphrase to the export, reports it, and clears the fields', async () => {
    const props = await openProtected();
    await type('correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: /download protected backup/i }));
    expect(props.onExportBackup).toHaveBeenLastCalledWith({ includeKeys: false, passphrase: 'correct horse battery' });
    expect(await screen.findByRole('status')).toHaveTextContent(/cannot be recovered/i);
    expect(screen.getByLabelText('Backup passphrase')).toHaveValue('');
  });

  it('shows the reason when the protected export fails, and does not claim success', async () => {
    await openProtected({ onExportBackup: vi.fn().mockRejectedValue(new Error('Protecting the backup needs the LocalMind desktop app.')) });
    await type('correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: /download protected backup/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('needs the LocalMind desktop app');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Settings: restoring a passphrase-protected backup', () => {
  const PROTECTED = JSON.stringify({ format: 'localmind-encrypted-backup', version: 1, data: 'x' });
  const decrypt = vi.mocked(decryptBackup);

  it('asks for the passphrase instead of reading the file, and restores nothing yet', async () => {
    const props = setup();
    await goTo(/data|backup/i);
    await chooseBackup(PROTECTED, 'mine-encrypted.json');
    expect(await screen.findByText(/mine-encrypted\.json is protected with a passphrase/)).toBeInTheDocument();
    expect(screen.getByLabelText('Passphrase for this backup')).toHaveAttribute('type', 'password');
    expect(screen.queryByRole('button', { name: /restore and replace/i })).not.toBeInTheDocument();
    expect(props.onImportBackup).not.toHaveBeenCalled();
  });

  it('shows a wrong passphrase as an error and lets the user try again', async () => {
    decrypt.mockRejectedValueOnce(new Error('Wrong passphrase, or the file has been changed.'));
    decrypt.mockResolvedValueOnce(BACKUP);
    const props = setup();
    await goTo(/data|backup/i);
    await chooseBackup(PROTECTED);
    await userEvent.type(await screen.findByLabelText('Passphrase for this backup'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Open backup' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/wrong passphrase/i);
    expect(props.onImportBackup).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText('Passphrase for this backup'));
    await userEvent.type(screen.getByLabelText('Passphrase for this backup'), 'right one');
    await userEvent.click(screen.getByRole('button', { name: 'Open backup' }));
    expect(await screen.findByText(/1 custom tool • 1 API key • 1 bookmark/)).toBeInTheDocument();
    expect(decrypt).toHaveBeenLastCalledWith(PROTECTED, 'right one');
    await userEvent.click(screen.getByRole('button', { name: /restore and replace/i }));
    expect(props.onImportBackup).toHaveBeenCalledOnce();
  });

  it('cancel drops the locked file, and choosing another file replaces it', async () => {
    setup();
    await goTo(/data|backup/i);
    await chooseBackup(PROTECTED);
    await userEvent.click(await screen.findByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByLabelText('Passphrase for this backup')).not.toBeInTheDocument();
    await chooseBackup(PROTECTED);
    await screen.findByLabelText('Passphrase for this backup');
    await chooseBackup(BACKUP);
    expect(await screen.findByText(/1 custom tool • 1 API key • 1 bookmark/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Passphrase for this backup')).not.toBeInTheDocument();
  });
});

describe('Settings: restore a backup', () => {
  it('shows what the file contains and changes nothing until confirmed', async () => {
    const props = setup();
    await goTo(/data|backup/i);
    await chooseBackup(BACKUP);
    expect(await screen.findByText(/1 custom tool • 1 API key • 1 bookmark/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/replaces your current custom tools \(3\), API keys \(2\), bookmarks \(270\)/i);
    expect(props.onImportBackup).not.toHaveBeenCalled();
  });

  it('restores only after the user confirms, then reports what was restored', async () => {
    const props = setup();
    await goTo(/data|backup/i);
    await chooseBackup(BACKUP);
    await userEvent.click(await screen.findByRole('button', { name: /restore and replace/i }));
    expect(props.onImportBackup).toHaveBeenCalledOnce();
    expect(vi.mocked(props.onImportBackup).mock.calls[0][0]).toMatchObject({
      customTools: [expect.objectContaining({ id: 't1' })],
      keys: [expect.objectContaining({ key: 'gsk_x' })],
    });
    expect(screen.getByRole('status')).toHaveTextContent('Restored: 1 custom tool, 1 API key, 1 bookmark.');
  });

  it('cancel leaves everything as it was', async () => {
    const props = setup();
    await goTo(/data|backup/i);
    await chooseBackup(BACKUP);
    await userEvent.click(await screen.findByRole('button', { name: /^cancel$/i }));
    expect(props.onImportBackup).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /restore and replace/i })).not.toBeInTheDocument();
  });

  it('does not claim success for a file that is not a backup', async () => {
    const props = setup();
    await goTo(/data|backup/i);
    await chooseBackup('{"hello": "world"}');
    expect(await screen.findByRole('alert')).toHaveTextContent(/nothing LocalMind can restore/i);
    expect(screen.queryByText(/restored/i)).not.toBeInTheDocument();
    expect(props.onImportBackup).not.toHaveBeenCalled();
  });

  it('says what is wrong with a file that is not JSON', async () => {
    setup();
    await goTo(/data|backup/i);
    await chooseBackup('not json at all');
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a valid JSON file/i);
  });

  it('lists warnings about entries that were left out', async () => {
    setup();
    await goTo(/data|backup/i);
    await chooseBackup(JSON.stringify({ customTools: [{ id: 'x', name: 'bad', url: 'javascript:1' }], bookmarks: [{ title: 'a', url: 'https://a.com' }] }));
    expect(await screen.findByText(/1 custom tool\(s\) were left out/)).toBeInTheDocument();
  });
});

describe('Settings: reset', () => {
  it('names what will be deleted, including API keys, and needs a second click', async () => {
    const props = setup();
    await goTo(/data|backup/i);
    await userEvent.click(screen.getByRole('button', { name: /^reset tools, keys & themes$/i }));
    expect(props.onResetFactoryDefaults).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/3 custom tools, 2 saved API keys, your favorites, custom themes and preferences/i);

    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(props.onResetFactoryDefaults).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /^reset tools, keys & themes$/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, delete and reset/i }));
    expect(props.onResetFactoryDefaults).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
