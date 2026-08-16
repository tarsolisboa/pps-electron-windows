/**
 * Formata bytes crus para a unidade mais legível (KB, MB, GB, TB)
 * @param {number} bytes - Valor bruto em bytes
 * @param {function} t - Função de tradução do i18n
 */
export const formatBytes = (bytes, t) => {
    if (bytes === 0 || isNaN(bytes)) return `0 ${t('units.bytes')}`;
    
    const k = 1024;
    const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${formattedValue} ${t(`units.${sizes[i]}`)}`;
};

/**
 * Formata velocidade de rede (Bytes por segundo)
 * @param {number} bytesPerSec - Valor bruto da velocidade
 * @param {function} t - Função de tradução do i18n
 */
export const formatSpeed = (bytesPerSec, t) => {
    if (bytesPerSec === 0 || isNaN(bytesPerSec)) return `0 ${t('units.bytes_per_sec')}`;
    
    const k = 1024;
    const sizes = ['bytes_per_sec', 'kb_per_sec', 'mb_per_sec', 'gb_per_sec'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    
    const formattedValue = parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1));
    return `${formattedValue} ${t(`units.${sizes[i]}`)}`;
};

/**
 * Formata segundos crus de uptime para Dias, Horas e Minutos
 * @param {number} totalSeconds - Tempo total em segundos
 * @param {function} t - Função de tradução do i18n
 */
export const formatUptime = (totalSeconds, t) => {
    if (!totalSeconds || isNaN(totalSeconds)) return `0${t('units.h')} 0${t('units.m')}`;

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}${t('units.d')} `;
    result += `${hours}${t('units.h')} ${minutes}${t('units.m')}`;
    
    return result.trim();
};

/**
 * Formata a data ISO (YYYY-MM-DD) para o padrão local do usuário
 * @param {string} isoDate - Data no formato YYYY-MM-DD ou null
 * @param {function} t - Função de tradução do i18n
 * @param {string} locale - Código do idioma atual (ex: 'pt-BR', 'en-US')
 */
export const formatDate = (isoDate, t, locale = 'pt-BR') => {
    if (!isoDate) return t('common.unknown');
    
    try {
        // Corrige o fuso horário para evitar que a data caia um dia antes
        const date = new Date(`${isoDate}T12:00:00Z`); 
        return new Intl.DateTimeFormat(locale, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }).format(date);
    } catch (e) {
        return isoDate;
    }
};