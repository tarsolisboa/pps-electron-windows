import React from 'react';
import { Button, Text, makeStyles, shorthands } from '@fluentui/react-components';
import { t } from '../../i18n';

import themeSvg from '../assets/icons/sun-moon.svg';
import minimizeSvg from '../assets/icons/minus.svg';
import maximizeSvg from '../assets/icons/square.svg';
import closeSvg from '../assets/icons/x.svg';

const useStyles = makeStyles({
    titleBar: {
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shorthands.padding('0px', '0px', '0px', '16px'),
        WebkitAppRegion: 'drag',
        borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
        backdropFilter: 'blur(12px)',
        userSelect: 'none',
        boxSizing: 'border-box',
    },
    titleBarControls: {
        display: 'flex',
        height: '100%',
        WebkitAppRegion: 'no-drag',
    },
    ppsTitle: {
        fontSize: '1rem',
        fontWeight: '700',
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
    },
    controlBtn: {
        minWidth: '42px',
        height: '100%',
        borderRadius: '0px',
        '&:hover': {
            backgroundColor: 'rgba(128, 128, 128, 0.15)',
        },
    },
    closeBtn: {
        minWidth: '42px',
        height: '100%',
        borderRadius: '0px',
        '&:hover': {
            backgroundColor: '#c42b1c',
            color: '#ffffff',
        },
    },
    iconImg: {
        pointerEvents: 'none',
    },
});

export function TitleBar({ onToggleTheme, isDarkMode }) {
    const styles = useStyles();

    const handleMinimize = () => window.api?.window?.minimize?.();
    const handleMaximize = () => window.api?.window?.maximize?.();
    const handleClose = () => window.api?.window?.close?.();

    return (
        <div className={styles.titleBar}>
            <Text className={styles.ppsTitle} style={{ color: isDarkMode ? '#f4fc06' : '#ae0e0e' }}>
                PowerPlan Switcher
            </Text>
            <div className={styles.titleBarControls}>
                <Button
                    appearance="subtle"
                    className={styles.controlBtn}
                    icon={<img src={themeSvg} alt="" width="18" height="18" className={styles.iconImg} style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />}
                    onClick={(e) => onToggleTheme?.(e)}
                    title={t('titlebar.theme')}
                    aria-label={t('titlebar.theme')}
                />
                <Button
                    appearance="subtle"
                    className={styles.controlBtn}
                    icon={<img src={minimizeSvg} alt="" width="16" height="16" className={styles.iconImg} style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />}
                    onClick={handleMinimize}
                    title={t('titlebar.minimize')}
                    aria-label={t('titlebar.minimize')}
                />
                <Button
                    appearance="subtle"
                    className={styles.controlBtn}
                    icon={<img src={maximizeSvg} alt="" width="14" height="14" className={styles.iconImg} style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />}
                    onClick={handleMaximize}
                    title={t('titlebar.maximize')}
                    aria-label={t('titlebar.maximize')}
                />
                <Button
                    appearance="subtle"
                    className={styles.closeBtn}
                    icon={<img src={closeSvg} alt="" width="16" height="16" className={styles.iconImg} style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />}
                    onClick={handleClose}
                    title={t('titlebar.close')}
                    aria-label={t('titlebar.close')}
                />
            </div>
        </div>
    );
}