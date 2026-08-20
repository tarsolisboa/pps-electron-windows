import React, { useEffect, useState, memo } from 'react';
import {
    Title2,
    Text,
    Card,
    CardHeader,
    ProgressBar,
    Badge,
    Button,
    Caption1,
    makeStyles,
    shorthands,
    mergeClasses
} from '@fluentui/react-components';
import { t } from '../../i18n';

import cpuSvg from '../assets/icons/cpu.svg';
import ramSvg from '../assets/icons/memory-stick.svg';
import diskSvg from '../assets/icons/hard-drive.svg';
import netSvg from '../assets/icons/globe.svg';
import infoSvg from '../assets/icons/laptop-minimal-check.svg';
import topSvg from '../assets/icons/podium.svg';

const useStyles = makeStyles({
    container: { display: 'flex', flexDirection: 'column', ...shorthands.gap('16px') },
    mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...shorthands.gap('16px'), alignItems: 'stretch' },
    col1: { gridColumn: '1 / 2' },
    col2Span2: { gridColumn: '2 / 4' },
    leftStack: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', ...shorthands.gap('16px') },
    rightStack: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', ...shorthands.gap('16px') },
    flexCard: { backgroundColor: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(12px)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    compactCard: { backgroundColor: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(12px)', flexGrow: 1 },
    iconBadge: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px' },
    metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' },
    netGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', ...shorthands.gap('12px'), marginTop: '12px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...shorthands.padding('6px', '0px'), borderBottom: '1px solid rgba(0,0,0,0.05)' },
    procRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...shorthands.padding('6px', '0px'), borderBottom: '1px solid rgba(0,0,0,0.05)' },
    compactQuickActions: { display: 'flex', alignItems: 'left', justifyContent: 'space-between', flexWrap: 'wrap', ...shorthands.gap('12px'), ...shorthands.padding('12px', '16px') },
    actionButtonsGroup: { display: 'flex', ...shorthands.gap('8px'), flexWrap: 'wrap' }
});

// ==========================================
// FUNÇÕES AUXILIARES MOVIDAS PARA FORA (Evita recriação a cada render)
// ==========================================
const formatBytesToGB = (bytes) => {
    if (!bytes) return `0 ${t('units.gb')}`;
    return `${(bytes / (1024 ** 3)).toFixed(1)} ${t('units.gb')}`;
};

const formatSpeed = (bytes) => {
    if (!bytes || bytes < 1024) return `0 ${t('units.bytes_per_sec')}`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${t('units.kb_per_sec')}`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} ${t('units.mb_per_sec')}`;
};

const formatUptime = (sec) => {
    if (!sec) return `0${t('units.h')} 0${t('units.m')}`;
    const days = Math.floor(sec / (3600 * 24));
    const hours = Math.floor((sec % (3600 * 24)) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return days > 0 ? `${days}${t('units.d')} ${hours}${t('units.h')}` : `${hours}${t('units.h')} ${mins}${t('units.m')}`;
};

// ==========================================
// SUB-COMPONENTES MEMOIZADOS (Só re-renderizam se sua própria prop mudar)
// ==========================================
const CpuCard = memo(({ cpuStats, styles, isDarkMode }) => (
    <Card className={mergeClasses(styles.compactCard, styles.col1)}>
        <CardHeader
            image={<div className={styles.iconBadge}><img src={cpuSvg} alt="CPU" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
            header={<Text weight="semibold">{t('dashboard.cpuTitle')}</Text>}
            description={cpuStats.cpuName || t('common.unknown')}
        />
        <div className={styles.metricHeader}>
            <Text size={700} weight="bold">{cpuStats.cpuLoad}%</Text>
            <Badge appearance="tint" color={cpuStats.cpuLoad > 85 ? 'danger' : 'brand'}>{t('dashboard.consumption')}</Badge>
        </div>
        <ProgressBar value={cpuStats.cpuLoad / 100} color={cpuStats.cpuLoad > 85 ? 'danger' : 'brand'} />
    </Card>
));

const MemCard = memo(({ cpuStats, styles, isDarkMode, flushing, onFlush }) => (
    <Card className={mergeClasses(styles.compactCard)}>
        <CardHeader
            image={<div className={styles.iconBadge}><img src={ramSvg} alt="RAM" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
            header={<Text weight="semibold">{t('dashboard.memoryTitle')}</Text>}
            description={`${formatBytesToGB(cpuStats.memUsedBytes)} / ${formatBytesToGB(cpuStats.memTotalBytes)}`}
        />
        <div className={styles.metricHeader}>
            <Text size={700} weight="bold">{cpuStats.memPercentage}%</Text>
            <Button size="small" appearance="primary" onClick={onFlush} disabled={flushing}>
                {flushing ? t('dashboard.optimizing') : t('dashboard.optimizeRam')}
            </Button>
        </div>
        <ProgressBar value={cpuStats.memPercentage / 100} color={cpuStats.memPercentage > 90 ? 'danger' : 'brand'} />
    </Card>
));

const DiskCard = memo(({ diskStats, styles, isDarkMode }) => (
    <Card className={mergeClasses(styles.compactCard)}>
        <CardHeader
            image={<div className={styles.iconBadge}><img src={diskSvg} alt="Disk" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
            header={<Text weight="semibold">{t('dashboard.diskTitle')} ({diskStats.diskMount || 'C:'})</Text>}
            description={`${formatBytesToGB(diskStats.diskUsedBytes)} / ${formatBytesToGB(diskStats.diskTotalBytes)}`}
        />
        <div className={styles.metricHeader}>
            <Text size={700} weight="bold">{diskStats.diskPercentage}%</Text>
            <Badge appearance="tint" color={diskStats.diskPercentage > 85 ? 'warning' : 'brand'}>{t('dashboard.occupied')}</Badge>
        </div>
        <ProgressBar value={diskStats.diskPercentage / 100} color={diskStats.diskPercentage > 85 ? 'warning' : 'brand'} />
    </Card>
));

const NetCard = memo(({ netStats, styles, isDarkMode }) => (
    <Card className={mergeClasses(styles.compactCard)}>
        <CardHeader
            image={<div className={styles.iconBadge}><img src={netSvg} alt="Network" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
            header={<Text weight="semibold">{t('dashboard.networkTitle')}</Text>}
            description={t('dashboard.networkDesc')}
        />
        <div className={styles.netGrid}>
            <div>
                <Caption1 block>Download</Caption1>
                <Text size={500} weight="bold">{formatSpeed(netStats.downloadBytesPerSec)}</Text>
            </div>
            <div>
                <Caption1 block>Upload</Caption1>
                <Text size={500} weight="bold">{formatSpeed(netStats.uploadBytesPerSec)}</Text>
            </div>
        </div>
    </Card>
));

const TopProcessesCard = memo(({ sysStats, styles, isDarkMode }) => (
    <Card className={mergeClasses(styles.flexCard)}>
        <div>
            <CardHeader
                image={<div className={styles.iconBadge}><img src={topSvg} alt="Top" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
                header={<Text weight="semibold">{t('dashboard.topConsumption')}</Text>}
                description={t('dashboard.topDesc')}
            />
            <div style={{ marginTop: '8px' }}>
                {sysStats?.topProcesses?.length === 0 ? (
                    <Caption1 block>{t('dashboard.loading')}</Caption1>
                ) : (
                    sysStats?.topProcesses?.map((proc, idx) => (
                        <div key={idx} className={styles.procRow}>
                            <Text weight="semibold" size={200} style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {proc.name}
                            </Text>
                            <div>
                                <Badge appearance="subtle" style={{ marginRight: '4px' }}>{proc.cpuPercent}%</Badge>
                                <Badge appearance="tint">{Math.round((proc.memRssKB || 0) / 1024)} MB</Badge>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </Card>
));

const SysInfoCard = memo(({ sysStats, cpuStats, styles, isDarkMode }) => (
    <Card className={mergeClasses(styles.flexCard)}>
        <div>
            <CardHeader
                image={<div className={styles.iconBadge}><img src={infoSvg} alt="Info" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
                header={<Text weight="semibold">{t('dashboard.sysInfoTitle')}</Text>}
                description={`${t('dashboard.device')}: ${sysStats.deviceName || t('common.unknown')}`}
            />
            <div style={{ marginTop: '12px' }}>
                <div className={styles.infoRow}>
                    <Caption1>{t('dashboard.coresCount')}:</Caption1>
                    <Text weight="semibold" size={200}>{cpuStats.cpuCores}</Text>
                </div>
                <div className={styles.infoRow}>
                    <Caption1>{t('dashboard.cpuFreq')}:</Caption1>
                    <Text weight="semibold" size={200}>{cpuStats.cpuSpeed ? `${cpuStats.cpuSpeed} ${t('units.ghz')}` : t('common.na')}</Text>
                </div>
                <div className={styles.infoRow}>
                    <Caption1>{t('dashboard.osName')}:</Caption1>
                    <Text weight="semibold" size={200}>{sysStats.osName || t('common.unknown')}</Text>
                </div>
                <div className={styles.infoRow}>
                    <Caption1>{t('dashboard.osBuild')}:</Caption1>
                    <Text weight="semibold" size={200}>{sysStats.osBuild || t('common.na')}</Text>
                </div>
                <div className={styles.infoRow}>
                    <Caption1>{t('dashboard.powerPlan')}:</Caption1>
                    <Badge appearance="tint" color="brand">{sysStats.activePowerPlan || t('common.na')}</Badge>
                </div>
                <div className={styles.infoRow} style={{ borderBottom: 'none' }}>
                    <Caption1>{t('dashboard.uptime')}:</Caption1>
                    <Badge appearance="tint" color="subtle">{formatUptime(sysStats.uptimeSeconds)}</Badge>
                </div>
            </div>
        </div>
    </Card>
));

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function DashboardView({ onNavigate, isDarkMode }) {
    const styles = useStyles();
    const [flushing, setFlushing] = useState(false);

    const [cpuStats, setCpuStats] = useState({ cpuLoad: 0, cpuName: null, cpuCores: 0, cpuSpeed: 0, memUsedBytes: 0, memTotalBytes: 0, memPercentage: 0 });
    const [diskStats, setDiskStats] = useState({ diskMount: null, diskUsedBytes: 0, diskTotalBytes: 0, diskPercentage: 0 });
    const [netStats, setNetStats] = useState({ downloadBytesPerSec: 0, uploadBytesPerSec: 0 });
    const [sysStats, setSysStats] = useState({ deviceName: null, osName: null, osBuild: null, uptimeSeconds: 0, activePowerPlan: null, topProcesses: [] });

    // 1. CPU: Começa quase imediatamente, atualiza a cada 1s
    useEffect(() => {
        let isMounted = true;
        let timer;

        const fetchCpu = async () => {
            if (!isMounted) return;
            const data = await window.api?.stats?.getCpu?.();
            if (data && isMounted) setCpuStats(data);
            timer = setTimeout(fetchCpu, 1000); // Só chama o próximo quando este terminar
        };

        // Dá 100ms para a tela renderizar visualmente primeiro
        setTimeout(fetchCpu, 100); 

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    // 2. Rede: Começa depois da CPU, atualiza a cada 1.5s
    useEffect(() => {
        let isMounted = true;
        let timer;

        const fetchNet = async () => {
            if (!isMounted) return;
            const data = await window.api?.stats?.getNetwork?.();
            if (data && isMounted) setNetStats(data);
            timer = setTimeout(fetchNet, 1500);
        };

        // Espera 300ms antes da primeira chamada
        setTimeout(fetchNet, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    // 3. Sistema: Começa depois, atualiza a cada 3s
    useEffect(() => {
        let isMounted = true;
        let timer;

        const fetchSys = async () => {
            if (!isMounted) return;
            const data = await window.api?.stats?.getSystem?.();
            if (data && isMounted) setSysStats(data);
            timer = setTimeout(fetchSys, 3000);
        };

        // Espera 600ms antes da primeira chamada
        setTimeout(fetchSys, 600);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    // 4. Disco: É o mais pesado! Começa por último, atualiza a cada 15s
    useEffect(() => {
        let isMounted = true;
        let timer;

        const fetchDisk = async () => {
            if (!isMounted) return;
            const data = await window.api?.stats?.getDisk?.();
            if (data && isMounted) setDiskStats(data);
            timer = setTimeout(fetchDisk, 15000);
        };

        // Espera 1 segundo inteiro antes de estressar o disco
        setTimeout(fetchDisk, 1000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    const handleFlushMem = async () => {
        setFlushing(true);
        await window.api?.stats?.flushMem?.();
        setTimeout(() => setFlushing(false), 1000);
    };

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('dashboard.title')}</Title2>
                <Text block>{t('dashboard.subtitle')}</Text>
            </div>

            <div className={styles.mainGrid}>
                {/* Cards Memoizados - Redução drástica de carga na CPU e GPU do frontend */}
                <CpuCard cpuStats={cpuStats} styles={styles} isDarkMode={isDarkMode} />
                <MemCard cpuStats={cpuStats} styles={styles} isDarkMode={isDarkMode} flushing={flushing} onFlush={handleFlushMem} />
                <DiskCard diskStats={diskStats} styles={styles} isDarkMode={isDarkMode} />

                <div className={`${styles.col1} ${styles.leftStack}`}>
                    <NetCard netStats={netStats} styles={styles} isDarkMode={isDarkMode} />
                    <TopProcessesCard sysStats={sysStats} styles={styles} isDarkMode={isDarkMode} />
                </div>

                <div className={`${styles.col2Span2} ${styles.rightStack}`}>
                    <SysInfoCard sysStats={sysStats} cpuStats={cpuStats} styles={styles} isDarkMode={isDarkMode} />

                    {/* Quick Actions (não precisa memoizar pois não depende de estado de polling) */}
                    <Card className={mergeClasses(styles.compactCard, styles.compactQuickActions)}>
                        <Text weight="semibold">{t('dashboard.quickAccess')}</Text>
                        <div className={styles.actionButtonsGroup}>
                            <Button size="small" appearance="primary" onClick={() => onNavigate?.('power')}>{t('nav.power')}</Button>
                            <Button size="small" appearance="primary" onClick={() => onNavigate?.('cleaner')}>{t('nav.cleaner')}</Button>
                            <Button size="small" appearance="primary" onClick={() => onNavigate?.('process')}>{t('nav.process')}</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default DashboardView;