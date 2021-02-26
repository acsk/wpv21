export interface CreateConfig {
    folderNameToken?: string;
    mkdirFolderToken?: string;
    headless?: boolean;
    devtools?: boolean;
    useChrome?: boolean;
    debug?: boolean;
    browserWS?: string;
    browserArgs?: string[];
    puppeteerOptions: {
        [key: string]: string;
    };
    logQR?: boolean;
    disableSpins?: boolean;
    disableWelcome?: boolean;
    updatesLog?: boolean;
    autoClose?: number;
    createPathFileToken: boolean;
}
export declare const defaultOptions: CreateConfig;
