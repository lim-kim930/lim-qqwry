const LimQqwry = require("../lib");
const path = require("path");
const fs = require("fs");

const datapath = path.join(__dirname, './qqwry.dat');

const beforeMem = process.memoryUsage().arrayBuffers;
const qqwry = new LimQqwry(datapath);
const memIncrease = (process.memoryUsage().arrayBuffers - beforeMem) / 1024 / 1024;
console.log("Memory increased: ", memIncrease);

const ipdata = qqwry.searchIP("223.5.5.5");
console.log(ipdata);

const intList = qqwry.getStartIpIntList();
const ip = LimQqwry.ipToInt("223.5.5.5");
const int = LimQqwry.getStartIpInt(ip, intList);
console.log(int);

const result = qqwry.toJson(datapath);
fs.writeFile("./data.json", JSON.stringify(result), error => {
    if (error) {
        console.error(error);
    }
});