#!/bin/bash

set -e

echo "==============================="
echo "🚀 AR2 Vite自动部署到gh-pages分支"
echo "==============================="

# 1. 构建产物
npm install
npm run build

# 2. 保存当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 3. 清理dist目录（避免切换分支时的冲突）
echo "🧹 清理dist目录..."
rm -rf dist

# 4. 处理gh-pages分支切换
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "📁 本地gh-pages分支存在，尝试切换..."
    
    # 暂存当前更改
    if [ -n "$(git status --porcelain)" ]; then
        echo "💾 暂存当前更改..."
        git stash push -m "临时保存部署前更改"
        STASHED=true
    fi
    
    # 切换到gh-pages分支
    git checkout gh-pages
    
    # 恢复暂存的更改（如果有）
    if [ "$STASHED" = true ]; then
        echo "📦 恢复暂存的更改..."
        git stash pop
    fi
else
    echo "🆕 创建新的gh-pages分支..."
    git checkout -b gh-pages
fi

# 5. 重新构建（在gh-pages分支上）
echo "🔨 在gh-pages分支上重新构建..."
npm run build

# 6. 直接复制dist内容到根目录（不清空）
echo "📋 复制构建产物..."
cp -r dist/* .

# 7. 添加.nojekyll，防止GitHub Pages处理
if [ ! -f .nojekyll ]; then
  touch .nojekyll
fi

# 8. 提交并推送
if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "deploy: 自动发布最新构建产物 $(date '+%F %T')"
  git push origin gh-pages
  echo "✅ 已推送到远程gh-pages分支"
else
  echo "✅ 没有变更需要提交，已是最新部署。"
fi

# 9. 切回开发分支
git checkout "$CURRENT_BRANCH"

# 10. 在开发分支上重新构建
echo "🔨 在开发分支上重新构建..."
npm run build

echo "==============================="
echo "✅ 部署完成！请刷新GitHub Pages页面。"
echo "===============================" 