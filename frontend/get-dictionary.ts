import 'server-only';

const dictionaries = {
    en: () => import('./i18n/en.json').then((module) => module.default),
    es: () => import('./i18n/es.json').then((module) => module.default),
    fr: () => import('./i18n/fr.json').then((module) => module.default),
    de: () => import('./i18n/de.json').then((module) => module.default),
    ja: () => import('./i18n/ja.json').then((module) => module.default),
    ru: () => import('./i18n/ru.json').then((module) => module.default),
    zh: () => import('./i18n/zh.json').then((module) => module.default),
    hi: () => import('./i18n/hi.json').then((module) => module.default),
    ar: () => import('./i18n/ar.json').then((module) => module.default),
    ko: () => import('./i18n/ko.json').then((module) => module.default),
    pt: () => import('./i18n/pt.json').then((module) => module.default),
    it: () => import('./i18n/it.json').then((module) => module.default),
    nl: () => import('./i18n/nl.json').then((module) => module.default),
    tr: () => import('./i18n/tr.json').then((module) => module.default),
};

export const getDictionary = async (locale: string | null) => {
    const lang = locale || 'en';
    if (dictionaries[lang as keyof typeof dictionaries]) {
        return dictionaries[lang as keyof typeof dictionaries]();
    }
    return dictionaries['en']();
};
