import { SiteConfig } from '../types';

const GIST_FILENAME = 'zennav_config.json';
const GIST_DESC = 'ZenNav Configuration Sync';

export const syncService = {
  /**
   * 验证 Token 有效性
   */
  async validateToken(token: string) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * 查找是否已存在 ZenNav 的 Gist
   */
  async findGist(token: string) {
    try {
      const res = await fetch('https://api.github.com/gists', {
        headers: { Authorization: `token ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch gists');
      const gists = await res.json();
      return gists.find((g: any) => g.files && g.files[GIST_FILENAME]);
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  /**
   * 创建新的 Gist
   */
  async createGist(token: string, config: SiteConfig) {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: GIST_DESC,
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(config, null, 2)
          }
        }
      })
    });
    if (!res.ok) throw new Error('Failed to create gist');
    return await res.json();
  },

  /**
   * 更新现有的 Gist
   */
  async updateGist(token: string, gistId: string, config: SiteConfig) {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(config, null, 2)
          }
        }
      })
    });
    if (!res.ok) throw new Error('Failed to update gist');
    return await res.json();
  },

  /**
   * 获取 Gist 内容
   */
  async getGistContent(token: string, gistId: string): Promise<SiteConfig> {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
       headers: { Authorization: `token ${token}` }
    });
    const data = await res.json();
    const content = data.files[GIST_FILENAME]?.content;
    if (!content) throw new Error('Gist file not found');
    return JSON.parse(content);
  }
};