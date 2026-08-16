import React, { useState, useEffect } from 'react';
import { Title2, Card, Text, Spinner, makeStyles, shorthands } from '@fluentui/react-components';
import { t } from '../../i18n';

const useStyles = makeStyles({
    container: { 
        display: 'flex', 
        flexDirection: 'column', 
        ...shorthands.gap('16px'), 
        width: '100%', 
        boxSizing: 'border-box' 
    },
    card: { 
        backgroundColor: 'rgba(255, 255, 255, 0.35)', 
        backdropFilter: 'blur(12px)', 
        ...shorthands.padding('24px'), 
        width: '100%', 
        boxSizing: 'border-box', 
        display: 'flex', 
        flexDirection: 'column', 
        ...shorthands.gap('12px'),
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.04)'
    },
    gridCards: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '16px' 
    },
    specRow: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '6px 0', 
        borderBottom: '1px solid rgba(0,0,0,0.04)' 
    },
    sectionTitle: {
        marginBottom: '4px',
        color:  '#212121', //'#0078d4',
        fontWeight: '600',
    },
    subItemBox: {
        padding: '8px 0',
        borderBottom: '1px dashed rgba(0,0,0,0.08)',
        '&:last-child': {
            borderBottom: 'none'
        }
    }
});

export function HardwareInformationView({ isDarkMode }) {
    const styles = useStyles();
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return `0 ${t('units.gb')}`;
        const gb = bytes / (1024 ** 3);
        if (gb >= 1) return `${gb.toFixed(1)} ${t('units.gb')}`;
        return `${(bytes / (1024 ** 2)).toFixed(0)} ${t('units.mb')}`;
    };

    const loadHardwareData = async () => {
        try {
            if (window.api?.hardware?.getDetailedInfo) {
                const data = await window.api.hardware.getDetailedInfo();
                setInfo(data);
            }
        } catch (e) {
            console.error(e);
            setError(t('hardware.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHardwareData();
    }, []);

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('hardware.title')}</Title2>
                <Text block>{t('hardware.subtitle')}</Text>
            </div>

            {error && (
                <Card className={styles.card} style={{ backgroundColor: 'rgba(253, 231, 233, 0.7)' }}>
                    <Text weight="semibold" style={{ color: '#a80000' }}>{error}</Text>
                </Card>
            )}

            {loading && !info ? (
                <Card className={styles.card}>
                    <Spinner size="medium" label={t('hardware.loading')} />
                </Card>
            ) : info && (
                <div className={styles.gridCards}>
                    
                    {/* 1. PROCESSADOR (CPU) */}
                    <Card className={styles.card}>
                        <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('hardware.cpuTitle')}</Text>
                        <div className={styles.specRow}>
                            <Text size={200}>{t('hardware.model')}</Text>
                            <Text weight="semibold" size={200}>{info.cpu.manufacturer} {info.cpu.brand}</Text>
                        </div>
                        <div className={styles.specRow}>
                            <Text size={200}>{t('hardware.coresThreads')}</Text>
                            <Text weight="semibold" size={200}>{info.cpu.cores} Cores / {info.cpu.threads} Threads</Text>
                        </div>
                        <div className={styles.specRow} style={{ borderBottom: 'none' }}>
                            <Text size={200}>{t('hardware.clock')}</Text>
                            <Text weight="semibold" size={200}>{info.cpu.speedGHz} {t('units.ghz')}</Text>
                        </div>
                    </Card>

                    {/* 2. PLACA-MÃE E BIOS */}
                    <Card className={styles.card}>
                        <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('hardware.motherboardBios')}</Text>
                        <div className={styles.specRow}>
                            <Text size={200}>{t('hardware.manufacturer')}</Text>
                            <Text weight="semibold" size={200}>{info.motherboard.manufacturer || t('common.unknown')}</Text>
                        </div>
                        <div className={styles.specRow}>
                            <Text size={200}>{t('hardware.model')}</Text>
                            <Text weight="semibold" size={200}>{info.motherboard.model || t('common.unknown')}</Text>
                        </div>
                        <div className={styles.specRow} style={{ borderBottom: 'none' }}>
                            <Text size={200}>{t('hardware.version')}</Text>
                            <Text weight="semibold" size={200}>{info.bios.vendor} {info.bios.version}</Text>
                        </div>
                    </Card>

                    {/* 3. MEMÓRIA RAM */}
                    <Card className={styles.card}>
                        <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('hardware.ramTitle')}</Text>
                        <div className={styles.specRow}>
                            <Text size={200}>{t('hardware.totalCapacity')}</Text>
                            <Text weight="semibold" size={200}>{formatBytes(info.memory.totalBytes)}</Text>
                        </div>
                        <div className={styles.specRow}>
                            <Text size={200}>{t('hardware.used')}</Text>
                            <Text weight="semibold" size={200}>{formatBytes(info.memory.usedBytes)}</Text>
                        </div>
                        <div style={{ marginTop: '4px' }}>
                            {info.memory.sticks.map((stick, idx) => (
                                <div key={idx} className={styles.subItemBox}>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={200} weight="semibold">{t('hardware.stick')} {idx + 1} ({formatBytes(stick.sizeBytes)})</Text>
                                        <Text size={200}>{stick.clockSpeed ? `${stick.clockSpeed} MHz` : ''}</Text>
                                    </div>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={100} style={{ opacity: 0.7 }}>{t('hardware.manufacturer')}: {stick.manufacturer || t('common.unknown')}</Text>
                                        <Text size={100} style={{ opacity: 0.7 }}>S/N: {stick.serialNum || t('common.na')}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* 4. PLACAS DE VÍDEO (GPU) + DirectX */}
                    <Card className={styles.card}>
                        <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('hardware.gpuTitle')}</Text>
                        {info.gpus.length === 0 ? (
                            <Text size={200}>{t('hardware.noDrives')}</Text>
                        ) : (
                            info.gpus.map((gpu, idx) => (
                                <div key={idx} className={styles.subItemBox}>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={200} weight="semibold">{gpu.model || t('common.unknown')}</Text>
                                    </div>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={200}>VRAM</Text>
                                        <Text weight="semibold" size={200}>{formatBytes(gpu.vramBytes)}</Text>
                                    </div>
                                    
                                    {/* NOVAS INFORMAÇÕES EXTRAS DA GPU */}
                                    {gpu.chipset && (
                                        <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                            <Text size={100} style={{ opacity: 0.7 }}>{t('hardware.chipset')}</Text>
                                            <Text size={100} weight="semibold">{gpu.chipset}</Text>
                                        </div>
                                    )}
                                    {gpu.dacType && (
                                        <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                            <Text size={100} style={{ opacity: 0.7 }}>{t('hardware.dacType')}</Text>
                                            <Text size={100} weight="semibold">{gpu.dacType}</Text>
                                        </div>
                                    )}
                                    {gpu.resolution && (
                                        <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                            <Text size={100} style={{ opacity: 0.7 }}>{t('hardware.resolution')}</Text>
                                            <Text size={100} weight="semibold">{gpu.resolution} {gpu.refreshRate ? `(${gpu.refreshRate})` : ''}</Text>
                                        </div>
                                    )}
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={100} style={{ opacity: 0.7 }}>3D Driver</Text>
                                        <Text size={100} weight="semibold">{gpu.driverVersion || t('common.na')}</Text>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className={styles.specRow} style={{ marginTop: 'auto', borderBottom: 'none', paddingTop: '8px' }}>
                            <Text size={200}>DirectX</Text>
                            <Text weight="semibold" size={200}>DirectX {info.os.directx}</Text>
                        </div>
                    </Card>

                    {/* 5. ARMAZENAMENTO AGRUPADO (Físico + Lógico + Tipo) */}
                    <Card className={styles.card}>
                        <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('hardware.physicalStorage')}</Text>
                        {info.storageGroups.length === 0 ? (
                            <Text size={200}>{t('hardware.noDrives')}</Text>
                        ) : (
                            info.storageGroups.map((disk, idx) => (
                                <div key={idx} className={styles.subItemBox}>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={200} weight="semibold">{disk.name} ({formatBytes(disk.sizeBytes)})</Text>
                                        <Text size={100} weight="bold" style={{ color: '#212121' }}>{disk.interfaceType}</Text>
                                    </div>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={100} style={{ opacity: 0.7 }}>S/N: {disk.serialNum || t('common.na')}</Text>
                                    </div>
                                    {disk.partitions && disk.partitions.map((p, pIdx) => (
                                        <div key={pIdx} className={styles.specRow} style={{ borderBottom: 'none', paddingLeft: '12px', marginTop: '4px' }}>
                                            <Text size={200}>↳ Drive {p.mount} ({p.fileSystem})</Text>
                                            <Text weight="semibold" size={200}>{formatBytes(p.usedBytes)} / {formatBytes(p.totalBytes)} ({p.usePercent}%)</Text>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </Card>

                    {/* 6. MÍDIA ÓPTICA E ÁUDIO */}
                    <Card className={styles.card}>
                        <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('hardware.mediaAndAudio')}</Text>
                        <div className={styles.specRow} style={{ alignItems: 'flex-start' }}>
                            <Text size={200}>{t('hardware.opticalDrive')}</Text>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                                {info.opticalDrives.length > 0 ? (
                                    info.opticalDrives.map((o, idx) => (
                                        <div key={idx}>
                                            <Text weight="semibold" size={200}>{o.name}</Text>
                                            {o.mount && <Text size={100} style={{ opacity: 0.7, display: 'block' }}>Drive {o.mount}</Text>}
                                        </div>
                                    ))
                                ) : (
                                    <Text weight="semibold" size={200}>{t('hardware.noOpticalDrive')}</Text>
                                )}
                            </div>
                        </div>
                        <div className={styles.specRow} style={{ borderBottom: 'none' }}>
                            <Text size={200}>{t('hardware.audioDevice')}</Text>
                            <Text weight="semibold" size={200} style={{ textAlign: 'right' }}>
                                {info.audioDevices[0]?.name || t('common.unknown')}
                            </Text>
                        </div>
                    </Card>

                    {/* 7. PLACAS DE REDE */}
                    <Card className={styles.card}>
                        <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('hardware.networkTitle')}</Text>
                        {info.networkCards && info.networkCards.length > 0 ? (
                            info.networkCards.map((net, idx) => (
                                <div key={idx} className={styles.subItemBox}>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={200} weight="semibold">{net.name}</Text>
                                        <Text size={100} weight="bold" style={{ color: '#212121', textTransform: 'capitalize' }}>{net.type}</Text>
                                    </div>
                                    <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                        <Text size={100} style={{ opacity: 0.7 }}>{t('hardware.ipAddress')}: {net.ip4}</Text>
                                        <Text size={100} style={{ opacity: 0.7 }}>{t('hardware.macAddress')}: {net.mac}</Text>
                                    </div>
                                    {net.speed && (
                                        <div className={styles.specRow} style={{ borderBottom: 'none', padding: '2px 0' }}>
                                            <Text size={100} style={{ opacity: 0.7 }}>{t('hardware.speed')}: {net.speed}</Text>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <Text size={200}>{t('common.na')}</Text>
                        )}
                    </Card>

                </div>
            )}
        </div>
    );
}

export default HardwareInformationView;