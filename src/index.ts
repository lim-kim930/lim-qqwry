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
// TODO: GBK内嵌
// TODO: 释放buffer内存
import fs from "fs";
import { decode } from "gbk.js"
import { IPData, IPInfo, IntIPData } from "./typings/index.js";

enum RedirectMode {
    Mode1 = 1,
    Mode2 = 2
}

const IP_RECORD_LENGTH = 7;
const IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

class LimQqwry {
    ipBegin: number;
    ipEnd: number;
    version: undefined | string;
    private cmd: {
        readBuffer: (start: number, length: number) => Buffer;
        readUIntLE: (start: number, length: number) => number;
        getStringByteArray: (start: number) => number[];
    };
    constructor(path: string) {
        // 闭包
        this.cmd = this.bufferCmd(path)();
        this.ipBegin = this.cmd.readUIntLE(0, 4);
        this.ipEnd = this.cmd.readUIntLE(4, 4);
        this.version = this.getVersion();
    }

    private getVersion() {
        const g = this.LocateIP(4294967295);
        const { loc } = this.getIPLocation(g);
        let version = "v";
        if (!loc.isp) {
            version = "unknown"
        } else {
            const firstTemp = loc.isp.split("年");
            const secondTemp = firstTemp[1].split("月");
            version += firstTemp[0] + secondTemp[0] + secondTemp[1].split("日")[0];
        }
        return version;
    }

    private getIPData(ip: number | string, withNext: false): IPData;
    private getIPData(ip: number | string, withNext: true): { data: IntIPData, next: number };
    private getIPData(ip: number | string, withNext: boolean) {
        if (typeof ip === "string") {
            ip = LimQqwry.ipToInt(ip);
        }
        // g为该ip的索引在索引区的起始位置
        const g = this.LocateIP(ip);
        if (g == -1) {
            return { start_ip: ip, country: "unknown", isp: "unknown" } as IntIPData;
        }
        const { loc, next } = this.getIPLocation(g);
        // closeData.call(this);
        let data: IntIPData;

        if (ip < 4294967040) {
            data = {
                start_ip: ip,
                ...loc
            } as IntIPData;
        } else {
            data = {
                start_ip: 4294967040,
                country: "IANA",
                isp: "保留地址"
            } as IntIPData
        }
        return withNext ? { data, next } : ({ ...loc, ip: LimQqwry.intToIP(data.start_ip) } as IPData);
    }

    searchIP(ip: number | string) {
        return this.getIPData(ip, false);
    }

    toJson() {
        let ip = 0;
        let result: IntIPData[] = [];

        while (ip < 4294967295) {
            const { data, next } = this.getIPData(ip, true) as { data: IntIPData, next: number };
            if (!next) {
                throw new Error("next error");
            }
            result.push(data);
            ip = next;
        }

        return result;
    }

    getStartIpIntList() {
        let ip = 0;
        let result: number[] = [];

        while (ip < 4294967295) {
            const g = this.LocateIP(ip);
            if (g == -1) {
                throw new Error("'g' error when locate ip: " + ip);
            }
            const next = this.cmd.readUIntLE(this.cmd.readUIntLE(g + 4, 3), 4) + 1;
            if (!next) {
                throw new Error("'next' error when locate ip: " + ip);
            }
            result.push(ip);
            ip = next;
        }

        return result;
    }

    // 二分法查找起始ip
    public static getStartIpInt(ip: number, result: number[]): number {
        if (ip < 0 || ip > 4294967295) {
            throw new Error("Invalid ip number");
        }

        const length = result.length;

        if (length === 2) {
            return ip >= result[1] ? result[1] : result[0];
        }

        const center = Math.trunc(length / 2);
        const left = result[center - 1];
        const right = result[center];

        if (ip > left && ip < right) {
            return left;
        }
        else if (ip === left || ip === right) {
            return ip;
        }
        else {
            return ip > left ? this.getStartIpInt(ip, result.slice(center)) : this.getStartIpInt(ip, result.slice(0, center));
        }
    }

    public static intToIP(int: number) {
        if (int < 0 || int > 0xffffffff) {
            throw 'The IP number is not normal! >> ' + int;
        }
        return (
            (int >>> 24) +
            '.' +
            ((int >>> 16) & 0xff) +
            '.' +
            ((int >>> 8) & 0xff) +
            '.' +
            ((int >>> 0) & 0xff)
        );
    }

    public static ipToInt(IP: string) {
        const result = IP_REGEXP.exec(IP);
        let ip: number;
        if (result) {
            const ip_Arr = result.slice(1);
            ip =
                ((parseInt(ip_Arr[0]) << 24) |
                    (parseInt(ip_Arr[1]) << 16) |
                    (parseInt(ip_Arr[2]) << 8) |
                    parseInt(ip_Arr[3])) >>>
                0;
        } else if (/^\d+$/.test(IP) && (ip = parseInt(IP)) >= 0 && ip <= 0xffffffff) {
            ip = +IP;
        } else {
            throw 'The IP address is not normal! >> ' + IP;
        }
        return ip;
    }

    private bufferCmd(path: string) {
        const buffer = fs.readFileSync(path);
        const max = buffer.length;
        const api = {
            readBuffer: function (start: number, length: number) {
                start = start || 0;
                length = length || 1;
                return buffer.slice(start, start + length);
            },
            readUIntLE: function (start: number, length: number) {
                start = start || 0;
                length = length < 1 ? 1 : length > 6 ? 6 : length;
                return buffer.readUIntLE(start, length);
            },
            getStringByteArray: function (start: number) {
                const B = start || 0;
                const toarr = [];
                for (let i = B; i < max; i++) {
                    const s = buffer[i];
                    if (s === 0) break;
                    toarr.push(s);
                }
                return toarr;
            }
        };
        return () => {
            return api;
        };
    }

    // 取得begin和end中间的偏移(用于2分法查询);
    private GetMiddleOffset(begin: number, end: number, recordLength: number) {
        const records = (((end - begin) / recordLength) >> 1) * recordLength + begin;
        return records ^ begin ? records : records + recordLength;
    }

    //2分法查找指定的IP偏移
    private LocateIP(ip: number) {
        let g: number, temp;
        for (let b = this.ipBegin, e = this.ipEnd; b < e;) {
            g = this.GetMiddleOffset(b, e, IP_RECORD_LENGTH); //获取中间位置
            temp = this.cmd.readUIntLE(g, 4);

            if (ip > temp) {
                b = g;
            } else if (ip < temp) {
                if (g == e) {
                    g -= IP_RECORD_LENGTH;
                    break;
                }
                e = g;
            } else {
                break;
            }
        }
        // if (dbug) {
        //     var begip = this.cmd.readUIntLE(g, 4);
        //     endip = this.cmd.readUIntLE(this.cmd.readUIntLE(g, 3), 4); //获取结束IP的值
        //     log(exports.intToIP(ip) + ' >> ' + ip);
        //     log('>> Indexes as "' + g + '" ( ' + begip + ' --> ' + endip + ' )');
        //     if (ip > endip) {
        //         //与结束IP比较；正常情况不会出现这种情况,除非IP库漏掉了一些IP;
        //         return -1;
        //     }
        // }
        return g!;
    }

    //获取IP地址对应区域
    private getIPLocation(g: number) {

        // 拿到该ip的偏移量，即在记录区的起始位置
        // this.cmd.readUIntLE(g + 4, 3)
        // 终止ip
        const next = this.cmd.readUIntLE(this.cmd.readUIntLE(g + 4, 3), 4) + 1;

        let ipwz = this.cmd.readUIntLE(g + 4, 3) + 4;
        // 在这种格式下，终止IP后跟有一个重定向标志 0x01
        // 由于正常存储的字符串不会以0x01开头，因此可以与格式1区分开。
        let lx = this.cmd.readUIntLE(ipwz, 1),
            loc: IPInfo = { country: "unknown", isp: "unknown" };
        if (lx == RedirectMode.Mode1) {
            //Country根据标识再判断
            ipwz = this.cmd.readUIntLE(ipwz + 1, 3); //读取国家偏移`
            lx = this.cmd.readUIntLE(ipwz, 1); //再次获取标识字节

            let Gjbut: number[];
            if (lx == RedirectMode.Mode2) {
                //再次检查标识字节
                Gjbut = this.cmd.getStringByteArray(this.cmd.readUIntLE(ipwz + 1, 3));
                loc.country = decode(Gjbut);
                // loc.Country = Gjbut.toString();
                ipwz = ipwz + 4;
            } else {
                Gjbut = this.cmd.getStringByteArray(ipwz);
                loc.country = decode(Gjbut);
                // loc.Country = Gjbut.toString();
                ipwz += Gjbut.length + 1;
            }
            loc.isp = this.ReadISP(ipwz);
        } else if (lx == RedirectMode.Mode2) {
            //Country直接读取偏移处字符串
            const Gjbut = this.cmd.getStringByteArray(this.cmd.readUIntLE(ipwz + 1, 3));
            loc.country = decode(Gjbut);
            // loc.Country = Gjbut.toString();
            loc.isp = this.ReadISP(ipwz + 4);
        } else {
            //Country直接读取 Area根据标志再判断
            const Gjbut = this.cmd.getStringByteArray(ipwz);
            ipwz += Gjbut.length + 1;
            loc.country = decode(Gjbut);
            // loc.Country = Gjbut.toString();
            loc.isp = this.ReadISP(ipwz);
        }
        return { loc, next };
    }

    //读取ISP
    private ReadISP(offset: number) {
        const one = this.cmd.readUIntLE(offset, 1);
        if (one == RedirectMode.Mode1 || one == RedirectMode.Mode2) {
            const areaOffset = this.cmd.readUIntLE(offset + 1, 3);
            if (areaOffset == 0) return "Unknown";
            offset = areaOffset;
        }
        const array = this.cmd.getStringByteArray(offset)
        if (array.length === 9 && array[3] === 56) {
            return "Unknown";
        }
        return decode(array);
    }
}

export { IPData, IntIPData, IPInfo };

export default LimQqwry;
