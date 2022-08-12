interface locData {
    country: string;
    isp: string;
}
interface ipData extends locData {
    start_ip: string;
    start_ip_int: number;
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
    getStartIpIntlist(): number[];
    private LocateIP;
    private getIPLocation;
    private ReadISP;
}
declare function ipToInt(IP: string): number;
declare function intToIP(int: number): string;
declare function toJson(path: string): ipData[];
declare function getStartIpInt(ip: number, result: number[]): number;
export { toJson, ipToInt, intToIP, getStartIpInt };
export default LimQqwry;
