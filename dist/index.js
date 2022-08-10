"use strict";
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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var fs_1 = __importDefault(require("fs"));
var gbk_js_1 = require("gbk.js");
// interface searchIP {
//     (ip: string, withNext: false): ipData;
//     (ip: string, withNext: true): { data: ipData, next: number };
// }
var RedirectMode;
(function (RedirectMode) {
    RedirectMode[RedirectMode["Mode1"] = 1] = "Mode1";
    RedirectMode[RedirectMode["Mode2"] = 2] = "Mode2";
})(RedirectMode || (RedirectMode = {}));
var IP_RECORD_LENGTH = 7;
var IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
var LimQqwry = /** @class */ (function () {
    function LimQqwry(path) {
        // 闭包
        this.cmd = bufferCmd(path)();
        this.ipBegin = this.cmd.readUIntLE(0, 4);
        this.ipEnd = this.cmd.readUIntLE(4, 4);
    }
    LimQqwry.prototype.searchIP = function (ip, withNext) {
        if (withNext === void 0) { withNext = false; }
        if (typeof ip === "string") {
            ip = ipToInt(ip);
        }
        // g为该ip的索引在索引区的起始位置
        var g = this.LocateIP(ip);
        if (g == -1) {
            return { int: ip, ip: intToIP(ip), Country: "", isp: "" };
        }
        var _a = this.setIPLocation(g), loc = _a.loc, next = _a.next;
        // closeData.call(this);
        // dbug && log(loc);
        var data;
        if (ip === 4294967040) {
            data = {
                start_ip: "255.255.255.0",
                start_ip_int: 4294967040,
                country: "IANA",
                isp: "保留地址"
            };
        }
        else {
            data = __assign({ start_ip: intToIP(ip), start_ip_int: ip }, loc);
        }
        return withNext ? { data: data, next: next } : data;
    };
    LimQqwry.prototype.toJson = function () {
        var ip = 1;
        var result = [];
        while (ip < 4294967295) {
            var _a = this.searchIP(ip, true), data = _a.data, next = _a.next;
            if (!next) {
                throw new Error("next error");
            }
            result.push(data);
            ip = next;
        }
        return result;
    };
    //2分法查找指定的IP偏移
    LimQqwry.prototype.LocateIP = function (ip) {
        var g, temp;
        for (var b = this.ipBegin, e = this.ipEnd; b < e;) {
            g = GetMiddleOffset(b, e, IP_RECORD_LENGTH); //获取中间位置
            temp = this.cmd.readUIntLE(g, 4);
            if (ip > temp) {
                b = g;
            }
            else if (ip < temp) {
                if (g == e) {
                    g -= IP_RECORD_LENGTH;
                    break;
                }
                e = g;
            }
            else {
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
        return g;
    };
    //获取IP地址对应区域
    LimQqwry.prototype.setIPLocation = function (g) {
        // 拿到该ip的偏移量，即在记录区的起始位置
        // this.cmd.readUIntLE(g + 4, 3)
        // 终止ip
        var next = this.cmd.readUIntLE(this.cmd.readUIntLE(g + 4, 3), 4) + 1;
        var ipwz = this.cmd.readUIntLE(g + 4, 3) + 4;
        // 在这种格式下，终止IP后跟有一个重定向标志 0x01
        // 由于正常存储的字符串不会以0x01开头，因此可以与格式1区分开。
        var lx = this.cmd.readUIntLE(ipwz, 1), loc = {};
        if (lx == RedirectMode.Mode1) {
            //Country根据标识再判断
            ipwz = this.cmd.readUIntLE(ipwz + 1, 3); //读取国家偏移`
            lx = this.cmd.readUIntLE(ipwz, 1); //再次获取标识字节
            var Gjbut = void 0;
            if (lx == RedirectMode.Mode2) {
                //再次检查标识字节
                Gjbut = this.cmd.getStringByteArray(this.cmd.readUIntLE(ipwz + 1, 3));
                loc.country = (0, gbk_js_1.decode)(Gjbut);
                // loc.Country = Gjbut.toString();
                ipwz = ipwz + 4;
            }
            else {
                Gjbut = this.cmd.getStringByteArray(ipwz);
                loc.country = (0, gbk_js_1.decode)(Gjbut);
                // loc.Country = Gjbut.toString();
                ipwz += Gjbut.length + 1;
            }
            loc.isp = this.ReadISP(ipwz);
        }
        else if (lx == RedirectMode.Mode2) {
            //Country直接读取偏移处字符串
            var Gjbut = this.cmd.getStringByteArray(this.cmd.readUIntLE(ipwz + 1, 3));
            loc.country = (0, gbk_js_1.decode)(Gjbut);
            // loc.Country = Gjbut.toString();
            loc.isp = this.ReadISP(ipwz + 4);
        }
        else {
            //Country直接读取 Area根据标志再判断
            var Gjbut = this.cmd.getStringByteArray(ipwz);
            ipwz += Gjbut.length + 1;
            loc.country = (0, gbk_js_1.decode)(Gjbut);
            // loc.Country = Gjbut.toString();
            loc.isp = this.ReadISP(ipwz);
        }
        return { loc: loc, next: next };
    };
    //读取ISP
    LimQqwry.prototype.ReadISP = function (offset) {
        var one = this.cmd.readUIntLE(offset, 1);
        if (one == RedirectMode.Mode1 || one == RedirectMode.Mode2) {
            var areaOffset = this.cmd.readUIntLE(offset + 1, 3);
            if (areaOffset == 0)
                return "Unknown";
            offset = areaOffset;
        }
        var array = this.cmd.getStringByteArray(offset);
        if (array.length === 9 && array[3] === 56) {
            return "Unknown";
        }
        return (0, gbk_js_1.decode)(array);
    };
    return LimQqwry;
}());
function bufferCmd(path) {
    var buffer = fs_1.default.readFileSync(path);
    var max = buffer.length;
    var api = {
        readBuffer: function (start, length) {
            start = start || 0;
            length = length || 1;
            return buffer.slice(start, start + length);
        },
        readUIntLE: function (start, length) {
            start = start || 0;
            length = length < 1 ? 1 : length > 6 ? 6 : length;
            return buffer.readUIntLE(start, length);
        },
        getStringByteArray: function (start) {
            var B = start || 0;
            var toarr = [];
            for (var i = B; i < max; i++) {
                var s = buffer[i];
                if (s === 0)
                    break;
                toarr.push(s);
            }
            return toarr;
        }
    };
    return function bufferCmd() {
        return api;
    };
}
// 取得begin和end中间的偏移(用于2分法查询);
function GetMiddleOffset(begin, end, recordLength) {
    var records = (((end - begin) / recordLength) >> 1) * recordLength + begin;
    return records ^ begin ? records : records + recordLength;
}
function ipToInt(IP) {
    var result = IP_REGEXP.exec(IP);
    var ip;
    if (result) {
        var ip_Arr = result.slice(1);
        ip =
            ((parseInt(ip_Arr[0]) << 24) |
                (parseInt(ip_Arr[1]) << 16) |
                (parseInt(ip_Arr[2]) << 8) |
                parseInt(ip_Arr[3])) >>>
                0;
    }
    else if (/^\d+$/.test(IP) && (ip = parseInt(IP)) >= 0 && ip <= 0xffffffff) {
        ip = +IP;
    }
    else {
        throw 'The IP address is not normal! >> ' + IP;
    }
    return ip;
}
function intToIP(int) {
    if (int < 0 || int > 0xffffffff) {
        throw 'The IP number is not normal! >> ' + int;
    }
    return ((int >>> 24) +
        '.' +
        ((int >>> 16) & 0xff) +
        '.' +
        ((int >>> 8) & 0xff) +
        '.' +
        ((int >>> 0) & 0xff));
}
module.exports = LimQqwry;
