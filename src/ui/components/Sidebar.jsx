import React, { memo } from 'react';
import { Button, makeStyles, shorthands } from '@fluentui/react-components';
import { t } from '../../i18n';

// IMPORTAÇÃO DOS SVGS LOCAIS
import dashboardSvg from '../assets/icons/layout-dashboard.svg';
import performanceSvg from '../assets/icons/monitor-check.svg';
import powerSvg from '../assets/icons/battery-charging.svg';
import networkSvg from '../assets/icons/network.svg';
import processSvg from '../assets/icons/blocks.svg';
import startupSvg from '../assets/icons/rocket.svg';
import cleanerSvg from '../assets/icons/brush-cleaning.svg';
import uninstallerSvg from '../assets/icons/package.svg';
import settingsSvg from '../assets/icons/settings.svg';
import accountSvg from '../assets/icons/circle-user.svg';

const useStyles = makeStyles({
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('8px'),
        ...shorthands.padding('8px'),
        width: '56px',
        borderRight: '1px solid rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        height: '100%',
        boxSizing: 'border-box',
    },
    flexButton: {
        backdropFilter: 'blur(12px)',
    },
});

export const Sidebar = memo(function Sidebar({ currentTab, onSelectTab, isDarkMode }) {
    const styles = useStyles();

    const menuItems = [
        { id: 'dashboard', icon: <img src={dashboardSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.dashboard') },
        { id: 'hardware', icon: <img src={performanceSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.hardware') },
        { id: 'power', icon: <img src={powerSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.power') },
        { id: 'network', icon: <img src={networkSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.network') },
        { id: 'process', icon: <img src={processSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.process') },
        { id: 'startup', icon: <img src={startupSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.startup') },
        { id: 'cleaner', icon: <img src={cleanerSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.cleaner') },
        { id: 'uninstaller', icon: <img src={uninstallerSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.uninstaller') },
        { id: 'settings', icon: <img src={settingsSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.settings') },
        { id: 'about', icon: <img src={accountSvg} alt="" style={{ filter: isDarkMode ? 'invert(1)' : 'none' }} />, label: t('nav.account') },
    ];

    return (
        <div className={styles.sidebar}>
            {menuItems.map((item) => (
                <div key={item.id}>
                    <Button
                        appearance={currentTab === item.id ? 'secondary' : 'subtle'}
                        className={styles.flexButton}
                        icon={item.icon}
                        onClick={() => onSelectTab(item.id)}
                        title={item.label}
                        size="large"
                    />
                </div>
            ))}
        </div>
    );
});