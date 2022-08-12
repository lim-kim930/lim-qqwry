interface locData {
    country?: string;
    isp?: string;
}
interface ipData extends locData {
    start_ip: string;
    start_ip_int: number;
}
declare class LimQqwry {
    ipBegin: number;
    ipEnd: number;
    version: undefined | string;
    private cmd;
    constructor(path: string);
    private getVersion;
    searchIP(ip: number | string, withNext?: boolean): ipData | {
        int: number;
        ip: string;
        Country: string;
        isp: string;
        data?: undefined;
        next?: undefined;
    } | {
        data: ipData;
        next: number;
        int?: undefined;
        ip?: undefined;
        Country?: undefined;
        isp?: undefined;
    };
    toJson(): ipData[];
    private LocateIP;
    private setIPLocation;
    private ReadISP;
}
declare function toJson(path: string): ipData[];
export { toJson };
export default LimQqwry;
