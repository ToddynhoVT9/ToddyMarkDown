export type DiagnosticSeverity = "error" | "warning" | "info";
export interface Diagnostic {
    severity: DiagnosticSeverity;
    code: string;
    message: string;
    line: number | null;
    filePath: string;
    recoverable: boolean;
}
export declare const DiagnosticCode: {
    readonly FRONTMATTER_NOT_CLOSED: "FRONTMATTER_NOT_CLOSED";
    readonly LITERAL_BLOCK_NOT_CLOSED: "LITERAL_BLOCK_NOT_CLOSED";
    readonly BLOCK_NOT_CLOSED: "BLOCK_NOT_CLOSED";
    readonly STRAY_CLOSE: "STRAY_CLOSE";
    readonly NESTED_BLOCK: "NESTED_BLOCK";
    readonly UNKNOWN_TOKEN: "UNKNOWN_TOKEN";
    readonly TITLE_BRACKET_NOT_CLOSED: "TITLE_BRACKET_NOT_CLOSED";
    readonly EXTRA_TEXT_AFTER_TOKEN: "EXTRA_TEXT_AFTER_TOKEN";
    readonly PULLQUOTE_NO_QUOTE: "PULLQUOTE_NO_QUOTE";
    readonly PULLQUOTE_EMPTY: "PULLQUOTE_EMPTY";
    readonly IMAGE_INVALID_MODE: "IMAGE_INVALID_MODE";
    readonly IMAGE_MISSING: "IMAGE_MISSING";
    readonly IMAGE_NO_CAPTION: "IMAGE_NO_CAPTION";
    readonly IMAGE_NO_SRC: "IMAGE_NO_SRC";
    readonly IMAGE_MULTIPLE: "IMAGE_MULTIPLE";
    readonly IMAGE_FILE_NOT_FOUND: "IMAGE_FILE_NOT_FOUND";
    readonly WARN_UNKNOWN_FRONTMATTER_KEY: "WARN_UNKNOWN_FRONTMATTER_KEY";
    readonly WARN_EMPTY_TITLE: "WARN_EMPTY_TITLE";
    readonly WARN_EMPTY_BLOCK: "WARN_EMPTY_BLOCK";
    readonly WARN_PULLQUOTE_MULTI_AUTHOR: "WARN_PULLQUOTE_MULTI_AUTHOR";
    readonly WARN_TIMELINE_NO_EVENTS: "WARN_TIMELINE_NO_EVENTS";
    readonly WARN_CUSTOM_CSS_NOT_ALLOWED: "WARN_CUSTOM_CSS_NOT_ALLOWED";
    readonly WARN_CUSTOM_CSS_NOT_FOUND: "WARN_CUSTOM_CSS_NOT_FOUND";
    readonly WARN_THEME_NAME_COLLISION: "WARN_THEME_NAME_COLLISION";
};
export interface FrontmatterFields {
    title?: string;
    subtitle?: string;
    kicker?: string;
    author?: string;
    theme?: string;
    compile?: string;
    custom_css?: string;
}
export type ImageMode = "*>" | "*>wrap" | "*<" | "*<wrap";
export interface MarkdownBlockNode {
    type: "MarkdownBlock";
    raw: string;
}
export interface LiteralBlockNode {
    type: "LiteralBlock";
    raw: string;
}
export interface TimelineEventNode {
    type: "TimelineEvent";
    text: string;
}
export interface TimelineMarkdownNode {
    type: "TimelineMarkdown";
    raw: string;
}
export interface ContentBlockNode {
    type: "ExplainerBlock" | "AsideBlock" | "NoteBlock" | "WarningBlock" | "QuestionBlock" | "TakeawayBlock" | "ConceptBlock";
    title: string | null;
    content: BodyNode[];
}
export interface PullQuoteBlockNode {
    type: "PullQuoteBlock";
    title: string | null;
    quote: string;
    author: string | null;
}
export interface TimelineBlockNode {
    type: "TimelineBlock";
    title: string | null;
    items: (TimelineEventNode | TimelineMarkdownNode)[];
}
export interface ImageBlockNode {
    type: "ImageBlock";
    mode: ImageMode;
    title: string | null;
    caption: string;
    src: string;
    content: BodyNode[];
}
export interface ErrorBlockNode {
    type: "ErrorBlock";
    raw: string;
    diagnostics: Diagnostic[];
}
export type BodyNode = MarkdownBlockNode | LiteralBlockNode | ContentBlockNode | PullQuoteBlockNode | TimelineBlockNode | ImageBlockNode | ErrorBlockNode;
export interface DocumentNode {
    type: "Document";
    frontmatter: FrontmatterFields;
    children: BodyNode[];
    assets: string[];
}
export interface ParseResult {
    document: DocumentNode;
    diagnostics: Diagnostic[];
}
export type ThemeOverrideKey = "bg" | "surface" | "text" | "text-soft" | "accent" | "border" | "font-body" | "font-heading" | "radius";
export type BlockType = "explainer" | "note" | "warning" | "concept" | "aside" | "pullquote" | "question" | "takeaway" | "timeline";
export interface TMDConfigThemeBlock {
    "border-color"?: string;
    "bg"?: string;
    "marker-color"?: string;
}
export interface TMDConfigTheme {
    extends: string;
    overrides?: Partial<Record<ThemeOverrideKey, string>>;
    blocks?: Partial<Record<BlockType, TMDConfigThemeBlock>>;
}
export interface TMDConfig {
    defaultTheme: string;
    defaultCompile: string;
    themes: Record<string, TMDConfigTheme>;
    allowExternalCSS?: boolean;
}
export interface ResolvedConfig {
    theme: string;
    compile: "standalone" | "fragment";
    customThemes: Record<string, TMDConfigTheme>;
    allowExternalCSS: boolean;
}
export interface CompileResult {
    slug: string;
    htmlPath: string;
    cssPath: string;
    diagnostics: Diagnostic[];
}
export declare function exitCodeFromDiagnostics(diagnostics: Diagnostic[]): 0 | 1;
