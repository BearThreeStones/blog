import { sidebar } from "vuepress-theme-hope";

export const sidebarZh = sidebar({
  "/": [
    {
      text: "首页",
      icon: "/assets/icon/unity/home.svg",
      link: "/classic/",
    },
    {
      text: "算法",
      icon: "/assets/icon/unity/algorithm.svg",
      prefix: "posts/algorithm/",
      link: "/posts/algorithm/",
      children: "structure",
    },
    {
      text: "游戏开发",
      icon: "/assets/icon/unity/game-development.svg",
      prefix: "posts/game-dev/",
      link: "/posts/game-dev/",
      children: "structure",
    },
    {
      text: "Unity 最佳实践电子书",
      icon: "/assets/icon/unity/unity-best-practice.svg",
      prefix: "posts/unity-best-practice/",
      link: "/posts/unity-best-practice/",
      children: "structure",
    },
  ],
});

export const sidebarEn = sidebar({
  "/en/": [
    {
      text: "Home",
      icon: "/assets/icon/unity/home.svg",
      link: "/en/",
    },
    {
      text: "Algorithms",
      icon: "/assets/icon/unity/algorithm.svg",
      prefix: "posts/algorithm/",
      link: "/en/posts/algorithm/",
      children: "structure",
    },
    {
      text: "Game Development",
      icon: "/assets/icon/unity/game-development.svg",
      prefix: "posts/game-dev/",
      link: "/en/posts/game-dev/",
      children: "structure",
    },
    {
      text: "Unity Best Practices eBook",
      icon: "/assets/icon/unity/unity-best-practice.svg",
      prefix: "posts/unity-best-practice/",
      link: "/en/posts/unity-best-practice/",
      children: "structure",
    },
  ],
});

export default sidebarZh;
