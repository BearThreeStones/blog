import { navbar } from "vuepress-theme-hope";

export default navbar([
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
