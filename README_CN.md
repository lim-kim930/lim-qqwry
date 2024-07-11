# lim-qqwry

<img src="https://img.shields.io/npm/v/lim-qqwry" alt="lim-qqwry"/>

#### 一个针对纯真IP地址库`qqwry.dat`的模块, 可以进行isp查询和将`.dat`文件转成json文件, 以便可以直接导入MongoDB等.
### [原始代码仓库](https://github.com/cnwhy/lib-qqwry)

<br>

纯真(CZ88.NET)自2005年起一直为广大社区用户提供社区版IP地址库，只要获得纯真的授权就能免费使用，并不断获取后续更新的版本。如果有需要免费版IP库的朋友可以前往纯真的官网进行申请。
纯真除了免费的社区版IP库外，还提供数据更加准确、服务更加周全的商业版IP地址查询数据。纯真围绕IP地址，基于 网络空间拓扑测绘 + 移动位置大数据 方案，对IP地址定位、IP网络风险、IP使用场景、IP网络类型、秒拨侦测、VPN侦测、代理侦测、爬虫侦测、真人度等均有近20年丰富的数据沉淀。

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

<br>

## 其他
### 配合MongoDB使用, 可以不将qqwry.dat一直放在内存里, 而是存储`startIpIntList`, 通过提供的static方法, 获得`queryIp`, 前往数据库查询:

```javascript
let startIpIntList = null;
async function queryIpInfo(ip) {
    if (!startIpIntList) {
        startIpIntList = new LimQqwry(path.join(process.cwd(), "data/qqwry.dat")).getStartIpIntList();
    }
    const ipInt = LimQqwry.ipToInt(ip);
    const queryIp = LimQqwry.getStartIpInt(ipInt, startIpIntList);
    const data = await Mapper.getIpData(queryIp); // 数据库查询代码示例
    return { ip, country: data.country, isp: data.isp };
}
```
