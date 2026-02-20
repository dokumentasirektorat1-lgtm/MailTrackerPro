import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // ── LOCAL STRATEGY ──────────────────────────────────────────────────
        // When running locally (dev or a Windows server), try to read the log
        // file that the Python bridge writes directly to disk.
        const logPath = path.join(process.cwd(), 'bridge', 'bridge.log');

        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim() !== '');

            // Return last 300 lines
            const recentLogs = lines.slice(-300);
            return NextResponse.json({ logs: recentLogs, source: 'local' });
        }

        // ── FIRESTORE FALLBACK ───────────────────────────────────────────────
        // On Vercel (or any environment without local file access), fall back
        // to reading recent audit_logs from Firestore via the Admin SDK.
        try {
            const admin = await import('firebase-admin');
            const { getFirestore } = await import('firebase-admin/firestore');

            if (!admin.default.apps.length) {
                const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
                if (!serviceAccountJson) {
                    return NextResponse.json({
                        logs: [
                            '⚠ Bridge log file not found on this server.',
                            '⚠ FIREBASE_SERVICE_ACCOUNT_JSON env var is also not set.',
                            '',
                            'ℹ The bridge only runs on the local Windows PC.',
                            'ℹ To see logs here, the bridge must be running locally',
                            '  and you must access the app via local dev server (npm run dev).',
                            '',
                            'ℹ For Vercel deployments, set FIREBASE_SERVICE_ACCOUNT_JSON',
                            '  in your Vercel environment variables to read logs from Firestore.',
                        ],
                        source: 'static',
                    });
                }

                const serviceAccount = JSON.parse(serviceAccountJson);
                admin.default.initializeApp({
                    credential: admin.default.credential.cert(serviceAccount),
                });
            }

            const db = getFirestore();
            const snapshot = await db
                .collection('audit_logs')
                .orderBy('timestamp', 'desc')
                .limit(200)
                .get();

            const logs = snapshot.docs
                .reverse()
                .map(doc => {
                    const d = doc.data();
                    const ts = d.timestamp?.toDate
                        ? d.timestamp.toDate().toLocaleString('id-ID')
                        : '?';
                    return `${ts} [${(d.level || 'info').toUpperCase()}] ${d.message}`;
                });

            return NextResponse.json({ logs, source: 'firestore' });

        } catch (fsErr) {
            return NextResponse.json({
                logs: [
                    '⚠ Bridge log file not found. The bridge is not running on this server.',
                    '',
                    'ℹ The Python bridge must run on the local Windows PC.',
                    'ℹ Start it with: start_bridge.bat',
                    '',
                    `ℹ Firestore fallback also failed: ${String(fsErr)}`,
                ],
                source: 'error',
            });
        }

    } catch (error) {
        return NextResponse.json(
            { logs: ['Error reading bridge logs.', String(error)], source: 'error' },
            { status: 500 }
        );
    }
}
