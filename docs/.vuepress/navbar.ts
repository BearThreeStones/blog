import { navbar } from "vuepress-theme-hope";

export const navbarZh = navbar([
  "/",
  {
    text: "文章",
    icon: "/assets/icon/unity/articles.svg",
    prefix: "/posts/",
    children: [
      {
        text: "算法",
        icon: "/assets/icon/unity/algorithm.svg",
        link: "algorithm/",
      },
      {
        text: "游戏开发",
        icon: "/assets/icon/unity/game-development.svg",
        prefix: "game-dev/",
        children: [
          {
            text: "游戏开发",
            icon: "/assets/icon/unity/game-development.svg",
            link: "",
          },
          {
            text: "游戏设计模式",
            icon: "/assets/icon/unity/design-patterns.svg",
            link: "game-design-patterns/",
          },
        ],
      },
    ],
  },
  {
    text: "Unity 最佳实践电子书",
    icon: "/assets/icon/unity/unity-best-practice.svg",
    link: "/posts/unity-best-practice/",
  },
]);

export const navbarEn = navbar([
  "/en/",
  {
    text: "Articles",
    icon: "/assets/icon/unity/articles.svg",
    prefix: "/posts/",
    children: [
      {
        text: "Algorithms",
        icon: "/assets/icon/unity/algorithm.svg",
        link: "algorithm/",
      },
      {
        text: "Game Development",
        icon: "/assets/icon/unity/game-development.svg",
        prefix: "game-dev/",
        children: [
          {
            text: "Game Development",
            icon: "/assets/icon/unity/game-development.svg",
            link: "",
          },
          {
            text: "Game Design Patterns",
            icon: "/assets/icon/unity/design-patterns.svg",
            link: "game-design-patterns/",
          },
        ],
      },
    ],
  },
  {
    text: "Unity Best Practices eBook",
    icon: "/assets/icon/unity/unity-best-practice.svg",
    link: "/posts/unity-best-practice/",
  },
]);

export default navbarZh;
