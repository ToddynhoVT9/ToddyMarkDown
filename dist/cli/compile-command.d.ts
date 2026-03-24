export interface CompileCommandOptions {
    target: string;
    out: string;
    config?: string;
}
export interface CompileCommandResult {
    filesProcessed: number;
    filesWithErrors: number;
    fatalError: string | null;
    exitCode: 0 | 1 | 2;
}
/**
 * Executa o fluxo principal do comando tmd compile.
 * Agnóstico de process.exit, retorna exitCode explícito.
 */
export declare function runCompileCommand(options: CompileCommandOptions): Promise<CompileCommandResult>;
