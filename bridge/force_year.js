const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function updateTargetYear() {
    try {
        await db.collection('config').doc('system').set({ targetYear: 2026 }, { merge: true });
        console.log("SUCCESS: targetYear set to 2026 in Firestore.");
    } catch (error) {
        console.error("Error:", error);
    }
}

updateTargetYear();
