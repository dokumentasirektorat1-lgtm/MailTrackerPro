'use client';

import { useEffect, useState } from 'react';
import { getSystemConfig, onConfigChange, SystemConfig, onBackupModeChange } from '@/lib/firebase/firestore';

export const useConfig = () => {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [backupMode, setBackupMode] = useState(false);

    useEffect(() => {
        // ... (existing fetchConfig logic)
        const fetchConfig = async () => {
            try {
                const systemConfig = await getSystemConfig();
                setConfig(systemConfig);
            } catch (error: any) {
                if (error.code === 'resource-exhausted' || error.message?.includes('Quota')) {
                    setQuotaExceeded(true);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();

        // Listen to config changes
        const unsubConfig = onConfigChange((updatedConfig) => {
            setConfig(updatedConfig);
            setQuotaExceeded(false);
        }, (error) => {
            if (error.code === 'resource-exhausted' || error.message?.includes('Quota')) {
                setQuotaExceeded(true);
            }
        });

        // Listen to Backup Mode changes
        const unsubBackup = onBackupModeChange((active) => {
            setBackupMode(active);
        });

        return () => {
            unsubConfig();
            unsubBackup();
        };
    }, []);

    return { config, loading, quotaExceeded, backupMode };
};
