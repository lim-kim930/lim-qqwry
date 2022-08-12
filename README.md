# lim-qqwry

#### A json converter for qqwry.dat file.
### [Original Code Repository](https://github.com/cnwhy/lib-qqwry)

<br>

## Installation

### LimQqwry requires **Node.js v6.0.0** or higher for ES2015 and async function support.

```
npm install lim-qqwry
```
<br>

## Example

```
import LimQqwry, { toJson } from "../dist";
import path from "path";
import fs from "fs";

const datapath = path.join(__dirname, './qqwry.dat');
const qqwry = new LimQqwry(datapath);

const ipdata = qqwry.searchIP("115.120.105.66");
console.log(ipdata);

const result = toJson(datapath);
fs.writeFile("./data.json", JSON.stringify(result), () => {
    console.log("succeed!");
});
```

### Note that when creating a new instance, the module will read the .dat file into the memory to improve the speed of subsequent operations (extreme speed mode in the original code), so if it is a one-time conversion instead of query services, please pay attention to the memory overflow problem.
