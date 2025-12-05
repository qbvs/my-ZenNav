import { SiteConfig } from './types';

export const DEFAULT_CONFIG: SiteConfig = {
  title: "我的导航",
  description: "简约而不简单。探索数字世界的优雅入口。",
  // Use environment variable if available, otherwise default to "admin"
  password: process.env.ADMIN_PASSWORD || "admin", 
  categories: [
    {
      id: "cat_1",
      title: "日常办公",
      links: [
        {
          id: "link_1",
          title: "Gmail",
          url: "https://mail.google.com",
          description: "高效处理邮件",
          icon: "Mail"
        },
        {
          id: "link_2",
          title: "GitHub",
          url: "https://github.com",
          description: "代码托管与协作",
          icon: "Github"
        },
        {
          id: "link_3",
          title: "ChatGPT",
          url: "https://chat.openai.com",
          description: "AI 智能助手",
          icon: "Bot"
        }
      ]
    },
    {
      id: "cat_2",
      title: "阅读资讯",
      links: [
        {
          id: "link_4",
          title: "少数派",
          url: "https://sspai.com",
          description: "高效工作生活",
          icon: "Zap"
        },
        {
          id: "link_5",
          title: "36氪",
          url: "https://36kr.com",
          description: "科技创投媒体",
          icon: "Newspaper"
        }
      ]
    },
    {
      id: "cat_3",
      title: "设计灵感",
      links: [
        {
          id: "link_6",
          title: "Dribbble",
          url: "https://dribbble.com",
          description: "全球设计灵感社区",
          icon: "Dribbble"
        },
        {
          id: "link_7",
          title: "Figma",
          url: "https://figma.com",
          description: "云端界面设计工具",
          icon: "Figma"
        }
      ]
    }
  ]
};