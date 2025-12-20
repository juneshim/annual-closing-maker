import stringsData from '../data/strings.json';

/**
 * String utility functions for accessing localized strings
 */
export const strings = stringsData as typeof stringsData;

/**
 * Replace placeholders in string templates
 * Example: replacePlaceholders("Hello {name}!", { name: "World" }) => "Hello World!"
 */
export function replacePlaceholders(
  template: string,
  replacements: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return replacements[key]?.toString() || match;
  });
}

/**
 * Get nested string value by path
 * Example: getString('upload.errors.fileTooLarge') => strings.upload.errors.fileTooLarge
 */
export function getString(path: string): string {
  const keys = path.split('.');
  let value: any = strings;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`String path not found: ${path}`);
      return path;
    }
  }
  
  return typeof value === 'string' ? value : String(value);
}

