import { defineConfig } from "vitepress";
import { withSidebar } from "vitepress-sidebar";

const base = "/fe-vitepress-tool/";

const vitePressOptions = {
  base: "/fe-vitepress-tool/", //网站部署的路径，默认根目录
  title: "方法集",
  description: "一些方法使用文档",
  //fav图标
  head: [
    ["link", { rel: "icon", href: "/icons/favicon.svg" }], //部署到根目录 [!code --]
    ["link", { rel: "icon", href: "/project-vitepress/icons/favicon.svg" }], //部署到vitepress仓库 [!code ++]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "说明文档", link: "/examples" },
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
