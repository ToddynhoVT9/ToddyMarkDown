export interface WatchOptions {
    target: string;
    out: string;
    config?: string;
}
export declare function runWatchCommand({ target, out, config }: WatchOptions): void;
