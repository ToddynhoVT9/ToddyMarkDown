import type { CompileResult, Diagnostic } from '../types/index.js';
export declare function formatPosition(d: Diagnostic): string;
export declare function printCompileResult(result: CompileResult): void;
export declare function printSlugCollision(slug: string, first: string, second: string): void;
export declare function printFatal(message: string): void;
export declare function printWatchEvent(event: string, p: string): void;
export declare function printInitCreated(path: string): void;
export declare function printInitExists(path: string): void;
