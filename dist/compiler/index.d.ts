import type { CompileResult, TMDConfig } from '../types/index.js';
export interface CompileOptions {
    tmdPath: string;
    outDir: string;
    config: TMDConfig;
}
/**
 * Orquestrador principal do compilador.
 * Conecta todos os módulos e produz .html + .css em disco.
 *
 * Nunca chama process.exit — erros fatais propagam como Error.
 * Retorna CompileResult mesmo quando há erros de parsing.
 */
export declare function compile(options: CompileOptions): Promise<CompileResult>;
