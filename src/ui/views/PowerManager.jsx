import { useState, useEffect } from 'react';
import { Title2, Card, Text, Button, Badge, Spinner, makeStyles, shorthands } from '@fluentui/react-components';
import { t } from '../../i18n';

const useStyles = makeStyles({
    container: { display: 'flex', flexDirection: 'column', ...shorthands.gap('16px'), width: '100%', boxSizing: 'border-box' },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.35)', backdropFilter: 'blur(12px)', ...shorthands.padding('24px'), width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', ...shorthands.gap('16px') },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    tableHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 120px', paddingBottom: '12px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', fontWeight: '600' },
    tableRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 120px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.04)' },
    planInfo: { display: 'flex', flexDirection: 'column', ...shorthands.gap('2px') }
});

export function PowerManagerView() {
    const styles = useStyles();
    const [plans, setPlans] = useState([]);
    const [battery, setBattery] = useState({ level: null, statusCode: 'desktop' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const loadData = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            if (window.api?.power) {
                const [p, b] = await Promise.all([
                    window.api.power.getPlans(),
                    window.api.power.getBattery()
                ]);
                setPlans(p || []);
                setBattery(b || { level: null, statusCode: 'desktop' });
            }
        } catch (e) {
            setError(t('power.errorLoad'));
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    

    // 2. Escuta isolada da bandeja do sistema (não interfere no carregamento dos planos)
    useEffect(() => {
        loadData(true); // Carregamento inicial

        if (window.api?.power?.onPlanChanged) {
            window.api.power.onPlanChanged((newPlanId) => {
                loadData(false); // Recarrega os dados silenciosamente ao receber o aviso do Tray
            });
        }
    }, []);

    const handleSetPlan = async (id) => {
        setError(null);
        setUpdatingId(id);
        try {
            const result = await window.api.power.setPlan(id);
            if (result && !result.success) {
                setError(`${t('power.restrictedAccess')} (${result.error})`);
            } else {
                await loadData(false);
            }
        } catch (e) {
            setError(t('power.errorPlan'));
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className={styles.container}>
            <Title2>{t('power.title')}</Title2>

            {error && (
                <Card className={styles.card} style={{ backgroundColor: 'rgba(253, 231, 233, 0.7)' }}>
                    <Text weight="semibold" style={{ color: '#a80000' }}>{error}</Text>
                </Card>
            )}

            <Card className={styles.card}>
                <div className={styles.headerRow}>
                    <Text weight="semibold" size={500}>{t('power.batteryStatusTitle')}</Text>
                    <Badge appearance="filled" color={battery.statusCode === 'battery' && battery.level > 20 ? 'success' : battery.statusCode === 'battery' ? 'danger' : 'brand'}>
                        {t(`power.status.${battery.statusCode}`)}
                    </Badge>
                </div>
                {loading ? <Spinner size="tiny" /> : (
                    <div className={styles.planInfo}>
                        <Text size={700} weight="bold">
                            {battery.level !== null ? `${battery.level}%` : t('power.plugged')}
                        </Text>
                        <Text size={200}>{t('power.batteryDesc')}</Text>
                    </div>
                )}
            </Card>

            <Card className={styles.card}>
                <Text weight="semibold" size={500}>{t('power.modesTitle')}</Text>
                {loading ? <Spinner size="tiny" /> : (
                    plans.length === 0 ? (
                        <Text>{t('power.noPlans')}</Text>
                    ) : (
                        <div>
                            <div className={styles.tableHeader}>
                                <Text>{t('power.planProfile')}</Text>
                                <Text>{t('power.identifier')}</Text>
                                <Text style={{ textAlign: 'center' }}>{t('power.action')}</Text>
                            </div>
                            <div>
                                {plans.map(plan => (
                                    <div key={plan.id} className={styles.tableRow}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Text weight="semibold">{plan.name || t('common.unknown')}</Text>
                                            {plan.active && <Badge appearance="tint" color="brand">{t('power.active')}</Badge>}
                                        </div>
                                        <Text size={200}>{plan.id}</Text>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Button
                                                appearance={plan.active ? "secondary" : "primary"}
                                                disabled={plan.active || updatingId === plan.id}
                                                onClick={() => handleSetPlan(plan.id)}
                                            >
                                                {updatingId === plan.id ? <Spinner size="tiny" /> : (plan.active ? t('power.activated') : t('power.activate'))}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}

export default PowerManagerView;