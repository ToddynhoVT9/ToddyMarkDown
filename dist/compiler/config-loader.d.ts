import type { TMDConfig } from '../types/index.js';
/**
 * Config padrão vazio — config-resolver aplicará defaults hardcoded.
 */
export declare const EMPTY_CONFIG: TMDConfig;
/**
 * Carrega .config.tmd.json.
 *
 * - configPath undefined → busca .config.tmd.json no cwd
 * - Não encontrado → retorna EMPTY_CONFIG silenciosamente
 * - Encontrado mas JSON inválido → lança Error
 * - configPath explícito não encontrado → lança Error
 */
export declare function loadConfig(configPath?: string): TMDConfig;
