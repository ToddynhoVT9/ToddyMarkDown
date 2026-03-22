export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Position {
  offset: number;  // offset de caractere desde o início do source normalizado (0-based)
  line:   number;  // linha (1-based)
  column: number;  // coluna (0-based)
}

export interface SourceRange {
  start: Position;  // inclusive — aponta para o primeiro caractere do range
  end:   Position;  // exclusive — aponta para o caractere imediatamente após o fim do range
                    // convenção adotada por CM6, LSP e tree-sitter
                    // ex: linha "<|\n" → end.offset = offset do '\n', não do '|'
}

export interface Diagnostic {
  severity:    DiagnosticSeverity;
  code:        string;
  message:     string;
  position:    SourceRange | null;  // null para diagnósticos sem localização no source
  filePath:    string;
  recoverable: boolean;
  // recoverable: true  -> warning or error that allows partial compilation
  // recoverable: false -> error that generated ErrorBlock; HTML is still emitted
  // exit code 2 is exclusive to CLI fatal I/O errors
}

export const DiagnosticCode = {
  // Erros estruturais
  FRONTMATTER_NOT_CLOSED:       'FRONTMATTER_NOT_CLOSED',
  LITERAL_BLOCK_NOT_CLOSED:     'LITERAL_BLOCK_NOT_CLOSED',
  BLOCK_NOT_CLOSED:             'BLOCK_NOT_CLOSED',
  STRAY_CLOSE:                  'STRAY_CLOSE',
  NESTED_BLOCK:                 'NESTED_BLOCK',
  UNKNOWN_TOKEN:                'UNKNOWN_TOKEN',
  TITLE_BRACKET_NOT_CLOSED:     'TITLE_BRACKET_NOT_CLOSED',
  EXTRA_TEXT_AFTER_TOKEN:       'EXTRA_TEXT_AFTER_TOKEN',
  // Erros de pullquote
  PULLQUOTE_NO_QUOTE:           'PULLQUOTE_NO_QUOTE',
  PULLQUOTE_EMPTY:              'PULLQUOTE_EMPTY',
  // Erros de imagem
  IMAGE_INVALID_MODE:           'IMAGE_INVALID_MODE',
  IMAGE_MISSING:                'IMAGE_MISSING',
  IMAGE_NO_CAPTION:             'IMAGE_NO_CAPTION',
  IMAGE_NO_SRC:                 'IMAGE_NO_SRC',
  IMAGE_MULTIPLE:               'IMAGE_MULTIPLE',
  IMAGE_FILE_NOT_FOUND:         'IMAGE_FILE_NOT_FOUND',
  // Warnings
  WARN_UNKNOWN_FRONTMATTER_KEY: 'WARN_UNKNOWN_FRONTMATTER_KEY',
  WARN_EMPTY_TITLE:             'WARN_EMPTY_TITLE',
  WARN_EMPTY_BLOCK:             'WARN_EMPTY_BLOCK',
  WARN_PULLQUOTE_MULTI_AUTHOR:  'WARN_PULLQUOTE_MULTI_AUTHOR',
  WARN_TIMELINE_NO_EVENTS:      'WARN_TIMELINE_NO_EVENTS',
  // Warnings de temas e CSS externo
  WARN_CUSTOM_CSS_NOT_ALLOWED:  'WARN_CUSTOM_CSS_NOT_ALLOWED',  // custom_css presente mas allowExternalCSS é false
  WARN_CUSTOM_CSS_NOT_FOUND:    'WARN_CUSTOM_CSS_NOT_FOUND',    // arquivo referenciado não encontrado
  WARN_THEME_NAME_COLLISION:    'WARN_THEME_NAME_COLLISION',    // tema customizado com mesmo nome de tema base
} as const;

export interface FrontmatterFields {
  title?:      string;
  subtitle?:   string;
  kicker?:     string;
  author?:     string;
  theme?:      string;   // undefined se ausente — NÃO substituir por 'essay' aqui
  compile?:    string;   // undefined se ausente — NÃO substituir por 'standalone' aqui
  custom_css?: string;   // nível 3 — ignorado se allowExternalCSS não estiver ativo no config
}

export type ImageMode = '*>' | '*>wrap' | '*<' | '*<wrap';

export interface MarkdownBlockNode    { type: 'MarkdownBlock';   raw: string;  position: SourceRange }
export interface LiteralBlockNode     { type: 'LiteralBlock';    raw: string;  position: SourceRange }
export interface TimelineEventNode    { type: 'TimelineEvent';   text: string; position: SourceRange }
export interface TimelineMarkdownNode { type: 'TimelineMarkdown'; raw: string; position: SourceRange }

export interface ContentBlockNode {
  type: 'ExplainerBlock' | 'AsideBlock' | 'NoteBlock' | 'WarningBlock'
       | 'QuestionBlock' | 'TakeawayBlock' | 'ConceptBlock';
  title:    string | null;
  content:  BodyNode[];
  position: SourceRange;
}

export interface PullQuoteBlockNode {
  type:     'PullQuoteBlock';
  title:    string | null;
  quote:    string;
  author:   string | null;
  position: SourceRange;
}

export interface TimelineBlockNode {
  type:     'TimelineBlock';
  title:    string | null;
  items:    (TimelineEventNode | TimelineMarkdownNode)[];
  position: SourceRange;
}

export interface ImageBlockNode {
  type:     'ImageBlock';
  mode:     ImageMode;
  title:    string | null;
  caption:  string;
  src:      string;
  content:  BodyNode[];
  position: SourceRange;
}

export interface ErrorBlockNode {
  type:        'ErrorBlock';
  raw:         string;
  diagnostics: Diagnostic[];
  position:    SourceRange;
}

export type BodyNode =
  | MarkdownBlockNode
  | LiteralBlockNode
  | ContentBlockNode
  | PullQuoteBlockNode
  | TimelineBlockNode
  | ImageBlockNode
  | ErrorBlockNode;

export interface DocumentNode {
  type:        'Document';
  frontmatter: FrontmatterFields;  // campos opcionais, sem defaults aplicados
  children:    BodyNode[];
  assets:      string[];           // caminhos originais de todas as imagens
}

export interface ParseResult {
  document:    DocumentNode;
  diagnostics: Diagnostic[];
}

// Nível 1 — whitelist de chaves permitidas em overrides (sem prefixo --tmd-)
export type ThemeOverrideKey =
  | 'bg' | 'surface' | 'text' | 'text-soft' | 'accent'
  | 'border' | 'font-body' | 'font-heading' | 'radius';

// Nível 2 — tipos de bloco válidos para customização
export type BlockType =
  | 'explainer' | 'note' | 'warning' | 'concept' | 'aside'
  | 'pullquote' | 'question' | 'takeaway' | 'timeline';

// Nível 2 — propriedades permitidas por bloco
export interface TMDConfigThemeBlock {
  'border-color'?:  string;  // todos os blocos de conteúdo
  'bg'?:            string;  // explainer, note, warning, concept, aside apenas
  'marker-color'?:  string;  // timeline apenas
}

export interface TMDConfigTheme {
  extends:   string;
  overrides?: Partial<Record<ThemeOverrideKey, string>>;  // nível 1
  blocks?:    Partial<Record<BlockType, TMDConfigThemeBlock>>;  // nível 2
}

export interface TMDConfig {
  defaultTheme:     string;
  defaultCompile:   string;
  themes:           Record<string, TMDConfigTheme>;
  allowExternalCSS?: boolean;  // nível 3 — opt-in explícito
}

export interface ResolvedConfig {
  theme:            string;                  // sempre string válida
  compile:          'standalone' | 'fragment';
  customThemes:     Record<string, TMDConfigTheme>;
  allowExternalCSS: boolean;
}

export interface CompileResult {
  slug:        string;
  htmlPath:    string;
  cssPath:     string;
  diagnostics: Diagnostic[];
}

// Exit code derivado de diagnostics — nunca calculado ad-hoc em outros módulos
export function exitCodeFromDiagnostics(diagnostics: Diagnostic[]): 0 | 1 {
  return diagnostics.some(d => d.severity === 'error') ? 1 : 0;
  // Nota: exit code 2 é emitido apenas pela CLI para erros fatais de I/O
}
