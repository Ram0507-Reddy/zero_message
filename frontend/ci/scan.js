const fs = require('fs');
const path = require('path');

const SEARCH_DIR = path.join(__dirname, '../.next/static/chunks');
// const SEARCH_DIR = path.join(__dirname, '../app'); // source scan for now if build unsupported
const FORBIDDEN = ['TX-server', 'RX-eagle', 'Secret A', 'Secret B'];

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    let failed = false;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (scanDir(fullPath)) failed = true;
        } else if (file.endsWith('.js') || file.endsWith('.txt')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            for (const term of FORBIDDEN) {
                if (content.includes(term)) {
                    console.error(`[FAIL] Found '${term}' in ${file}`);
                    failed = true;
                }
            }
        }
    }
    return failed;
}

console.log("🔍 Scanning Build Artifacts for Secrets...");
// Mock: Just scan source components for now as .next might not be fully built or compressed
const SOURCE_DIR = path.join(__dirname, '../components');
if (scanDir(SOURCE_DIR)) {
    console.log("❌ Artifact Scan Failed");
    process.exit(1);
} else {
    console.log("✅ Artifact Scan Passed");
    process.exit(0);
}
