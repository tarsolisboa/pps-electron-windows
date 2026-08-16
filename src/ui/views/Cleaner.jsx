import React, { useState, useEffect } from 'react';
import {
    Title2,
    Text,
    Card,
    CardHeader,
    ProgressBar,
    Badge,
    Button,
    Caption1,
    Checkbox,
    Spinner,
    makeStyles,
    shorthands,
    mergeClasses
} from '@fluentui/react-components';
import { t } from '../../i18n';

// IMPORTAÇÃO DOS SVGS LOCAIS
import diskSvg from '../assets/icons/hard-drive.svg';
import checkSvg from '../assets/icons/check.svg';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
    },
    flexCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(12px)',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    compactCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(12px)',
    },
    iconBadge: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        color: '#fff',
    },
    summaryHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '12px',
    },
    categoryTwoColumns: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        columnGap: '24px',
        rowGap: '4px',
        marginTop: '12px',
        '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
        }
    },
    categoryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shorthands.padding('8px', '0px'),
        borderBottom: '1px solid rgba(0,0,0,0.05)',
    },
    actionGroup: {
        display: 'flex',
        ...shorthands.gap('8px'),
        alignItems: 'center',
    },
    categoriesHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
    }
});

export function CleanerView({ isDarkMode }) {
    const styles = useStyles();

    const [categories, setCategories] = useState([
        { id: 'system_temp', label: t('cleaner.category.systemTemp'), sizeBytes: 0, checked: true },
        { id: 'trash_bin', label: t('cleaner.category.trashBin'), sizeBytes: 0, checked: true },
        { id: 'user_cache', label: t('cleaner.category.userCache'), sizeBytes: 0, checked: true },
        { id: 'browser_cache', label: t('cleaner.category.browserCache'), sizeBytes: 0, checked: true },
        { id: 'system_logs', label: t('cleaner.category.systemLogs'), sizeBytes: 0, checked: false },
    ]);

    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);

    const allChecked = categories.every(item => item.checked);
    const isIndeterminate = categories.some(item => item.checked) && !allChecked;

    const totalSelectedBytes = categories
        .filter(c => c.checked)
        .reduce((sum, c) => sum + c.sizeBytes, 0);

    const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return `0 ${t('units.mb')}`;
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) return `${(mb / 1024).toFixed(2)} ${t('units.gb')}`;
        return `${mb.toFixed(0)} ${t('units.mb')}`;
    };

    const handleToggleCategory = (id) => {
        if (status === 'scanning' || status === 'cleaning') return;
        setCategories(prev =>
            prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
    };

    const handleToggleSelectAll = () => {
        if (status === 'scanning' || status === 'cleaning') return;
        const targetState = !allChecked;
        setCategories(prev => prev.map(item => ({ ...item, checked: targetState })));
    };

    const handleStartScan = async () => {
        setStatus('scanning');
        setProgress(10);

        try {
            const scanResults = await window.api?.cleaner?.scan?.();

            if (scanResults && Array.isArray(scanResults)) {
                setCategories(prev => prev.map(cat => {
                    const found = scanResults.find(r => r.id === cat.id);
                    // O backend agora retorna sizeBytes
                    return found ? { ...cat, sizeBytes: found.sizeBytes || 0 } : cat;
                }));
            }
        } catch (error) {
            console.error('Error during system scan:', error);
        } finally {
            setProgress(100);
            setStatus('ready');
        }
    };

    const handleStartClean = async () => {
        setStatus('cleaning');
        setProgress(20);

        const selectedIds = categories.filter(c => c.checked).map(c => c.id);

        try {
            await window.api?.cleaner?.clean?.(selectedIds);
            setStatus('completed');
            setCategories(prev => prev.map(c => c.checked ? { ...c, sizeBytes: 0, checked: false } : c));
        } catch (error) {
            console.error('Error during system cleaning:', error);
        }
    };

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('cleaner.title')}</Title2>
                <Text block>{t('cleaner.subtitle')}</Text>
            </div>

            <Card className={mergeClasses(styles.compactCard)}>
                <CardHeader 
                    image={
                        <div className={styles.iconBadge}>
                            <img src={diskSvg} alt="Disk" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }}/>
                        </div>
                    }
                    header={<Text weight="semibold">{t('cleaner.storageTitle')}</Text>}
                    description={t('cleaner.storageDesc')}
                />

                <div className={styles.summaryHeader}>
                    <Text size={700} weight="bold">{formatSize(totalSelectedBytes)}</Text>
                    <div className={styles.actionGroup}>
                        <Button
                            size="small"
                            appearance="secondary"
                            onClick={handleStartScan}
                            disabled={status === 'scanning' || status === 'cleaning'}
                            icon={status === 'scanning' ? <Spinner size="tiny" /> : null}
                        >
                            {status === 'scanning' ? t('cleaner.scanning') : t('cleaner.scanDisk')}
                        </Button>
                        <Button
                            size="small"
                            appearance="primary"
                            onClick={handleStartClean}
                            disabled={totalSelectedBytes === 0 || status === 'scanning' || status === 'cleaning'}
                            icon={status === 'cleaning' ? <Spinner size="tiny" /> : null}
                        >
                            {status === 'cleaning' ? t('cleaner.cleaning') : t('cleaner.cleanSelected')}
                        </Button>
                    </div>
                </div>

                {(status === 'scanning' || status === 'cleaning') && (
                    <div style={{ marginTop: '8px' }}>
                        <Caption1 block style={{ marginBottom: '4px' }}>
                            {status === 'scanning' ? t('cleaner.verifyingDirs') : t('cleaner.removingFiles')}
                        </Caption1>
                        <ProgressBar value={progress / 100} color="brand" />
                    </div>
                )}
            </Card>

            {status === 'completed' && (
                <Card className={mergeClasses(styles.compactCard)}>
                    <div>
                        <img src={checkSvg} style={{ verticalAlign: 'middle', margin: '0 8px 0 0' }} alt="Check" width="20" height="20" />
                        <Text weight="semibold" style={{ color: '#107c41' }}>
                            {t('cleaner.completedSuccess')}
                        </Text>
                        <Caption1 block>
                            <strong>{t('cleaner.noteLabel')}:</strong> {t('cleaner.completedNote')}
                        </Caption1>
                    </div>
                </Card>
            )}

            <Card className={mergeClasses(styles.flexCard)}>
                <div>
                    <div className={styles.categoriesHeader}>
                        <Text weight="semibold">{t('cleaner.categoriesTitle')}</Text>
                        <Checkbox
                            label={t('cleaner.selectAll')}
                            checked={isIndeterminate ? 'mixed' : allChecked}
                            onChange={handleToggleSelectAll}
                            disabled={status === 'scanning' || status === 'cleaning'}
                        />
                    </div>

                    <div className={styles.categoryTwoColumns}>
                        {categories.map((item) => (
                            <div key={item.id} className={styles.categoryRow}>
                                <Checkbox
                                    label={item.label}
                                    checked={item.checked}
                                    onChange={() => handleToggleCategory(item.id)}
                                    disabled={status === 'scanning' || status === 'cleaning'}
                                />
                                <Badge appearance="tint" color={item.sizeBytes > 1024 * 1024 * 1024 ? "danger" : "brand"}>
                                    {formatSize(item.sizeBytes)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default CleanerView;