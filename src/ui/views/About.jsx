import React, { useState } from 'react';
import {
    Title2,
    Text,
    Card,
    CardHeader,
    Button,
    Switch,
    Select,
    Input,
    Caption1,
    Spinner,
    makeStyles,
    shorthands
} from '@fluentui/react-components';
import { t, getLocale, setLocale } from '../../i18n';

import codeSvg from '../assets/icons/code.svg';
import frameworkSvg from '../assets/icons/frame.svg';
import componentSvg from '../assets/icons/component.svg';
import windowSvg from '../assets/icons/app-window.svg';
import coffeeSvg from '../assets/icons/coffee.svg';

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
        ...shorthands.gap('16px'),
        border: '1px solid rgba(0, 0, 0, 0.04)'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
    },
    rowBetween: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shorthands.padding('8px', '0px')
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('6px'),
        maxWidth: '400px'
    },

});

export function AboutView({ isDarkMode }) {
    const styles = useStyles();

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('about.title')}</Title2>
                <Text block>{t('about.subtitle')}</Text>
            </div>

            <Card className={styles.card}>
                <div className={styles.sectionHeader}>
                    <Text weight="semibold" size={500}>{t('about.appWhatIsTitle')}</Text>
                </div>
                <div className={styles.actionRow}>
                    <Text block>
                        {t('about.appDesc')}
                    </Text>
                </div>
                <div className={styles.actionRow}>
                    <Button
                        appearance="secondary"
                        icon={<img src={coffeeSvg} alt="" width="16" height="16" className={styles.iconImg} style={{ filter: 'brightness(0) saturate(100%) invert(15%) sepia(80%) saturate(7497%) hue-rotate(359deg) brightness(106%) contrast(117%)' }} />}
                        onClick={() => window.open('https://buymeacoffee.com/', '_blank')}
                        title={t('about.coffee')}
                        aria-label={t('about.coffee')}
                    >
                        {t('about.coffee')}
                    </Button>
                </div>
            </Card>

            <Card className={styles.card}>
                <div className={styles.sectionHeader}>
                    <Text weight="semibold" size={500}>{t('about.licenseUseTitle')}</Text>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div className={styles.inputGroup}>
                        <CardHeader
                            image={<div className={styles.iconBadge}><img src={componentSvg} alt="CPU" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
                            header={<Text weight="semibold">{t('about.iconsTitle')}</Text>}
                            description=""
                        />
                        <Caption1>
                            <Text block size={230} style={{ fontWeight: 600 }}>
                                https://lucide.dev/
                            </Text>
                            <Text block size={200}>
                                <div dangerouslySetInnerHTML={{ __html: t('about.iconsDesc') }} />
                            </Text>
                        </Caption1>
                    </div>
                    <div className={styles.inputGroup}>
                        <CardHeader
                            image={<div className={styles.iconBadge}><img src={windowSvg} alt="CPU" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
                            header={<Text weight="semibold">{t('about.componentsTitle')}</Text>}
                            description=""
                        />
                        <Caption1 block>
                            <Text block size={230} style={{ fontWeight: 600 }}>
                                https://react.fluentui.dev/
                            </Text>
                            <Text block size={200}>
                                <div dangerouslySetInnerHTML={{ __html: t('about.componentsDesc') }} />
                            </Text>
                        </Caption1>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div className={styles.inputGroup}>
                        <CardHeader
                            image={<div className={styles.iconBadge}><img src={codeSvg} alt="CPU" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
                            header={<Text weight="semibold">{t('about.codeTitle')}</Text>}
                            description=""
                        />
                        <Caption1 block>
                            <Text block size={230} style={{ fontWeight: 600 }}>
                                https://react.dev/
                            </Text>
                            <Text block size={200}>
                                <div dangerouslySetInnerHTML={{ __html: t('about.codeDesc') }} />
                            </Text>
                        </Caption1>
                    </div>
                    <div className={styles.inputGroup}>
                        <CardHeader
                            image={<div className={styles.iconBadge}><img src={frameworkSvg} alt="CPU" width="20" height="20" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} /></div>}
                            header={<Text weight="semibold">{t('about.fwTitle')}</Text>}
                            description=""
                        />
                        <Caption1 block>
                            <Text block size={230} style={{ fontWeight: 600 }}>
                                https://www.electronjs.org/
                            </Text>
                            <Text block size={200}>
                                <div dangerouslySetInnerHTML={{ __html: t('about.fwDesc') }} />
                            </Text>
                        </Caption1>
                    </div>
                </div>
            </Card>

        </div>
    );
}

export default AboutView;