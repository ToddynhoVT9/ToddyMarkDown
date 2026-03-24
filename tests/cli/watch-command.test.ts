import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runWatchCommand } from '../../src/cli/watch-command.js';
import * as compileCmd from '../../src/cli/compile-command.js';
import chokidar from 'chokidar';

vi.mock('chokidar');
vi.mock('../../src/cli/compile-command.js');

describe('runWatchCommand', () => {
  let mockWatcherOn: any;
  let mockWatcherClose: any;
  let compileSpy: any;

  beforeEach(() => {
    mockWatcherOn = vi.fn();
    mockWatcherClose = vi.fn().mockResolvedValue(undefined);
    vi.mocked(chokidar.watch).mockReturnValue({
      on: mockWatcherOn,
      close: mockWatcherClose,
    } as any);

    compileSpy = vi.spyOn(compileCmd, 'runCompileCommand').mockResolvedValue({
      filesProcessed: 1,
      filesWithErrors: 0,
      fatalError: null,
      exitCode: 0,
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'on').mockImplementation(((event: string, cb: any) => {
      // ignore mapping to not crash the vitest runner actually
      return process;
    }) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executa compilação inicial', () => {
    runWatchCommand({ target: 'src/', out: 'dist' });
    expect(compileSpy).toHaveBeenCalledWith({ target: 'src/', out: 'dist', config: undefined });
  });

  it('recompila o arquivo alterado em evento change', async () => {
    runWatchCommand({ target: 'src/', out: 'dist' });
    
    // Simulate a change event
    const changeCallback = mockWatcherOn.mock.calls.find((call: any[]) => call[0] === 'change')[1];
    
    // reset from initial compilation
    compileSpy.mockClear(); 

    await changeCallback('src/arquivo.tmd');
    
    expect(compileSpy).toHaveBeenCalledWith({
      target: 'src/arquivo.tmd',
      out: 'dist',
      config: undefined,
    });
  });

  it('recompila todo o alvo quando config muda', async () => {
    runWatchCommand({ target: 'src/', out: 'dist' });
    
    const changeCallback = mockWatcherOn.mock.calls.find((call: any[]) => call[0] === 'change')[1];
    compileSpy.mockClear(); 

    await changeCallback('.config.tmd.json');
    
    expect(compileSpy).toHaveBeenCalledWith({
      target: 'src/', // recompiles the whole target
      out: 'dist',
      config: undefined,
    });
  });

  it('não encerra processo em erro de parsing', async () => {
    runWatchCommand({ target: 'src/', out: 'dist' });
    
    // Simulate a throw from compileCommand
    compileSpy.mockRejectedValueOnce(new Error('Fatal exception'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const changeCallback = mockWatcherOn.mock.calls.find((call: any[]) => call[0] === 'change')[1];
    
    await expect(changeCallback('src/arquivo.tmd')).resolves.not.toThrow();
    expect(errSpy).toHaveBeenCalled();
  });
});
