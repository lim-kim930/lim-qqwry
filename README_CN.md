# lim-qqwry

#### 一个针对纯真IP地址库`qqwry.dat`的模块, 可以进行isp查询和将`.dat`文件转成json文件, 以便可以直接导入MongoDB等.
### [原始代码仓库](https://github.com/cnwhy/lib-qqwry)

<br>

## 安装

### 需要 **Node.js v6.0.0** 或者更高版本以取得ES6支持.

```
npm install lim-qqwry
```
<br>

## 示例代码

```javascript
import LimQqwry from "lim-qqwry";
import path from "path";
import fs from "fs";

const datapath = path.join(__dirname, './qqwry.dat');
const qqwry = new LimQqwry(datapath);
// 查询ip信息
const ipdata = qqwry.searchIP("115.120.105.66");
console.log(ipdata);
// 转json
const result = qqwry.toJson(datapath);
fs.writeFile("./data.json", JSON.stringify(result), () => {
    console.log("succeed!");
});
```
### 注意, 在创建新的实例时, 模块会将.dat文件读入内存, 以提高后续操作的速度（原代码中的极速模式）, 所以如果是一次性转换而不是查询服务, 请注意内存问题。

## 其他
### 配合MondoDB使用, 可以不将qqwry.dat一直放在内存里, 而是存储`startIpIntList`, 通过提供的static方法, 获得`queryIp`, 前往数据库查询:

```javascript
let startIpIntList = null;
queryIpInfo(ip) {
    if (!startIpIntList) {
        startIpIntList = new LimQqwry(path.join(process.cwd(), "data/qqwry.dat")).getStartIpIntList();
    }
    const ipInt = LimQqwry.ipToInt(ip);
    const queryIp = LimQqwry.getStartIpInt(ipInt, startIpIntList);
    const data = await Mapper.getIpData(queryIp); // 数据库查询代码示例
    return { ip, country: data.country, isp: data.isp };
}
```
