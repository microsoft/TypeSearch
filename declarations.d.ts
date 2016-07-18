interface String {
    includes(substring: string): boolean;
}

declare module "http-server" {
    function createServer(options: { root: string }): { listen: (port: number) => void };
}
