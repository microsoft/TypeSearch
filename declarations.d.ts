
declare module "http-server" {
    function createServer(options: { root: string }): { listen: (port: number) => void };
}
