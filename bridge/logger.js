const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'bridge.log');
const MAX_LOG_SIZE = 1024 * 1024; // 1MB

function getTimestamp() {
    return new Date().toLocaleTimeString('id-ID', { hour12: false });
}

function rotateLogs() {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const stats = fs.statSync(LOG_FILE);
            if (stats.size > MAX_LOG_SIZE) {
                const content = fs.readFileSync(LOG_FILE, 'utf8');
                const lines = content.split('\n');
                // Keep last 500 lines to reduce size
                const newContent = lines.slice(-500).join('\n');
                fs.writeFileSync(LOG_FILE, newContent);
            }
        }
    } catch (error) {
        // Ignore rotation errors
    }
}

// Override console methods to capture logs
const originalLog = console.log;
const originalError = console.error;

function formatMessage(args) {
    return args.map(arg => {
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg);
            } catch (e) {
                return '[Object]';
            }
        }
        return arg;
    }).join(' ');
}

function setupLogger() {
    // Clear log on startup
    fs.writeFileSync(LOG_FILE, `=== Bridge Started at ${new Date().toLocaleString()} ===\n`);

    console.log = function (...args) {
        originalLog.apply(console, args);
        try {
            const msg = `[${getTimestamp()}] INFO: ${formatMessage(args)}\n`;
            fs.appendFileSync(LOG_FILE, msg);
            rotateLogs();
        } catch (e) { }
    };

    console.error = function (...args) {
        originalError.apply(console, args);
        try {
            const msg = `[${getTimestamp()}] ERROR: ${formatMessage(args)}\n`;
            fs.appendFileSync(LOG_FILE, msg);
            rotateLogs();
        } catch (e) { }
    };

    console.log("Logger initialized. Writing to: " + LOG_FILE);
}

module.exports = { setupLogger };
