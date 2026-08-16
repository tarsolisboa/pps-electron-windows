import React, { useState, useEffect } from 'react';
import {
    Title2,
    Text,
    Card,
    CardHeader,
    Badge,
    Button,
    Caption1,
    Switch,
    Spinner,
    makeStyles,
    shorthands,
    mergeClasses
} from '@fluentui/react-components';
import { t } from '../../i18n';

import rocketSvg from '../assets/icons/podium.svg';

const useStyles = makeStyles({
    container: { display: 'flex', flexDirection: 'column', ...shorthands.gap('16px') },
    flexCard: { backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(12px)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    compactCard: { backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(12px)' },
    iconBadge: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px' },
    summaryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
    appsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' },
    appRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...shorthands.padding('10px', '0px'), borderBottom: '1px solid rgba(0,0,0,0.05)', ...shorthands.gap('12px') },
    appInfo: { display: 'flex', flexDirection: 'column', maxWidth: '65%' },
    appActions: { display: 'flex', alignItems: 'center', ...shorthands.gap('12px') },
    transparentBtn: { backgroundColor: 'transparent', border: '1px solid rgba(0, 0, 0, 0.12)', backdropFilter: 'blur(8px)' }
});

export function StartupAppsView({ isDarkMode }) {
    const styles = useStyles();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            if (window.api?.startup?.getApps) {
                const res = await window.api.startup.getApps();
                setApps(res || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleToggle = async (appId, currentStatus) => {
        const nextStatus = !currentStatus;
        setApps(prev => prev.map(item => item.id === appId ? { ...item, enabled: nextStatus } : item));
        try {
            if (window.api?.startup?.toggleApp) {
                await window.api.startup.toggleApp(appId, nextStatus);
            }
        } catch (e) {}
    };

    const activeCount = apps.filter(a => a.enabled).length;

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('startup.title')}</Title2>
                <Text block>{t('startup.subtitle')}</Text>
            </div>

            <Card className={mergeClasses(styles.compactCard)}>
                <CardHeader
                    image={<div className={styles.iconBadge}><img src={rocketSvg} alt="Startup" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/></div>}
                    header={<Text weight="semibold">{t('startup.impactTitle')}</Text>}
                    description={t('startup.impactDesc')}
                />
                <div className={styles.summaryHeader}>
                    <div>
                        <Text size={700} weight="bold">{activeCount}</Text>
                        <Text size={300} style={{ marginLeft: '8px', opacity: 0.8 }}>
                            {t('startup.activeAppsCount').replace('{count}', apps.length)}
                        </Text>
                    </div>
                    <Button size="small" className={styles.transparentBtn} onClick={loadData} disabled={loading}>
                        {loading ? t('startup.updating') : t('startup.reload')}
                    </Button>
                </div>
            </Card>

            <Card className={mergeClasses(styles.flexCard)}>
                <div>
                    <div className={styles.appsHeader}>
                        <Text weight="semibold">{t('startup.registeredApps')}</Text>
                        <Caption1>{t('startup.status')}</Caption1>
                    </div>

                    {loading ? (
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <Spinner label={t('startup.loadingApps')} size="medium" />
                        </div>
                    ) : apps.length === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <Caption1 block>{t('startup.noApps')}</Caption1>
                        </div>
                    ) : (
                        apps.map((app) => (
                            <div key={app.id} className={styles.appRow}>
                                <div className={styles.appInfo}>
                                    <Text weight="semibold" size={200}>{app.name}</Text>
                                    <Caption1 style={{ wordBreak: 'break-all', color: '#212121' }}>{app.path}</Caption1>
                                </div>

                                <div className={styles.appActions}>
                                    {app.impact && (
                                        <Badge appearance="tint" color={app.impact === 'high' ? 'danger' : app.impact === 'medium' ? 'warning' : 'brand'}>
                                            {t('startup.impactLabel')} {t(`startup.impact.${app.impact}`)}
                                        </Badge>
                                    )}
                                    <Switch checked={app.enabled} onChange={() => handleToggle(app.id, app.enabled)} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}

export default StartupAppsView;