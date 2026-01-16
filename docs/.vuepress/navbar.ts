import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "博文",
    icon: "pen-to-square",
    prefix: "/posts/",
    children: [
      {
        text: "Unity",
        icon: "pen-to-square",
        prefix: "unity/",
        children: [
          { text: "Unity 1", icon: "pen-to-square", link: "1" },
          { text: "Unity 2", icon: "pen-to-square", link: "2" },
        ],
      },
      {
        text: "C++",
        icon: "pen-to-square",
        prefix: "cpp/",
        children: [
          {
            text: "C++ 1",
            icon: "pen-to-square",
            link: "1",
          },
          {
            text: "C++ 2",
            icon: "pen-to-square",
            link: "2",
          },
          "3",
          "4",
        ],
      },
      { text: "算法", icon: "pen-to-square", link: "algorithm" },
    ],
  }
]);
