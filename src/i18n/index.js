import pt from './pt';
import en from './en';
//import es from './es';
//import de from './de';
//import ru from './ru';
//import zhTW from './zh-TW';

const translations = {
    pt,
    en,
    //es,
    //de,
    //ru,
    //'zh-TW': zhTW
};

// Idioma padrão configurado como inglês
let currentLocale = 'en';

export function setLocale(locale) {
    if (translations[locale]) {
        currentLocale = locale;
        localStorage.setItem('app_locale', locale);
    }
}

export function getLocale() {
    const savedLocale = localStorage.getItem('app_locale');
    if (savedLocale && translations[savedLocale]) {
        currentLocale = savedLocale;
    }
    return currentLocale;
}

export function t(key) {
    const activeLocale = getLocale();
    const langDict = translations[activeLocale] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
}

export default translations;