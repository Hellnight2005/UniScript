import 'server-only';

const dictionaries: Record<string, () => Promise<any>> = {
    en: () => import('./i18n/en.json').then((module) => module.default),
    es: () => import('./i18n/es.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
    if (dictionaries[locale]) {
        return dictionaries[locale]();
    }
    return dictionaries['en']();
};
