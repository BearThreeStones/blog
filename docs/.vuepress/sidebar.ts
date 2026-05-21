import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
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
