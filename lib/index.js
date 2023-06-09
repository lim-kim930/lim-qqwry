"use strict";
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
var RedirectMode;
(function (RedirectMode) {
    RedirectMode[RedirectMode["Mode1"] = 1] = "Mode1";
    RedirectMode[RedirectMode["Mode2"] = 2] = "Mode2";
})(RedirectMode || (RedirectMode = {}));
var IP_RECORD_LENGTH = 7;
var IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
var LimQqwry = (function () {
    function LimQqwry(path) {
        this.cmd = this.bufferCmd(path)();
        this.ipBegin = this.cmd.readUIntLE(0, 4);
        this.ipEnd = this.cmd.readUIntLE(4, 4);
        this.version = this.getVersion();
    }
    LimQqwry.prototype.getVersion = function () {
        var g = this.LocateIP(4294967295);
        var loc = this.getIPLocation(g).loc;
        var version = "v";
        if (!loc.isp) {
            version = "unknown";
        }
        else {
            var firstTemp = loc.isp.split("年");
            var secondTemp = firstTemp[1].split("月");
            version += firstTemp[0] + secondTemp[0] + secondTemp[1].split("日")[0];
        }
        return version;
    };
    LimQqwry.prototype.searchIP = function (ip, withNext) {
        if (withNext === void 0) { withNext = false; }
        if (typeof ip === "string") {
            ip = LimQqwry.ipToInt(ip);
        }
        var g = this.LocateIP(ip);
        if (g == -1) {
            return { start_ip: ip, country: "unknown", isp: "unknown" };
        }
        var _a = this.getIPLocation(g), loc = _a.loc, next = _a.next;
        var data;
        if (ip < 4294967040) {
            data = __assign({ start_ip: ip }, loc);
        }
        else {
            data = {
                start_ip: 4294967040,
                country: "IANA",
                isp: "保留地址"
            };
        }
        return withNext ? { data: data, next: next } : __assign(__assign({}, loc), { ip: LimQqwry.intToIP(data.start_ip) });
    };
    LimQqwry.prototype.toJson = function () {
        var ip = 0;
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
    LimQqwry.prototype.getStartIpIntList = function () {
        var ip = 0;
        var result = [];
        while (ip < 4294967295) {
            var g = this.LocateIP(ip);
            if (g == -1) {
                throw new Error("'g' error when locate ip: " + ip);
            }
            var next = this.cmd.readUIntLE(this.cmd.readUIntLE(g + 4, 3), 4) + 1;
            if (!next) {
                throw new Error("'next' error when locate ip: " + ip);
            }
            result.push(ip);
            ip = next;
        }
        return result;
    };
    LimQqwry.getStartIpInt = function (ip, result) {
        if (ip < 0 || ip > 4294967295) {
            throw new Error("Invalid ip number");
        }
        var length = result.length;
        if (length === 2) {
            return ip >= result[1] ? result[1] : result[0];
        }
        var center = Math.trunc(length / 2);
        var left = result[center - 1];
        var right = result[center];
        if (ip > left && ip < right) {
            return left;
        }
        else if (ip === left || ip === right) {
            return ip;
        }
        else {
            return ip > left ? this.getStartIpInt(ip, result.slice(center)) : this.getStartIpInt(ip, result.slice(0, center));
        }
    };
    LimQqwry.intToIP = function (int) {
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
    };
    LimQqwry.ipToInt = function (IP) {
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
    };
    LimQqwry.prototype.bufferCmd = function (path) {
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
        return function () {
            return api;
        };
    };
    LimQqwry.prototype.GetMiddleOffset = function (begin, end, recordLength) {
        var records = (((end - begin) / recordLength) >> 1) * recordLength + begin;
        return records ^ begin ? records : records + recordLength;
    };
    LimQqwry.prototype.LocateIP = function (ip) {
        var g, temp;
        for (var b = this.ipBegin, e = this.ipEnd; b < e;) {
            g = this.GetMiddleOffset(b, e, IP_RECORD_LENGTH);
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
    };
    LimQqwry.prototype.getIPLocation = function (g) {
        var next = this.cmd.readUIntLE(this.cmd.readUIntLE(g + 4, 3), 4) + 1;
        var ipwz = this.cmd.readUIntLE(g + 4, 3) + 4;
        var lx = this.cmd.readUIntLE(ipwz, 1), loc = { country: "unknown", isp: "unknown" };
        if (lx == RedirectMode.Mode1) {
            ipwz = this.cmd.readUIntLE(ipwz + 1, 3);
            lx = this.cmd.readUIntLE(ipwz, 1);
            var Gjbut = void 0;
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
            var Gjbut = this.cmd.getStringByteArray(this.cmd.readUIntLE(ipwz + 1, 3));
            loc.country = (0, gbk_js_1.decode)(Gjbut);
            loc.isp = this.ReadISP(ipwz + 4);
        }
        else {
            var Gjbut = this.cmd.getStringByteArray(ipwz);
            ipwz += Gjbut.length + 1;
            loc.country = (0, gbk_js_1.decode)(Gjbut);
            loc.isp = this.ReadISP(ipwz);
        }
        return { loc: loc, next: next };
    };
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
module.exports = LimQqwry;
