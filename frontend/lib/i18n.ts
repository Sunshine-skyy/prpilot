export type Language = 'zh' | 'en';

export const languageStorageKey = 'prpilot-language';

export const languageNames: Record<Language, string> = {
  zh: '中文',
  en: 'English',
};

export function isLanguage(value: string | null): value is Language {
  return value === 'zh' || value === 'en';
}

export const focusAreaLabels: Record<Language, Record<string, string>> = {
  zh: {
    security: '安全',
    'bug-risk': '缺陷风险',
    performance: '性能',
    maintainability: '可维护性',
    testing: '测试',
  },
  en: {
    security: 'Security',
    'bug-risk': 'Bug Risk',
    performance: 'Performance',
    maintainability: 'Maintainability',
    testing: 'Testing',
  },
};
