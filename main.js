const axios = require('axios').default;
const fs = require('fs');

(async () => {
    
    const file = fs.readFileSync(process.argv[2], 'utf8');
    const a = file.split('\n');
    
    for (let i = 0; i < a.length; i++) {
        const ip = a[i].split(' - ')[0];

        if (!ip) return;

        try {
            process.stdout.write(`\x1b[Kprocessing ${ip} (${i} of ${a.length})\r`);

            const body = await axios.get(`http://${ip}`, {
                timeout: 10000,
                insecureHTTPParser: true
            });
            
            const regex = /(js\/native.js\?1\.1|Getxmllogin\(\))/;

            if (regex.test(body.data)) {
                console.log(`\x1b[K\x1b[32m ${ip} SPC FOUND\x1b[0m`)
            }
        } catch (err) {
            // console.log(`  error: ${err.message}`)
            continue;
        }
    }
    /*
    try {
        const body = await axios.get(process.argv[2]);
        
        const regex = /(js\/native.js\?1\.1|Getxmllogin\(\))/;

        if (regex.test(body.data)) {
            console.log('OK');
        }
    } catch (error) {
        console.log(error.message);
    }*/
})();
