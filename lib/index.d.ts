interface locData {
    country: string;
    isp: string;
}
interface ipData extends locData {
    start_ip: number;
}
interface ipResponse extends locData {
    ip: string;
}
declare class LimQqwry {
    ipBegin: number;
    ipEnd: number;
    version: undefined | string;
    private cmd;
    constructor(path: string);
    private getVersion;
    searchIP(ip: number | string, withNext?: boolean): ipData | ipResponse | {
        data: ipData;
        next: number;
    };
    toJson(): ipData[];
    getStartIpIntList(): number[];
    static getStartIpInt(ip: number, result: number[]): number;
    static intToIP(int: number): string;
    static ipToInt(IP: string): number;
    private bufferCmd;
    private GetMiddleOffset;
    private LocateIP;
    private getIPLocation;
    private ReadISP;
}

export { LimQqwry as default };
