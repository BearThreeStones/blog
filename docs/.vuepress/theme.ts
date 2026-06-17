import { hopeTheme } from "vuepress-theme-hope";



import {
  docsearchApiKey,
  docsearchAppId,
  docsearchIndexName,
  hasDocSearch,
} from "./docsearch.config.ts";

import { navbarEn, navbarZh } from "./navbar.js";

import { sidebarEn, sidebarZh } from "./sidebar.js";



const blogMediaLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 4 8 18v28l24 14 24-14V18z" fill="#2B3542"/><path d="M32 4 8 18l24 14 24-14z" fill="#5FA8F5"/><path d="M8 18v28l24 14V32z" fill="#3A79BB"/><path d="M56 18v28L32 60V32z" fill="#D7E0E8"/><path d="M32 14.5 18 22.6v16.8L32 47.5l14-8.1V22.6z" stroke="#F4F7FA" stroke-width="2.5" opacity=".45"/></svg>`;



const zhFooter =

  'ICP备案/许可证号：<a href="https://beian.miit.gov.cn/" target="_blank">蜀ICP备2026003062号-1</a> | <a href="http://beian.gov.cn/portal/registerSystemInfo?recordcode=川公网安备51200002001146号" target="_blank"><img src="/beian.png" style="vertical-align: middle; margin-right: 2px;" alt="公安备案图标" />川公网安备51200002001146号</a>';



export default hopeTheme({

  hostname: "https://www.stonybear.com",



  author: {

    name: "StonyBear",

    url: "https://www.stonybear.com",

  },



  logo: "/logo.svg",



  repo: "BearThreeStones/blog",



  docsDir: "docs",

  docsBranch: "main",



  lastUpdated: true,

  contributors: "meta",



  darkmode: "switch",



  displayFooter: true,



  locales: {

    "/": {

      navbar: navbarZh,

      sidebar: sidebarZh,

      footer: zhFooter,

      metaLocales: {

        editLink: "在 GitHub 上编辑此页",

        lastUpdated: "上次更新",

        contributors: "贡献者",

      },

      blog: {

        avatar: "/logo.png",

        name: "StonyBear",

        description: "分享游戏开发和算法知识",

        intro: "/intro.html",

        medias: {

          Email: "2724776621@qq.com",

          Gitee: "https://gitee.com/stonybear",

          GitHub: "https://github.com/BearThreeStones",

          Gitlab: "https://gitlab.com/leixiong517",

          Gmail: "leixiong517@gmail.com",

          Steam: "https://steamcommunity.com/profiles/76561198848310312/",

          VuePressThemeHope: {

            icon: blogMediaLogo,

            link: "https://theme-hope.vuejs.press",

          },

        },

      },

      plugins: {

        ...(hasDocSearch

          ? {

              docsearch: {

                placeholder: "搜索文档",

                locales: {

                  "/": {

                    placeholder: "搜索文档",

                    translations: {

                      button: { buttonText: "搜索" },

                    },

                  },

                },

              },

            }

          : {}),

      },

    },

    "/en/": {

      navbar: navbarEn,

      sidebar: sidebarEn,

      footer: "© StonyBear — Game development and algorithms",

      metaLocales: {

        editLink: "Edit this page on GitHub",

        lastUpdated: "Last updated",

        contributors: "Contributors",

      },

      blog: {

        avatar: "/logo.png",

        name: "StonyBear",

        description: "Game development and algorithms",

        intro: "/en/intro.html",

        medias: {

          Email: "2724776621@qq.com",

          Gitee: "https://gitee.com/stonybear",

          GitHub: "https://github.com/BearThreeStones",

          Gitlab: "https://gitlab.com/leixiong517",

          Gmail: "leixiong517@gmail.com",

          Steam: "https://steamcommunity.com/profiles/76561198848310312/",

          VuePressThemeHope: {

            icon: blogMediaLogo,

            link: "https://theme-hope.vuejs.press",

          },

        },

      },

      plugins: {

        ...(hasDocSearch

          ? {

              docsearch: {

                placeholder: "Search docs",

                locales: {

                  "/en/": {

                    placeholder: "Search docs",

                    translations: {

                      button: { buttonText: "Search" },

                    },

                  },

                },

              },

            }

          : {}),

      },

    },

  },



  encrypt: {

    config: {

      "/demo/encrypt.html": {

        hint: "Password: 1234",

        password: "1234",

      },

    },

  },



  markdown: {

    align: true,

    attrs: true,

    codeTabs: true,

    component: true,

    demo: true,

    figure: true,

    gfm: true,

    imgLazyload: true,

    imgSize: true,

    include: true,

    mark: true,

    plantuml: true,

    spoiler: true,

    stylize: [

      {

        matcher: "Recommended",

        replacer: ({ tag }) => {

          if (tag === "em")

            return {

              tag: "Badge",

              attrs: { type: "tip" },

              content: "Recommended",

            };

        },

      },

    ],

    sub: true,

    sup: true,

    tabs: true,

    tasklist: true,

    vPre: true,

    echarts: true,

    mermaid: true,

  },



  plugins: {

    git: true,



    blog: true,



    comment: {

      provider: "Giscus",

      repo: "BearThreeStones/blog",

      repoId: "R_kgDOPmzUPw",

      category: "General",

      categoryId: "DIC_kwDOPmzUP84C1fCI",

      mapping: "pathname",

      strict: true,

      reactionsEnabled: false,

      inputPosition: "top",

      lightTheme: "light",

      darkTheme: "dark",

      lazyLoading: true,

    },



    components: {

      components: ["Badge", "VPCard"],

    },



    ...(hasDocSearch

      ? {

          docsearch: {

            appId: docsearchAppId,

            apiKey: docsearchApiKey,

            indexName: docsearchIndexName,

          },

        }

      : {}),



    icon: {

      assets: [],

    },



    pwa: {

      favicon: "/favicon.ico",

      themeColor: "#5FA8F5",

      cacheHTML: true,

      cacheImage: true,

      appendBase: true,

      showInstall: true,

      update: "available",

      apple: {

        icon: "/assets/icon/apple-icon-152.png",

        statusBarColor: "black",

      },

      msTile: {

        image: "/assets/icon/ms-icon-144.png",

        color: "#2B3542",

      },

      manifest: {

        name: "StonyBear 程序开发分享",

        short_name: "StonyBear",

        description: "分享游戏开发和算法知识",

        display: "standalone",

        background_color: "#ffffff",

        theme_color: "#5FA8F5",

        icons: [

          {

            src: "/assets/icon/chrome-mask-512.png",

            sizes: "512x512",

            purpose: "maskable",

            type: "image/png",

          },

          {

            src: "/assets/icon/chrome-mask-192.png",

            sizes: "192x192",

            purpose: "maskable",

            type: "image/png",

          },

          {

            src: "/assets/icon/chrome-512.png",

            sizes: "512x512",

            type: "image/png",

          },

          {

            src: "/assets/icon/chrome-192.png",

            sizes: "192x192",

            type: "image/png",

          },

        ],

        shortcuts: [

          {

            name: "算法",

            short_name: "算法",

            url: "/posts/algorithm/",

            icons: [

              {

                src: "/assets/icon/guide-maskable.png",

                sizes: "192x192",

                purpose: "maskable",

                type: "image/png",

              },

            ],

          },

          {

            name: "游戏开发",

            short_name: "游戏开发",

            url: "/posts/game-dev/",

            icons: [

              {

                src: "/assets/icon/guide-maskable.png",

                sizes: "192x192",

                purpose: "maskable",

                type: "image/png",

              },

            ],

          },

        ],

      },

    },

  },

});


