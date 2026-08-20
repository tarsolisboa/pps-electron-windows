import React, { useState, useEffect } from 'react';
import {
    Title2,
    Text,
    Card,
    Button,
    Caption1,
    Input,
    Select,
    Spinner,
    makeStyles,
    shorthands
} from '@fluentui/react-components';
import { t } from '../../i18n';

import searchSvg from '../assets/icons/search.svg';
import gridSvg from '../assets/icons/grid-3x3.svg';
import listSvg from '../assets/icons/list.svg';
import appSvg from '../assets/icons/app-window.svg';

const useStyles = makeStyles({
    container: { display: 'flex', flexDirection: 'column', ...shorthands.gap('16px') },
    topControlCard: { backgroundColor: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...shorthands.padding('14px', '18px'), border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', ...shorthands.gap('16px') },
    controlsRow: { display: 'flex', alignItems: 'center', ...shorthands.gap('12px'), width: '100%' },
    searchInput: { flexGrow: 2, minWidth: '280px', height: '40px' },
    selectFilter: { minWidth: '160px', height: '40px' },
    toggleBtn: { backgroundColor: 'transparent', border: '1px solid rgba(0, 0, 0, 0.12)', height: '40px', ...shorthands.padding('0px', '14px') },
    counterText: { whiteSpace: 'nowrap', minWidth: '70px', textAlign: 'right' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', ...shorthands.gap('12px') },
    gridCard: { backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', ...shorthands.padding('12px') },
    stackedContainer: { display: 'flex', flexDirection: 'column', ...shorthands.gap('6px') },
    stackedRow: { backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...shorthands.padding('10px', '14px'), border: '1px solid rgba(0, 0, 0, 0.05)', borderRadius: '6px' },
    iconWrapper: { width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(0, 120, 212, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    appName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    uninstallBtn: { backgroundColor: '#d13438', color: '#ffffff', fontWeight: '600', border: 'none', height: '30px', ...shorthands.padding('0px', '14px') }
});

function formatLocaleDate(isoDate) {
    if (!isoDate) return '-';
    try {
        const [year, month, day] = isoDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat(window.navigator.language || 'pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(dateObj);
    } catch (e) {
        return '-';
    }
}

export function UninstallerView({ isDarkMode }) {
    const styles = useStyles();
    const [apps, setApps] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [viewMode, setViewMode] = useState('stacked');
    const [loading, setLoading] = useState(true);

    const loadApps = async () => {
        setLoading(true);
        try {
            if (window.api?.uninstaller?.getApps) {
                const res = await window.api.uninstaller.getApps();
                setApps(res || []);
            }
        } catch (e) {} finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadApps(); }, []);

    const handleUninstall = async (uninstallString, appName) => {
        if (window.confirm(t('uninstaller.confirmUninstall').replace('{appName}', appName))) {
            try {
                if (window.api?.uninstaller?.uninstall) {
                    await window.api.uninstaller.uninstall(uninstallString);
                }
            } catch (e) {}
        }
    };

    const filtered = apps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.publisher && app.publisher.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedApps = [...filtered].sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        return 0;
    });

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('uninstaller.title')}</Title2>
                <Text block>{t('uninstaller.subtitle')}</Text>
            </div>

            <Card className={styles.topControlCard}>
                <div className={styles.controlsRow}>
                    <Input
                        className={styles.searchInput}
                        placeholder={t('uninstaller.searchPlaceholder')}
                        value={searchTerm}
                        contentBefore={<img src={searchSvg} alt="Search" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/>}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="medium"
                        style={{ maxHeight: '30px' }}
                        clearable
                    />

                    <Select className={styles.selectFilter} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="name-asc">{t('uninstaller.sortAZ')}</option>
                        <option value="name-desc">{t('uninstaller.sortZA')}</option>
                    </Select>

                    <Button size="small" className={styles.toggleBtn} onClick={() => setViewMode(prev => prev === 'grid' ? 'stacked' : 'grid')}>
                        <img src={viewMode === 'grid' ? listSvg : gridSvg} alt="Toggle" width="15" height="15" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/>
                    </Button>

                    <Text size={300} weight="semibold" className={styles.counterText}>
                        {t('uninstaller.appsCount').replace('{count}', sortedApps.length)}
                    </Text>
                </div>
            </Card>

            {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Spinner label={t('uninstaller.loading')} size="medium" />
                </div>
            ) : sortedApps.length === 0 ? (
                <Caption1 style={{ textAlign: 'center', padding: '24px 0', display: 'block' }}>
                    {t('uninstaller.noApps')}
                </Caption1>
            ) : viewMode === 'stacked' ? (
                <div className={styles.stackedContainer}>
                    {sortedApps.map((app) => (
                        <div key={app.id} className={styles.stackedRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flexGrow: 1 }}>
                                <div className={styles.iconWrapper}>
                                    <img src={appSvg} alt="App" width="18" height="18" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Text weight="semibold" size={200} className={styles.appName} title={app.name}>{app.name}</Text>
                                    <Caption1 style={{ color: '#212121' }}>{app.publisher || t('common.unknown_publisher')}</Caption1>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                                <Caption1 style={{ opacity: 0.6, fontSize: '11px' }}>
                                    v{app.version || t('common.unknown_version')}
                                </Caption1>
                                <Caption1 style={{ opacity: 0.8, fontSize: '11px', minWidth: '90px', textAlign: 'right' }}>
                                   {formatLocaleDate(app.installDate)}
                                </Caption1>
                                <Button size="small" className={styles.uninstallBtn} onClick={() => handleUninstall(app.uninstallString, app.name)}>
                                    {t('uninstaller.uninstall')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.gridContainer}>
                    {sortedApps.map((app) => (
                        <Card key={app.id} className={styles.gridCard}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div className={styles.iconWrapper}>
                                    <img src={appSvg} alt="App" width="18" height="18" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Text weight="semibold" size={200} className={styles.appName} title={app.name}>{app.name}</Text>
                                    <Caption1 style={{ color: '#212121' }}>{app.publisher || t('common.unknown_publisher')}</Caption1>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <Caption1 style={{ opacity: 0.5, fontSize: '10px' }}>v{app.version || t('common.unknown_version')}</Caption1>
                                    <Caption1 style={{ opacity: 0.8, fontSize: '11px', fontWeight: '500' }}>{formatLocaleDate(app.installDate)}</Caption1>
                                </div>
                                <Button size="small" className={styles.uninstallBtn} onClick={() => handleUninstall(app.uninstallString, app.name)}>
                                    {t('uninstaller.uninstall')}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default UninstallerView;