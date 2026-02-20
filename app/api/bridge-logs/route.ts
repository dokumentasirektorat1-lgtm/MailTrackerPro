import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Path to bridge log file is now in the PROJECT ROOT
        // In Next.js, process.cwd() is the root of the project
        const logPath = path.join(process.cwd(), 'bridge', 'bridge.log');

        if (!fs.existsSync(logPath)) {
            return NextResponse.json({ logs: ["Log file not found. Bridge might not be running."] });
        }

        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');

        // Return last 300 lines
        const recentLogs = lines.slice(-300);

        return NextResponse.json({ logs: recentLogs });
    } catch (error) {
        return NextResponse.json({ logs: ["Error reading logs.", String(error)] }, { status: 500 });
    }
}
