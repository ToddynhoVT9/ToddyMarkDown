export const DiagnosticCode = {
    // Erros estruturais
    FRONTMATTER_NOT_CLOSED: 'FRONTMATTER_NOT_CLOSED',
    LITERAL_BLOCK_NOT_CLOSED: 'LITERAL_BLOCK_NOT_CLOSED',
    BLOCK_NOT_CLOSED: 'BLOCK_NOT_CLOSED',
    STRAY_CLOSE: 'STRAY_CLOSE',
    NESTED_BLOCK: 'NESTED_BLOCK',
    UNKNOWN_TOKEN: 'UNKNOWN_TOKEN',
    TITLE_BRACKET_NOT_CLOSED: 'TITLE_BRACKET_NOT_CLOSED',
    EXTRA_TEXT_AFTER_TOKEN: 'EXTRA_TEXT_AFTER_TOKEN',
    // Erros de pullquote
    PULLQUOTE_NO_QUOTE: 'PULLQUOTE_NO_QUOTE',
    PULLQUOTE_EMPTY: 'PULLQUOTE_EMPTY',
    // Erros de imagem
    IMAGE_INVALID_MODE: 'IMAGE_INVALID_MODE',
    IMAGE_MISSING: 'IMAGE_MISSING',
    IMAGE_NO_CAPTION: 'IMAGE_NO_CAPTION',
    IMAGE_NO_SRC: 'IMAGE_NO_SRC',
    IMAGE_MULTIPLE: 'IMAGE_MULTIPLE',
    IMAGE_FILE_NOT_FOUND: 'IMAGE_FILE_NOT_FOUND',
    // Warnings
    WARN_UNKNOWN_FRONTMATTER_KEY: 'WARN_UNKNOWN_FRONTMATTER_KEY',
    WARN_EMPTY_TITLE: 'WARN_EMPTY_TITLE',
    WARN_EMPTY_BLOCK: 'WARN_EMPTY_BLOCK',
    WARN_PULLQUOTE_MULTI_AUTHOR: 'WARN_PULLQUOTE_MULTI_AUTHOR',
    WARN_TIMELINE_NO_EVENTS: 'WARN_TIMELINE_NO_EVENTS',
    // Warnings de temas e CSS externo
    WARN_CUSTOM_CSS_NOT_ALLOWED: 'WARN_CUSTOM_CSS_NOT_ALLOWED', // custom_css presente mas allowExternalCSS é false
    WARN_CUSTOM_CSS_NOT_FOUND: 'WARN_CUSTOM_CSS_NOT_FOUND', // arquivo referenciado não encontrado
    WARN_THEME_NAME_COLLISION: 'WARN_THEME_NAME_COLLISION', // tema customizado com mesmo nome de tema base
};
// Exit code derivado de diagnostics — nunca calculado ad-hoc em outros módulos
export function exitCodeFromDiagnostics(diagnostics) {
    return diagnostics.some(d => d.severity === 'error') ? 1 : 0;
    // Nota: exit code 2 é emitido apenas pela CLI para erros fatais de I/O
}
