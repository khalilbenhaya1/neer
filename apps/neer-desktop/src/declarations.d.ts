declare module 'neer' {
    export function readConfigFileSnapshot(): Promise<any>;
    export function writeConfigFile(config: any): Promise<void>;
}

declare module 'neer/server' {
    export function startGatewayServer(port: number, options?: any): Promise<any>;
}
