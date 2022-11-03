import LimQqwry, { toJson, getStartIpInt, ipToInt, intToIP } from "../dist";
import path from "path";
import fs from "fs";

const datapath = path.join(__dirname, './qqwry.dat');

const beforeMem = process.memoryUsage().arrayBuffers;
console.time("time_load_data");
const qqwry = new LimQqwry(datapath);
console.timeEnd("time_load_data");
const memIncrease = (process.memoryUsage().arrayBuffers - beforeMem) / 1024 / 1024;
console.log("Memory increased: ", memIncrease);


console.time("time_single_search");
const ipdata = qqwry.searchIP("223.5.5.5");
console.timeEnd("time_single_search");
console.log(ipdata);

const intList = qqwry.getStartIpIntList();
const ip = ipToInt("223.5.5.5");
console.time("time_get_startip");
const int = getStartIpInt(ip, intList);
console.timeEnd("time_get_startip");
console.log(int);

console.time("time_to_json");
const result = toJson(datapath);
console.timeEnd("time_to_json");
fs.writeFile("./data.json", JSON.stringify(result), error => {
    if (error) {
        console.error(error);
    }
});