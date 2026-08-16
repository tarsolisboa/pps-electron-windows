import { useState, useEffect, useMemo } from 'react';
import { Title2, Card, Text, Button, Badge, Spinner, Input, makeStyles, shorthands } from '@fluentui/react-components';
import { t } from '../../i18n';

const useStyles = makeStyles({
    container: { display: 'flex', flexDirection: 'column', ...shorthands.gap('16px'), width: '100%', boxSizing: 'border-box' },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(12px)', ...shorthands.padding('24px'), width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', ...shorthands.gap('16px') },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', paddingBottom: '12px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', fontWeight: '600' },
    sortableHeader: { cursor: 'pointer', userSelect: 'none' },
    tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }
});

export function ProcessManagerView() {
    const styles = useStyles();
    const [processes, setProcesses] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [killingPid, setKillingPid] = useState(null);
    
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    const loadProcesses = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            if (!window.api?.process) {
                throw new Error("API not exposed.");
            }
            const list = await window.api.process.getList();
            setProcesses(list || []);
        } catch (e) {
            setError(e.message || t('process.errorLoad'));
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    useEffect(() => {
        loadProcesses(true);
        const interval = setInterval(() => loadProcesses(false), 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleKill = async (pid) => {
        setError(null);
        setKillingPid(pid);
        try {
            const res = await window.api.process.killProcess(pid);
            if (res && !res.success) {
                setError(`${t('process.errorKill')} ${pid}: ${res.error}`);
            } else {
                await loadProcesses(false);
            }
        } catch (e) {
            setError(t('process.errorCommand'));
        } finally {
            setKillingPid(null);
        }
    };

    const processedList = useMemo(() => {
        let result = processes.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            String(p.pid).includes(search)
        );

        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (sortField === 'pid' || sortField === 'memoryKB') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            } else {
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [processes, search, sortField, sortDirection]);

    const getSortIndicator = (field) => {
        if (sortField !== field) return '';
        return sortDirection === 'asc' ? ' ▲' : ' ▼';
    };

    return (
        <div className={styles.container}>
            <Title2>{t('process.title')}</Title2>

            {error && (
                <Card className={styles.card} style={{ backgroundColor: 'rgba(253, 231, 233, 0.7)' }}>
                    <Text weight="semibold" style={{ color: '#a80000' }}>{error}</Text>
                </Card>
            )}

            <Card className={styles.card}>
                <div className={styles.headerRow}>
                    <Text weight="semibold" size={500}>{t('process.runningTitle')}</Text>
                    <Input 
                        placeholder={t('process.searchPlaceholder')} 
                        value={search} 
                        onChange={(e, data) => setSearch(data.value)} 
                        style={{ width: '260px' }}
                    />
                </div>

                {loading ? <Spinner size="medium" style={{ marginTop: '20px' }} /> : (
                    <div>
                        <div className={styles.tableHeader}>
                            <Text className={styles.sortableHeader} onClick={() => handleSort('name')}>{t('process.colName')}{getSortIndicator('name')}</Text>
                            <Text className={styles.sortableHeader} onClick={() => handleSort('pid')}>PID{getSortIndicator('pid')}</Text>
                            <Text className={styles.sortableHeader} onClick={() => handleSort('type')}>{t('process.colType')}{getSortIndicator('type')}</Text>
                            <Text className={styles.sortableHeader} onClick={() => handleSort('memoryKB')}>{t('process.colMemory')}{getSortIndicator('memoryKB')}</Text>
                            <Text style={{ textAlign: 'center' }}>{t('process.colAction')}</Text>
                        </div>
                        <div>
                            {processedList.length === 0 ? (
                                <Text style={{ padding: '20px 0', textAlign: 'center', display: 'block' }}>{t('process.noProcesses')}</Text>
                            ) : (
                                processedList.map(p => (
                                    <div key={p.pid} className={styles.tableRow}>
                                        <Text weight="semibold" truncate wrap={false}>{p.name}</Text>
                                        <Text size={200}>{p.pid}</Text>
                                        <Text size={200}>{p.type || '-'}</Text>
                                        <Text size={200}>{Math.round((p.memoryKB || 0) / 1024)} {t('units.mb')}</Text>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Button 
                                                appearance="primary" 
                                                size="small"
                                                style={{ backgroundColor: '#a80000', color: '#fff' }}
                                                disabled={killingPid === p.pid}
                                                onClick={() => handleKill(p.pid)}
                                            >
                                                {killingPid === p.pid ? <Spinner size="tiny" /> : t('process.kill')}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default ProcessManagerView;