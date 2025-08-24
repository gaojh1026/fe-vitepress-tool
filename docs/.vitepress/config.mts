import { defineConfig } from "vitepress";
import { withSidebar } from "vitepress-sidebar";

const base = "/fe-vitepress-tool/";

const vitePressOptions = {
  base: base, //网站部署的路径，默认根目录
  title: "前端工具集 - 提升开发效率的实用工具",
  description:
    "专注于前端开发的实用工具集合，包含SSE流式管理器、轮询管理器等，提供完整的API文档和使用示例",
  //fav图标
  head: [
    ["link", { rel: "icon", href: "/icons/favicon.svg" }], //部署到根目录 [!code --]
    ["link", { rel: "icon", href: `${base}/icons/favicon.svg` }], //部署到vitepress仓库 [!code ++]
    [
      "meta",
      {
        name: "keywords",
        content: "前端工具,SSE,轮询,流式请求,Vue3,React,JavaScript",
      },
    ],
    ["meta", { name: "author", content: "gaojh1026" }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: "前端工具集",
    logo: "/icons/icon-32x32.png",
    nav: [
      { text: "首页", link: "/" },
      { text: "工具文档", link: "/examples" },
    ],

    // sidebar: false, // 关闭sidebar
    // aside: "left", // 设置右侧侧边栏在左侧显示
    // sidebar: [
    //   // {
    //   //   text: "方法列表",
    //   //   items: [
    //   //     { text: "sse 流式请求客户端", link: "/stream-fetch-client/" },
    //   //     { text: "轮询管理器 vue3版本", link: "/docs-polling-vue3.md" },
    //   //   ],
    //   // },
    // ],

    socialLinks: [
      { icon: "github", link: "https://github.com/gaojh1026" },
      { icon: "wechat", link: "/wechat.jpg" },
    ],

    // 设置搜索框样式
    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "没有找到结果",
            resetButtonTitle: "重置",
            footer: { selectText: "选择", navigateText: "切换" },
          },
        },
      },
    },
    // 文章页右侧标题级别，[2, 6] 表示从 h2 到 h6 的标题都会显示
    outline: [2, 3],
    outlineTitle: "文章大纲",

    // 添加页脚信息
    footer: {
      message: "Released under the ISC License.",
      copyright: "Copyright © 2024-present gaojh1026",
    },

    // 添加编辑链接
    editLink: {
      pattern:
        "https://github.com/gaojh1026/fe-vitepress-tool/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },

    // 添加最后更新时间
    lastUpdated: {
      text: "最后更新时间",
      formatOptions: {
        dateStyle: "full",
        timeStyle: "medium",
      },
    },
  },
};

const vitePressSidebarOptions = {
  // VitePress Sidebar's options here...
  documentRootPath: "/docs",
  collapsed: false,
  capitalizeFirst: true,
  useFolderLinkFromIndexFile: true,
  // 设置标题
  // useTitleFromFrontmatter: true, // 根据文件Frontmatter中title的值显示标题
  useTitleFromFileHeading: true, // 显示带有 .md 文件中 h1 标题内容的标题,https://vitepress-sidebar.cdget.com/zhHans/guide/options#usetitlefromfileheading
  // frontmatterTitleFieldName: "name", // 文件中指定的Frontmatter中的键名显示菜单标题
  /* 设置排序 */
  sortFolderTo: "bottom" as "bottom",
  sortMenusByFrontmatterOrder: true,
};

// https://vitepress.dev/reference/site-config
export default defineConfig(
  withSidebar(vitePressOptions, vitePressSidebarOptions)
);
