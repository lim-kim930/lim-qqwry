interface IPInfo {
    country: string;
    isp: string;
}
interface IntIPData extends IPInfo {
    start_ip: number;
}
interface IPData extends IPInfo {
    ip: string;
}

declare class LimQqwry {
    ipBegin: number;
    ipEnd: number;
    version: undefined | string;
    private cmd;
    constructor(path: string);
    private getVersion;
    private getIPData;
    searchIP(ip: number | string): IPData;
    toJson(): IntIPData[];
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

export { IPData, IPInfo, IntIPData, LimQqwry as default };
