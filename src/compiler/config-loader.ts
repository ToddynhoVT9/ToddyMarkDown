import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TMDConfig, TMDConfigTheme } from '../types/index.js';
import { VALID_THEMES } from './config-resolver.js';

/**
 * Config padrão vazio — config-resolver aplicará defaults hardcoded.
 */
export const EMPTY_CONFIG: TMDConfig = {
  defaultTheme:     '',
  defaultCompile:   '',
  themes:           {},
  allowExternalCSS: false,
};

// Whitelist de chaves válidas para overrides (nível 1)
const VALID_OVERRIDE_KEYS = new Set([
  'bg', 'surface', 'text', 'text-soft', 'accent',
  'border', 'font-body', 'font-heading', 'radius',
]);

// Tipos de bloco válidos para blocks (nível 2)
const VALID_BLOCK_TYPES = new Set([
  'explainer', 'note', 'warning', 'concept', 'aside',
  'pullquote', 'question', 'takeaway', 'timeline',
]);

// Propriedades válidas dentro de blocks[tipo]
const VALID_BLOCK_PROPS = new Set(['border-color', 'bg', 'marker-color']);

// Nomes de temas base — não podem ser usados como nomes de temas customizados
const BASE_THEME_NAMES: Set<string> = new Set(VALID_THEMES);

/**
 * Carrega .config.tmd.json.
 *
 * - configPath undefined → busca .config.tmd.json no cwd
 * - Não encontrado → retorna EMPTY_CONFIG silenciosamente
 * - Encontrado mas JSON inválido → lança Error
 * - configPath explícito não encontrado → lança Error
 */
export function loadConfig(configPath?: string): TMDConfig {
  const resolvedPath = configPath ?? path.join(process.cwd(), '.config.tmd.json');

  // Check existence
  if (!fs.existsSync(resolvedPath)) {
    if (configPath !== undefined) {
      throw new Error(`Config file not found: ${resolvedPath}`);
    }
    return { ...EMPTY_CONFIG };
  }

  // Read and parse
  let rawJSON: string;
  try {
    rawJSON = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read config file: ${resolvedPath}`);
  }

  let config: any;
  try {
    config = JSON.parse(rawJSON);
  } catch (err) {
    throw new Error(`Invalid JSON in config file: ${resolvedPath}`);
  }

  // Build TMDConfig
  const result: TMDConfig = {
    defaultTheme:     typeof config.defaultTheme === 'string' ? config.defaultTheme : '',
    defaultCompile:   typeof config.defaultCompile === 'string' ? config.defaultCompile : '',
    themes:           {},
    allowExternalCSS: config.allowExternalCSS === true,
  };

  // Validate themes
  if (config.themes && typeof config.themes === 'object') {
    for (const [name, themeDef] of Object.entries(config.themes as Record<string, any>)) {
      // Check name collision with base themes
      if (BASE_THEME_NAMES.has(name)) {
        throw new Error(`Custom theme name "${name}" collides with a base theme`);
      }

      validateTheme(name, themeDef as any, config.themes);
      result.themes[name] = themeDef as TMDConfigTheme;
    }

    // Check circular extends after all themes are loaded
    checkCircularExtends(result.themes);
  }

  return result;
}

function validateTheme(name: string, theme: any, allThemes: Record<string, any>): void {
  if (!theme || typeof theme !== 'object') {
    throw new Error(`Theme "${name}" is not a valid object`);
  }

  // Validate extends
  if (!theme.extends || typeof theme.extends !== 'string') {
    throw new Error(`Theme "${name}" is missing a valid "extends" field`);
  }

  const extendsTarget = theme.extends as string;
  if (!BASE_THEME_NAMES.has(extendsTarget) && !(extendsTarget in allThemes)) {
    throw new Error(`Theme "${name}" extends unknown theme "${extendsTarget}"`);
  }

  // Validate overrides (nível 1)
  if (theme.overrides) {
    for (const key of Object.keys(theme.overrides)) {
      if (!VALID_OVERRIDE_KEYS.has(key)) {
        throw new Error(`Theme "${name}" has invalid override key "${key}"`);
      }
    }
  }

  // Validate blocks (nível 2)
  if (theme.blocks) {
    for (const [blockType, blockProps] of Object.entries(theme.blocks as Record<string, any>)) {
      if (!VALID_BLOCK_TYPES.has(blockType)) {
        throw new Error(`Theme "${name}" has invalid block type "${blockType}"`);
      }
      if (blockProps && typeof blockProps === 'object') {
        for (const prop of Object.keys(blockProps)) {
          if (!VALID_BLOCK_PROPS.has(prop)) {
            throw new Error(`Theme "${name}" block "${blockType}" has invalid property "${prop}"`);
          }
        }
      }
    }
  }
}

function checkCircularExtends(themes: Record<string, TMDConfigTheme>): void {
  for (const name of Object.keys(themes)) {
    const visited = new Set<string>();
    let current = name;

    while (themes[current]) {
      if (visited.has(current)) {
        throw new Error(`Circular extends detected involving theme "${name}"`);
      }
      visited.add(current);
      current = themes[current].extends;
    }
  }
}
