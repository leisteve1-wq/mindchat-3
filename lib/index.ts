export * from '../auth';

const translations: Record<string, string> = {
  'app.name': 'MindChat',
  'app.tagline': 'Your AI-powered mental health companion',
  'action.loading': 'Loading…',
  'action.update': 'Update',
  'update.available': 'Update available',
  'update.description': 'A newer version of MindChat is ready.',
  'online.title': 'Back online',
  'offline.title': 'You are offline',
  'error.offline': 'Offline mode',
  'online.status': 'Online',
};

export const initLanguage = (): void => undefined;
export const t = (key: string, values?: Record<string, string>): string => {
  let value = translations[key] ?? key;
  for (const [name, replacement] of Object.entries(values ?? {})) value = value.replace(`{${name}}`, replacement);
  return value;
};
