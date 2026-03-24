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
export function slugify(input) {
    return input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[_\s]+/g, '-') // spaces and underscores → -
        .replace(/[^a-z0-9-]/g, '') // remove non-ASCII, non-number, non-'-'
        .replace(/-{2,}/g, '-') // collapse multiple -
        .replace(/^-+|-+$/g, ''); // trim -
}
