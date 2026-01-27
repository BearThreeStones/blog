import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "文章",
    icon: "pen-to-square",
    prefix: "/posts/",
    children: [
      {
        text: "算法",
        icon: "code",
        link: "algorithm/",
      },
      {
        text: "游戏开发",
        icon: "gamepad",
        prefix: "game-dev/",
        children: [
          { text: "游戏开发", icon: "gamepad", link: "" },
          { text: "游戏设计模式", icon: "puzzle-piece", link: "game-design-patterns/" },
        ],
      },
    ],
  },
]);
