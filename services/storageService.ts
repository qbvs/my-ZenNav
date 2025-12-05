import { SiteConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';

const STORAGE_KEY = 'zennav_config_v1';
const THEME_KEY = 'zennav_theme';
const GITHUB_TOKEN_KEY = 'zennav_github_token';

export const getStoredConfig = (): SiteConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse config", e);
  }
  return DEFAULT_CONFIG;
};

export const saveStoredConfig = (config: SiteConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const resetConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_CONFIG;
};

export const getStoredTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const saveStoredTheme = (theme: 'light' | 'dark') => {
  localStorage.setItem(THEME_KEY, theme);
};

export const getGithubToken = () => {
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
};

export const saveGithubToken = (token: string) => {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
};