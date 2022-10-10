const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios').default;
const { print } = require('./func');

const http = axios.create({
    timeout: 5000,
    insecureHTTPParser: true
});

async function ping(host) {
    return new Promise((resolve, reject) => {
        const ping = spawn('ping', ['-W', '2', '-c', '1', host]);

        ping.on('error', (error) => {
            reject(error);
        });

        ping.on('close', (code) => {
            if (code == 0) {
                resolve(true);
            } else {
                reject('Host is unreachable');
            }
        });
    });
}

async function scan(ip) {
    return new Promise((resolve, reject) => {
        let success  = 0;
        let fail = 0;
        let totalhost = 0;

        const masscan_opts = [
            '--rate', '2000',
            '-p80',
            '--interface', 'wlan0',
            '--router-mac', '3c:78:43:ed:30:e1',
            `${ip}/16`
        ];
        
        //console.log('Scanning', ip);
        const path    = 'result/' + ip + '.txt';
        const result  = fs.createWriteStream(path);
        const masscan = spawn('masscan', masscan_opts);

        masscan.stdout.on('data', async (data) => {
            const a  = data.toString().trim();
            const ip = a.match(/(\d{1,3}\.){3}\d{1,3}/g)[0];

            try {
                const response = await http.get(`http://${ip}`);
                const regex = response.data.match(/var modelName="([\w-]+)";/);

                if (regex) {
                    const title = regex[1];

                    result.write(`${ip} - ${title}\n`);
                } else {
                    result.write(`${ip} - ${response.status} - ${response.statusText}\n`);
                }

                success++;
            } catch (error) {
                print(`  ${ip} - ${error.message}`);
                fail++;
            }
        });

        masscan.on('error', (error) => {
            reject(error);
        });

        masscan.on('close', (code) => {
            result.close();

            if (success == 0) {
                fs.rmSync(path);
            }

            resolve([code, success, fail]);
        });
    });
}

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

(async () => {
    const n = range(9, 254);

    for (const i of n) {
        const ip = `10.${i}.0`;

        print(`Pinging ${ip}\t`, false);
        try {
            await ping(ip + '.1');
            print('Scanning');

            const [code, success, fail] = await scan(ip + '.0');
            print(`  ${success} success, ${fail} fail`);
        } catch (error) {
            print(error)
            continue;
        }
    }
})();
