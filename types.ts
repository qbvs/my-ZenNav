export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string; // Icon name from Lucide
}

export interface Category {
  id: string;
  title: string;
  links: LinkItem[];
}

export interface SiteConfig {
  title: string;
  description: string;
  password?: string; // New field for admin password
  categories: Category[];
}

export type ThemeMode = 'light' | 'dark';