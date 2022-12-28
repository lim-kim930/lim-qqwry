"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStartIpInt = exports.intToIP = exports.ipToInt = exports.toJson = void 0;
const fs_1 = __importDefault(require("fs"));
const gbk_js_1 = require("gbk.js");
var RedirectMode;
(function (RedirectMode) {
    RedirectMode[RedirectMode["Mode1"] = 1] = "Mode1";
    RedirectMode[RedirectMode["Mode2"] = 2] = "Mode2";
})(RedirectMode || (RedirectMode = {}));
const IP_RECORD_LENGTH = 7;
const IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
class LimQqwry {
    constructor(path) {
        this.cmd = bufferCmd(path)();
        this.ipBegin = this.cmd.readUIntLE(0, 4);
        this.ipEnd = this.cmd.readUIntLE(4, 4);
        this.version = this.getVersion();
    }
    getVersion() {
        const g = this.LocateIP(4294967295);
        const { loc } = this.getIPLocation(g);
        let version = "v";
        if (!loc.isp) {
            version = "unknown";
        }
        else {
            const firstTemp = loc.isp.split("年");
            const secondTemp = firstTemp[1].split("月");
            version += firstTemp[0] + secondTemp[0] + secondTemp[1].split("日")[0];
        }
        return version;
    }
    searchIP(ip, withNext = false) {
        if (typeof ip === "string") {
            ip = ipToInt(ip);
        }
        const g = this.LocateIP(ip);
        if (g == -1) {
            return { start_ip: ip, country: "unknown", isp: "unknown" };
        }
        const { loc, next } = this.getIPLocation(g);
        let data;
        if (ip < 4294967040) {
            data = Object.assign({ start_ip: ip }, loc);
        }
        else {
            data = {
                start_ip: 4294967040,
                country: "IANA",
                isp: "保留地址"
            };
        }
        return withNext ? { data, next } : Object.assign(Object.assign({}, loc), { ip: intToIP(data.start_ip) });
    }
    toJson() {
        let ip = 0;
        let result = [];
        while (ip < 4294967295) {
            const { data, next } = this.searchIP(ip, true);
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
        let result = [];
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
    LocateIP(ip) {
        let g, temp;
        for (let b = this.ipBegin, e = this.ipEnd; b < e;) {
            g = GetMiddleOffset(b, e, IP_RECORD_LENGTH);
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
        return g;
    }
    getIPLocation(g) {
        const next = this.cmd.readUIntLE(this.cmd.readUIntLE(g + 4, 3), 4) + 1;
        let ipwz = this.cmd.readUIntLE(g + 4, 3) + 4;
        let lx = this.cmd.readUIntLE(ipwz, 1), loc = { country: "unknown", isp: "unknown" };
        if (lx == RedirectMode.Mode1) {
            ipwz = this.cmd.readUIntLE(ipwz + 1, 3);
            lx = this.cmd.readUIntLE(ipwz, 1);
            let Gjbut;
            if (lx == RedirectMode.Mode2) {
                Gjbut = this.cmd.getStringByteArray(this.cmd.readUIntLE(ipwz + 1, 3));
                loc.country = (0, gbk_js_1.decode)(Gjbut);
                ipwz = ipwz + 4;
            }
            else {
                Gjbut = this.cmd.getStringByteArray(ipwz);
                loc.country = (0, gbk_js_1.decode)(Gjbut);
                ipwz += Gjbut.length + 1;
            }
            loc.isp = this.ReadISP(ipwz);
        }
        else if (lx == RedirectMode.Mode2) {
            const Gjbut = this.cmd.getStringByteArray(this.cmd.readUIntLE(ipwz + 1, 3));
            loc.country = (0, gbk_js_1.decode)(Gjbut);
            loc.isp = this.ReadISP(ipwz + 4);
        }
        else {
            const Gjbut = this.cmd.getStringByteArray(ipwz);
            ipwz += Gjbut.length + 1;
            loc.country = (0, gbk_js_1.decode)(Gjbut);
            loc.isp = this.ReadISP(ipwz);
        }
        return { loc, next };
    }
    ReadISP(offset) {
        const one = this.cmd.readUIntLE(offset, 1);
        if (one == RedirectMode.Mode1 || one == RedirectMode.Mode2) {
            const areaOffset = this.cmd.readUIntLE(offset + 1, 3);
            if (areaOffset == 0)
                return "Unknown";
            offset = areaOffset;
        }
        const array = this.cmd.getStringByteArray(offset);
        if (array.length === 9 && array[3] === 56) {
            return "Unknown";
        }
        return (0, gbk_js_1.decode)(array);
    }
}
function bufferCmd(path) {
    const buffer = fs_1.default.readFileSync(path);
    const max = buffer.length;
    const api = {
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
            const B = start || 0;
            const toarr = [];
            for (let i = B; i < max; i++) {
                const s = buffer[i];
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
function GetMiddleOffset(begin, end, recordLength) {
    const records = (((end - begin) / recordLength) >> 1) * recordLength + begin;
    return records ^ begin ? records : records + recordLength;
}
function ipToInt(IP) {
    const result = IP_REGEXP.exec(IP);
    let ip;
    if (result) {
        const ip_Arr = result.slice(1);
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
exports.ipToInt = ipToInt;
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
exports.intToIP = intToIP;
function toJson(path) {
    const instance = new LimQqwry(path);
    return instance.toJson();
}
exports.toJson = toJson;
function getStartIpInt(ip, result) {
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
        return ip > left ? getStartIpInt(ip, result.slice(center)) : getStartIpInt(ip, result.slice(0, center));
    }
}
exports.getStartIpInt = getStartIpInt;
exports.default = LimQqwry;
