# lim-qqwry

<img src="https://img.shields.io/npm/v/lim-mailer" alt="lim-mailer"/>

#### A module for CZIP address library `qqwry.dat`, which can perform isp query and convert `.dat` files into json files, which can be directly imported into MongoDB, etc.
### [Original Code Repository](https://github.com/cnwhy/lib-qqwry)

#### [中文文档](https://github.com/lim-kim930/lim-qqwry/blob/main/README_CN.md)

<br>

## Installation

### LimQqwry requires **Node.js v6.0.0** or higher for ES2015 and async function support.

```
npm install lim-qqwry
```
<br>

## Example

```javascript
import LimQqwry from "lim-qqwry";
import path from "path";
import fs from "fs";

const datapath = path.join(__dirname, './qqwry.dat');
const qqwry = new LimQqwry(datapath);
// query ip information
const ipdata = qqwry.searchIP("115.120.105.66");
console.log(ipdata);
// convert to json
const result = qqwry.toJson(datapath);
fs.writeFile("./data.json", JSON.stringify(result), () => {
    console.log("succeed!");
});
```

### Note that when creating a new instance, the module will read the .dat file into the memory to improve the speed of subsequent operations (extreme speed mode in the original code), so if it is a one-time conversion instead of query services, please pay attention to the memory overflow problem.

<br>

## Other
### Used with MondoDB, you can store `StartIpIntList` instead of qqwry.dat in memory all the time, get `queryIp` through the provided static method, and go to the database to query:

```javascript
let startIpIntList = null;
async function queryIpInfo(ip) {
    if (!startIpIntList) {
        startIpIntList = new LimQqwry(path.join(process.cwd(), "data/qqwry.dat")).getStartIpIntList();
    }
    const ipInt = LimQqwry.ipToInt(ip);
    const queryIp = LimQqwry.getStartIpInt(ipInt, startIpIntList);
    const data = await Mapper.getIpData(queryIp); // database query code example
    return { ip, country: data.country, isp: data.isp };
}
```
