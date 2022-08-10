/**
 * MIT License
 * Copyright (c) 2022 lim-kim930
 *
 * 算法参考 Luma -《纯真IP数据库格式详解》
 * https://developer.aliyun.com/article/365659
 * https://zhuanlan.zhihu.com/p/360624952
 *
 * 代码来源
 * https://github.com/cnwhy/lib-qqwry
 *
 * 抽离出文件读取部分的代码，使用Ts部分改写
 */
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
export { LimQqwry, toJson };
