#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run docs:build

# 进入生成的文件夹
cd docs/.vuepress/dist

# 拷贝目录和文件
# cp -r ../../../.github ./

git init
git add -A
git commit -m 'deploy'

# 推送到 gh-pages 分支
# git push -f https://github.com/BearThreeStones/blog.git master:gh-pages

# 推送到远端服务器
git push -f git@43.138.57.136:/home/www/website/blog.git master

cd -