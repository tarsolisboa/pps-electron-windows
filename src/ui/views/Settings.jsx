import React, { useState, useEffect } from 'react';
import {
    Title2,
    Text,
    Card,
    Button,
    Switch,
    Select,
    Spinner,
    Caption1,
    makeStyles,
    shorthands
} from '@fluentui/react-components';
import { t, getLocale, setLocale } from '../../i18n';

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
    saveBtn: {
        backgroundColor: '#0078d4',
        color: '#ffffff',
        fontWeight: '600',
        alignSelf: 'flex-start',
        '&:hover': {
            backgroundColor: '#106ebe'
        }
    }
});

export function SettingsView({ isDarkMode }) {
    const styles = useStyles();

    const [currentLang, setCurrentLang] = useState(getLocale());
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    // Novos estados para as configurações da janela
    const [confirmOnExit, setConfirmOnExit] = useState(true);
    const [minimizeToTray, setMinimizeToTray] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            if (window.api?.settings?.get) {
                const config = await window.api.settings.get();
                setCurrentLang(config.language);
                setConfirmOnExit(config.confirmOnExit);
                setMinimizeToTray(config.minimizeToTray);
            }
        };
        loadSettings();
    }, []);

    const handleLanguageChange = (e) => {
        setCurrentLang(e.target.value);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        setSavedSuccess(false);

        // 1. Salva os dados no Backend primeiro
        if (window.api?.settings?.save) {
            await window.api.settings.save({
                language: currentLang,
                confirmOnExit,
                minimizeToTray
            });
        }

        // 2. Avisa o sistema de tradução
        setLocale(currentLang);

        // 3. Feedback visual
        setTimeout(() => {
            setSaving(false);
            setSavedSuccess(true);

            // Recarrega a página para aplicar os textos DEPOIS de salvar,
            // dando 1 segundo para o usuário ver o aviso verdinho de sucesso.
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }, 800);
    };

    return (
        <div className={styles.container}>
            <div>
                <Title2>{t('settings.title')}</Title2>
                <Text block>{t('settings.subtitle')}</Text>
            </div>

            {savedSuccess && (
                <Card className={styles.card} style={{ backgroundColor: 'rgba(223, 246, 221, 0.7)' }}>
                    <Text weight="semibold" style={{ color: '#107c41' }}>{t('settings.saveSuccess')}</Text>
                </Card>
            )}

            {/* SEÇÃO DE PREFERÊNCIAS E IDIOMA */}
            <Card className={styles.card}>
                <div className={styles.sectionHeader}>
                    <Text weight="semibold" size={500}>{t('settings.preferencesSection')}</Text>
                </div>

                {/* Seletor de Idioma */}
                <div className={styles.rowBetween}>
                    <div>
                        <Text weight="semibold" size={300}>{t('settings.languageLabel')}</Text>
                        <Caption1 block style={{ color: '#212121' }}>
                            {t('settings.languageDesc')}
                        </Caption1>
                    </div>
                    <Select
                        value={currentLang}
                        onChange={handleLanguageChange}
                        style={{ minWidth: '180px' }}
                    >
                        <option value="zh-TW">繁體中文</option>
                        <option value="de">Deutsch</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="pt">Português</option>
                        <option value="ru">Русский</option>
                    </Select>
                </div>

                {/* Confirmação ao sair */}
                <div className={styles.rowBetween}>
                    <div>
                        <Text weight="semibold" size={300}>{t('settings.confirmOnExitLabel')}</Text>
                        <Caption1 block style={{ color: '#212121' }}>
                            {t('settings.confirmOnExitDesc')}
                        </Caption1>
                    </div>
                    <Switch
                        checked={confirmOnExit}
                        onChange={() => setConfirmOnExit(!confirmOnExit)}
                    />
                </div>

                {/* Minimizar para a bandeja (Tray) */}
                <div className={styles.rowBetween}>
                    <div>
                        <Text weight="semibold" size={300}>{t('settings.minimizeToTrayLabel')}</Text>
                        <Caption1 block style={{ color: '#212121' }}>
                            {t('settings.minimizeToTrayDesc')}
                        </Caption1>
                    </div>
                    <Switch
                        checked={minimizeToTray}
                        onChange={() => setMinimizeToTray(!minimizeToTray)}
                    />
                </div>
            </Card>

            {/* BOTÃO DE SALVAR */}
            <div>
                <Button
                    className={styles.saveBtn}
                    onClick={handleSaveSettings}
                    disabled={saving}
                >
                    {saving ? <Spinner size="tiny" style={{ marginRight: '8px' }} /> : null}
                    {saving ? t('settings.saving') : t('settings.saveButton')}
                </Button>
            </div>
        </div>
    );
}

export default SettingsView;