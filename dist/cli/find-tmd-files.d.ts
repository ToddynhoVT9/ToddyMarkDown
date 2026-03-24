/**
 * Busca recursivamente todos os arquivos .tmd em um diretório.
 * Lança error se o diretório não existir ou não for um diretório.
 */
export declare function findTmdFiles(dirPath: string): Promise<string[]>;
