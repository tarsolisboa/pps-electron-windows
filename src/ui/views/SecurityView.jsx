import React, { useState, useEffect } from 'react';
import {
    Title2,
    Text,
    Card,
    Button,
    Spinner,
    Badge,
    Caption1,
    makeStyles,
    shorthands
} from '@fluentui/react-components';
import { t } from '../../i18n';

import shieldAlertSvg from '../assets/icons/shield-alert.svg';
import shieldCheckSvg from '../assets/icons/shield-check.svg';
import shieldErrorSvg from'../assets/icons/shield-x.svg';
import firewallSvg from '../assets/icons/brick-wall-shield.svg';

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
        color: '#212121', //'#0078d4',
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

export function SecurityView({ isDarkMode }) {
    const styles = useStyles();

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [security, setSecurity] = useState({ os: null, antivirus: [], firewall: [] });

    const loadSecurityData = async () => {
        try {
            if (window.api?.security?.getSecurityStatus) {
                const data = await window.api.security.getSecurityStatus();
                setSecurity(data);
            }
        } catch (e) {
            console.error(e);
            setError(t('security.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenUpdate = async () => {
        try {
            await window.api.security.openWindowsUpdate();
        } catch (e) {
            console.log(e)
        }
    };

    useEffect(() => {
        loadSecurityData();
    }, []);

    const hasAntivirus = security.antivirus && security.antivirus.length > 0;
    const hasFirewall = security.firewall && security.firewall.length > 0;

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('security.title')}</Title2>
                <Text block>{t('security.subtitle')}</Text>
            </div>

            {error && (
                <Card className={styles.card} style={{ backgroundColor: 'rgba(253, 231, 233, 0.35)' }}>
                    <Text weight="semibold" style={{ color: '#a80000' }}>{error}</Text>
                </Card>
            )}

            {loading && !security ? (
                <Card className={styles.card}>
                    <Spinner size="medium" label={t('security.loading')} />
                </Card>
            ) : security && (
                <div>
                    <div style={{ marginBottom: '16px'}}>
                        {/* 1 WINDOWS UPDATE */}
                        <Card className={styles.card}>
                            <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('security.windowsUpdateTitle')}</Text>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                <div>
                                    <Text size={300} style={{ display: 'block' }}>
                                        <strong>{t('security.osName')}</strong>: {security.os?  `${security.os.name}` : 'Windows'}
                                    </Text>
                                    <Text size={300} style={{ display: 'block' }}>
                                        <strong>{t('security.lastUpdate')}</strong>: {security.os?  `${security.os.lastUpdate}` : '-'}
                                    </Text>
                                    <Text size={300} style={{ display: 'block' }}>
                                        <strong>{t('security.windowsBuild')}</strong>: {security.os? `${security.os.build}` : '-'}
                                    </Text>
                                </div>
                                <Button 
                                    appearance="primary" 
                                    onClick={handleOpenUpdate}
                                >
                                    {t('security.openUpdateSettings')}
                                </Button>
                            </div>
                        </Card>
                    </div>
                    <div className={styles.gridCards}>
                        {/* 2 ANTIVIRUS */}
                        <Card className={styles.card}>
                            <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('security.antivirusTitle')}</Text>
                            <div>
                                {hasAntivirus ? (
                                    security.antivirus.map((av, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {av.enabled ? <img src={shieldCheckSvg}/> : <img src={shieldAlertSvg}/>}
                                                <Text weight="medium">{av.name}</Text>
                                            </div>
                                            <Badge appearance="filled" color={av.enabled ? 'success' : 'danger'}>
                                                {av.enabled ? t('security.active') : t('security.inactive')}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <img src={shieldErrorSvg} style={{ verticalAlign: 'middle' }}/>
                                            {t('security.noAntivirusDetected')}
                                        </div>
                                </div> 
                                )}
                            </div>
                        </Card>
                        
                        {/* 3 FIREWALL */}
                        <Card className={styles.card}>
                            <Text weight="semibold" size={500} className={styles.sectionTitle}>{t('security.firewallTitle')}</Text>
                            <div>
                                {hasFirewall ? (
                                    security.firewall.map((fw, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {fw.Enabled ? <img src={firewallSvg}/> : <img src={firewallSvg}/>}
                                                <Text weight="medium">{t(`security.${fw.Name.toLowerCase()}`)}</Text>
                                            </div>
                                            <Badge appearance="filled" color={fw.Enabled ? 'success' : 'danger'}>
                                                {fw.Enabled ? t('security.active') : t('security.inactive')}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <img src={shieldErrorSvg} style={{ verticalAlign: 'middle' }}/>
                                            {t('security.noFirewallDetected')}
                                        </div>
                                </div> 
                                )}
                            </div>
                        </Card>

                    </div>
                </div>
            )}
        </div>
    );
}

export default SecurityView;