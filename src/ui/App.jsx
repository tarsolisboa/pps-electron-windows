import React, { useState, useEffect } from 'react';
import {
    FluentProvider,
    webLightTheme,
    webDarkTheme,
    makeStyles,
    shorthands
} from '@fluentui/react-components';
import { t, getLocale, setLocale } from '../i18n';

// Componentes das Views
import { TitleBar } from './components/TitleBar.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { DashboardView } from './views/Dashboard.jsx';
import { HardwareInformationView } from './views/HardwareInformation.jsx';
import { PowerManagerView } from "./views/PowerManager.jsx";
import { ProcessManagerView } from './views/ProcessManager.jsx';
import { StartupAppsView } from './views/StartupApps.jsx';
import { CleanerView } from './views/Cleaner.jsx';
import { NetworkMonitorView } from './views/NetworkMonitor.jsx';
import { UninstallerView } from './views/Uninstaller.jsx';
import { SettingsView } from './views/Settings.jsx';
import { AboutView } from './views/About.jsx';

const useStyles = makeStyles({
    appContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        transition: 'background 0.3s ease, color 0.3s ease',
    },
    bodyLayout: {
        display: 'flex',
        flexGrow: 1,
        height: 'calc(100vh - 36px)',
        overflow: 'hidden',
    },
    contentArea: {
        flexGrow: 1,
        height: '100%',
        overflowY: 'auto',
        ...shorthands.padding('24px'),
        boxSizing: 'border-box',
    }
});

export function App() {
    const styles = useStyles();
    const [currentTab, setCurrentTab] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Gradientes definidos conforme especificado
    const darkGradient = 'linear-gradient(to right, #434343 0%, black 100%)'; //'linear-gradient(to right, #868f96 0%, #596164 100%)';
    const lightGradient = 'linear-gradient(-225deg, #CBBACC 0%, #2580B3 100%)';

    useEffect(() => {
        const loadGlobalSettings = async () => {
            if (window.api?.settings?.get) {
                const config = await window.api.settings.get();
                setLocale(config.language); // Força o app inteiro a usar o idioma salvo
            }
        };
        loadGlobalSettings();
    }, []);

    const handleToggleTheme = (event) => {
        // Se o navegador não suportar View Transitions ou não houver evento de clique
        if (!document.startViewTransition || !event) {
            setIsDarkMode((prev) => {
                const newMode = !prev;
                window.api?.theme?.toggleTheme?.(newMode ? 'dark' : 'light');
                return newMode;
            });
            return;
        }

        // Posição exata do clique no botão do tema
        const x = event.clientX;
        const y = event.clientY;

        // Distância até o canto mais distante da janela
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        // Dispara a captura de quadros
        const transition = document.startViewTransition(() => {
            setIsDarkMode((prev) => {
                const newMode = !prev;
                window.api?.theme?.toggleTheme?.(newMode ? 'dark' : 'light');
                return newMode;
            });
        });

        // Anima a máscara de corte (circle) expandindo do botão até o fim da tela
        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 600,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        });
    };

    const renderView = () => {
        switch (currentTab) {
            case 'dashboard': return <DashboardView onNavigate={setCurrentTab} />;
            case 'hardware': return <HardwareInformationView />;
            case 'power': return <PowerManagerView />;
            case 'network': return <NetworkMonitorView />;
            case 'process': return <ProcessManagerView />;
            case 'startup': return <StartupAppsView />;
            case 'cleaner': return <CleanerView />;
            case 'uninstaller': return <UninstallerView />;
            case 'settings': return <SettingsView />;
            case 'about': return <AboutView />;
            default: return <DashboardView onNavigate={setCurrentTab} />;
        }
    };

    return (
        <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
            <div
                className={styles.appContainer}
                style={{ 
                    background: isDarkMode ? darkGradient : lightGradient,
                    color: isDarkMode ? '#fffffff5' : '#212121'
                }}
            >
                <TitleBar onToggleTheme={handleToggleTheme} isDarkMode={isDarkMode} />
                <div className={styles.bodyLayout}>
                    <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} isDarkMode={isDarkMode} />
                    <div className={styles.contentArea}>
                        {renderView()}
                    </div>
                </div>
            </div>
        </FluentProvider>
    );
}

export default App;