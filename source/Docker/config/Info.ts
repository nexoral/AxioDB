import { readFile } from 'node:fs/promises';
import os from 'node:os';

export default async ()=> {
    // Read the version from the version file
    const versionData = await readFile("package.json", "utf-8");
    const versionJson = JSON.parse(versionData);
    const DB_Info = {
        AxioDB_Version: versionJson.dependencies["axiodb"],
        AxioDB_Docker_Version: versionJson.version,
        Author: versionJson.author,
        License: versionJson.license,
        Latest_Update: versionJson.Published,
    }
    const OS_Info = {
        OS: process.platform,
        Architecture: process.arch,
        Memory: process.memoryUsage() ? process.memoryUsage().heapTotal / 1024 / 1024 : "N/A",
        Uptime: process.uptime() / 60,
        Load_Average: os.loadavg() ? os.loadavg().toString() : "N/A",
        Free_Memory: os.freemem() / 1024 / 1024,
        Total_Memory: os.totalmem() / 1024 / 1024,
        CPU_Usage: process.cpuUsage(),
        CPU_Usage_Percent: (process.cpuUsage().user + process.cpuUsage().system) / 1000,
    }
    const Runtime_Info = {
        Node_Version: process.versions.node,
        NPM_Version: process.versions.npm,
        V8_Version: process.versions.v8,
        OpenSSL_Version: process.versions.openssl,
        Zlib_Version: process.versions.zlib,
        Libuv_Version: process.versions.libuv,
        WebServer_Version: versionJson.dependencies.fastify,
    }
    return { DB_Info, OS_Info, Runtime_Info };
}