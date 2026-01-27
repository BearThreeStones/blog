import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    {
      text: "算法",
      icon: "code",
      prefix: "posts/algorithm/",
      children: "structure",
    },
    {
      text: "游戏开发",
      icon: "gamepad",
      prefix: "posts/game-dev/",
      children: "structure",
    },
  ],
});
