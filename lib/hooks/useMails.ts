'use client';

import { useEffect, useState } from 'react';
import { getMailsByYear, searchMails, MailDocument } from '@/lib/firebase/firestore';

export const useMails = (year: number) => {
    const [mails, setMails] = useState<MailDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMails = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedMails = await getMailsByYear(year);
                setMails(fetchedMails);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch mails');
            } finally {
                setLoading(false);
            }
        };

        fetchMails();
    }, [year]);

    return { mails, loading, error };
};
