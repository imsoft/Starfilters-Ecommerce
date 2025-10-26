import i18next from "i18next";

export function t(key: string): string {
  return i18next.t(key);
}

export function changeLanguage(lng: string): void {
  i18next.changeLanguage(lng);
}

export function getCurrentLanguage(): string {
  return i18next.language || "es";
}
