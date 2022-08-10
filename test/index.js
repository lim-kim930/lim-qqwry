const LimQqwry = require("../dist")
const path = require("path")
const fs = require("fs")

const datapath = path.join(__dirname, './qqwry.dat');

console.time("time_load_data");
const qqwry = new LimQqwry(datapath);
console.timeEnd("time_load_data");

console.time("time_single_search");
const ipdata = qqwry.searchIP("115.120.105.66");
console.log(ipdata);
console.timeEnd("time_single_search");

console.time("time_to_json");
const result = qqwry.toJson();
fs.writeFile("./data.json", JSON.stringify(result), () => {
    console.timeEnd("time_to_json");
});