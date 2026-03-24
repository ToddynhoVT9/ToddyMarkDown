/**
 * Slugify — shared between compiler and CLI.
 *
 * Regras (tmd-cli-spec v1.1):
 * 1. minúsculas
 * 2. NFD + remover marcas diacríticas
 * 3. espaços → -
 * 4. remover não-ASCII, não-número, não-'-'
 * 5. colapsar múltiplos '-'
 * 6. remover '-' nas bordas
 */
export declare function slugify(input: string): string;
