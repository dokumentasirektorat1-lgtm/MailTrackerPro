import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // ── LOCAL STRATEGY ────────────────────────────────────────────────────
        // When running locally (dev server or Windows deployment), read the
        // Python bridge log file directly from disk.
        const logPath = path.join(process.cwd(), 'bridge', 'bridge.log');

        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf8');
            const lines = content.split('\n').filter(l => l.trim() !== '');
            return NextResponse.json({ logs: lines.slice(-300), source: 'local' });
        }

        // ── FIRESTORE REST FALLBACK ───────────────────────────────────────────
        // On Vercel (no local file), use the Firebase REST API with the
        // client-side API key to read audit_logs from Firestore.
        // This does NOT require any server-side admin credentials.
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

        if (!projectId || !apiKey) {
            return NextResponse.json({
                logs: [
                    '⚠ Bridge log file not found on this server (Vercel has no local disk access).',
                    '',
                    'ℹ The bridge runs on your local Windows PC.',
                    'ℹ Bridge audit events are still visible in the Event History table below.',
                    'ℹ To see this log panel: access the app via  npm run dev  on your local PC.',
                ],
                source: 'static',
            });
        }

        // Firestore REST: fetch last 200 audit_log documents ordered by timestamp desc
        const url =
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

        const body = {
            structuredQuery: {
                from: [{ collectionId: 'audit_logs' }],
                orderBy: [{ field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' }],
                limit: 200,
            },
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            throw new Error(`Firestore REST error: ${res.status} ${res.statusText}`);
        }

        const results: any[] = await res.json();

        const logs: string[] = results
            .filter((r: any) => r.document)
            .reverse() // oldest first
            .map((r: any) => {
                const fields = r.document.fields || {};
                const msg = fields.message?.stringValue || '';
                const level = (fields.level?.stringValue || 'info').toUpperCase();
                const ts = fields.timestamp?.timestampValue
                    ? new Date(fields.timestamp.timestampValue).toLocaleString('id-ID')
                    : '?';
                return `${ts} [${level}] ${msg}`;
            });

        if (logs.length === 0) {
            return NextResponse.json({
                logs: [
                    'ℹ No bridge audit events found in Firestore yet.',
                    'ℹ Start the bridge on your local PC to begin generating events.',
                ],
                source: 'firestore',
            });
        }

        return NextResponse.json({ logs, source: 'firestore' });

    } catch (error) {
        return NextResponse.json(
            {
                logs: [
                    `⚠ Error reading bridge logs: ${String(error)}`,
                    '',
                    'ℹ Start the bridge locally and access via  npm run dev  to see real-time logs.',
                ],
                source: 'error',
            },
            { status: 500 }
        );
    }
}
