import React, { useState, useEffect } from 'react';
import {
    Title2,
    Text,
    Card,
    CardHeader,
    Badge,
    Button,
    Caption1,
    Spinner,
    makeStyles,
    shorthands
} from '@fluentui/react-components';
import { t } from '../../i18n';

// IMPORTAÇÃO DOS SVGS LOCAIS
import downSvg from '../assets/icons/arrow-big-down-dash.svg';
import upSvg from '../assets/icons/arrow-big-up-dash.svg';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('12px'),
    },
    gridCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        ...shorthands.gap('12px'),
    },
    compactCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(12px)',
        ...shorthands.padding('12px'),
    },
    flexCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('8px'),
        ...shorthands.padding('12px'),
    },
    speedDisplay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '4px',
    },
    tableHeader: {
        display: 'grid',
        gap: '12px', 
        gridTemplateColumns: 'repeat(3, 2fr)', 
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        fontWeight: '600',
        fontSize: '11px',
        letterSpacing: '0.5px',
    },
    tableRow: {
        display: 'grid',
        gap: '12px', 
        gridTemplateColumns: 'repeat(3, 2fr)', 
        ...shorthands.padding('4px', '0px'),
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        ...shorthands.gap('6px'),
    },
    tableHeaderConections: {
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '12px', 
        boxSizing: 'border-box',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        fontWeight: '600'
    },
    tableRowConections: {
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px', 
        boxSizing: 'border-box',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)'
    }
});

export function NetworkMonitorView({ isDarkMode }) {
    const styles = useStyles();

    const [speed, setSpeed] = useState({ downloadBytesPerSec: 0, uploadBytesPerSec: 0 });
    const [interfaces, setInterfaces] = useState([]);
    const [connections, setConnections] = useState([]);
    const [dnsResults, setDnsResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testingDns, setTestingDns] = useState(false);
    const [flushingDns, setFlushingDns] = useState(false);

    // Formata a velocidade em tempo real usando as unidades dinâmicas do i18n
    const formatSpeed = (bytesPerSec) => {
        if (!bytesPerSec || bytesPerSec < 1024) return `${(bytesPerSec || 0).toFixed(0)} ${t('units.bytes_per_sec')}`;
        if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} ${t('units.kb_per_sec')}`;
        return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} ${t('units.mb_per_sec')}`;
    };

    const loadStaticData = async () => {
        setLoading(true);
        try {
            if (window.api?.network) {
                const ifaces = await window.api.network.getInterfaces();
                const conns = await window.api.network.getConnections();
                setInterfaces(ifaces || []);
                setConnections(conns || []);
            }
        } catch (e) {
            console.error('Error loading static network data:', e);
        } finally {
            setLoading(false);
        }
    };

    const updateSpeed = async () => {
        try {
            if (window.api?.network?.getSpeed) {
                const data = await window.api.network.getSpeed();
                if (data) setSpeed(data);
            }
        } catch (e) { }
    };

    const handleRefreshConnections = async () => {
        setLoading(true);
        try {
            if (window.api?.network?.getConnections) {
                const conns = await window.api.network.getConnections();
                setConnections(conns || []);
            }
        } catch (e) { }
        setLoading(false);
    };

    const handleTestDns = async () => {
        setTestingDns(true);
        try {
            if (window.api?.network?.testDns) {
                const res = await window.api.network.testDns();
                setDnsResults(res || []);
            }
        } catch (e) { }
        setTestingDns(false);
    };

    const handleFlushDns = async () => {
        setFlushingDns(true);
        try {
            if (window.api?.network?.flushDns) {
                const success = await window.api.network.flushDns();
                alert(success ? t('network.dnsFlushSuccess') : t('network.dnsFlushError'));
            }
        } catch (e) { }
        setFlushingDns(false);
    };

    useEffect(() => {
        loadStaticData();
        const timer = setInterval(() => {
            updateSpeed();
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('network.title')}</Title2>
                <Text block>{t('network.subtitle')}</Text>
            </div>

            {/* VELOCIDADE EM TEMPO REAL */}
            <div className={styles.gridCards}>
                <Card className={styles.compactCard}>
                    <CardHeader 
                        image={
                            <div className={styles.iconBadge}>
                                <img src={downSvg} alt="Download" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/>
                            </div>
                        }
                        header={<Text weight="semibold">{t('network.download')}</Text>}
                        description={t('network.downloadDesc')}
                    />
                    <div className={styles.speedDisplay}>
                        <Text size={700} weight="bold" style={{ color: '#03b854' }}>
                            {formatSpeed(speed.downloadBytesPerSec)}
                        </Text>
                    </div>
                </Card>

                <Card className={styles.compactCard}>
                    <CardHeader 
                        image={
                            <div className={styles.iconBadge}>
                                <img src={upSvg} alt="Upload" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/>
                            </div>
                        }
                        header={<Text weight="semibold">{t('network.upload')}</Text>}
                        description={t('network.uploadDesc')}
                    />
                    <div className={styles.speedDisplay}>
                        <Text size={700} weight="bold" style={{ color: '#d04040' }}>
                            {formatSpeed(speed.uploadBytesPerSec)}
                        </Text>
                    </div>
                </Card>
            </div>

            {/* BENCHMARK DE DNS */}
            <Card className={styles.flexCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Text weight="semibold" size={200}>{t('network.dnsTitle')}</Text>
                        <Caption1 block style={{ opacity: 0.7 }}>
                            {t('network.dnsDesc')}
                        </Caption1>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            size="small"
                            appearance="secondary"
                            onClick={handleFlushDns}
                            disabled={flushingDns}
                        >
                            {flushingDns ? t('network.flushingDns') : t('network.flushDns')}
                        </Button>

                        <Button
                            size="small"
                            appearance="secondary"
                            onClick={handleTestDns}
                            disabled={testingDns}
                        >
                            {testingDns ? t('network.testingDns') : t('network.testDns')}
                        </Button>
                    </div>
                </div>

                {testingDns ? (
                    <div style={{ padding: '12px 0', textAlign: 'center' }}>
                        <Spinner label={t('network.testingDnsLabel')} size="tiny" />
                    </div>
                ) : dnsResults.length > 0 && (
                    <div style={{ marginTop: '6px' }}>
                        <div className={styles.tableHeader}>
                            <Text block>{t('network.dnsServer')}</Text>
                            <Text block>{t('network.ipAddress')}</Text>
                            <Text block>{t('network.latency')}</Text>
                        </div>

                        {dnsResults.map((item, idx) => (
                            <div key={idx} className={styles.tableRow} style={{ paddingTop: '7px'}}>
                                <Text weight="semibold" size={200}>
                                    {idx === 0 ? `* ${item.id}` : item.id}
                                </Text>
                                <div>
                                    <Text size={200}>{item.ip}</Text>
                                </div>
                                <div>
                                    {item.latency !== null ? (
                                        <Badge
                                            appearance="tint"
                                            size="small"
                                            color={item.latency < 30 ? 'success' : item.latency < 70 ? 'warning' : 'danger'}
                                        >
                                            {item.latency} {t('units.ms')}
                                        </Badge>
                                    ) : (
                                        <Badge appearance="tint" size="small" color="important">{t('network.error')}</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* PLACAS DE REDE */}
            <Card className={styles.flexCard}>
                <Text weight="semibold" size={200}>{t('network.interfacesTitle')}</Text>
                {interfaces.length === 0 ? (
                    <Caption1>{t('network.noInterfaces')}</Caption1>
                ) : (
                    interfaces.map((iface, idx) => (
                        <div key={idx} className={styles.tableRow}>
                            <div>
                                <Text weight="semibold" size={200}>{iface.name}</Text>
                            </div>
                            <div>
                                <Text size={200}>MAC: {iface.mac}</Text>
                            </div>
                            <div>
                                <Text size={200}>IP: {iface.ip}</Text>
                            </div>
                        </div>
                    ))
                )}
            </Card>

            {/* CONEXÕES ATIVAS */}
            <Card className={styles.flexCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <Text weight="semibold" size={200}>{t('network.connectionsTitle')} ({connections.length})</Text>
                    <Button
                        size="small"
                        appearance="secondary"
                        onClick={handleRefreshConnections}
                        disabled={loading}
                    >
                        {t('network.reload')}
                    </Button>
                </div>

                <div className={styles.tableHeaderConections}>
                    <Text block>{t('network.protocol')}</Text>
                    <Text block>PID</Text>
                    <Text block>{t('network.localAddress')}</Text>
                    <Text block>{t('network.remoteAddress')}</Text>
                    <Text block>{t('network.state')}</Text>
                </div>

                {loading ? (
                    <div style={{ padding: '12px 0', textAlign: 'center' }}>
                        <Spinner label={t('network.loadingConnections')} size="tiny" />
                    </div>
                ) : connections.length === 0 ? (
                    <Caption1 style={{ textAlign: 'center', padding: '8px 0' }}>
                        {t('network.noConnections')}
                    </Caption1>
                ) : (
                    connections.map((conn, idx) => (
                        <div key={idx} className={styles.tableRowConections}>
                            <div>
                                <Text weight="semibold">{conn.protocol}</Text>
                            </div>
                            <div>
                                <Text size={200}>{conn.pid}</Text>
                            </div>
                            <div>
                                <Text size={200}>{conn.localAddress}</Text>
                            </div>
                            <div>
                                <Text size={200}>{conn.remoteAddress}</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge
                                    appearance="tint"
                                    size="small"
                                    color={conn.state === t('network.established') ? t('network.success') : t('network.warning')}
                                >
                                    {conn.state}
                                </Badge>
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}

export default NetworkMonitorView;