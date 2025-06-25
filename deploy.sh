#!/bin/bash

# AR2 自动化部署脚本
# 用于构建项目并部署到GitHub Pages

set -e  # 遇到错误立即退出

echo "🚀 开始自动化部署..."

# 1. 确保在main分支
echo "📋 检查当前分支..."
if [[ $(git branch --show-current) != "main" ]]; then
    echo "⚠️  当前不在main分支，切换到main分支..."
    git checkout main
fi

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 3. 安装依赖（如果需要）
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 4. 构建项目
echo "🔨 构建项目..."
npm run build

# 5. 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist目录不存在"
    exit 1
fi

echo "✅ 构建成功！"

# 6. 切换到gh-pages分支
echo "🔄 切换到gh-pages分支..."
git checkout gh-pages

# 7. 备份当前gh-pages内容（可选）
echo "💾 备份当前gh-pages内容..."
if [ -d "backup" ]; then
    rm -rf backup
fi
mkdir backup
cp -r * backup/ 2>/dev/null || true
cp -r .* backup/ 2>/dev/null || true

# 8. 清理当前目录（保留.git）
echo "🧹 清理当前目录..."
git rm -rf . 2>/dev/null || true
git clean -fdx

# 9. 复制dist内容到根目录
echo "📋 复制构建内容..."
cp -r dist/* .
cp dist/.* . 2>/dev/null || true

# 10. 确保.nojekyll文件存在（GitHub Pages需要）
echo "📄 创建.nojekyll文件..."
touch .nojekyll

# 11. 添加所有文件到Git
echo "📝 添加文件到Git..."
git add -A

# 12. 检查是否有变更
if git diff --cached --quiet; then
    echo "ℹ️  没有变更需要提交"
else
    # 13. 提交变更
    echo "💾 提交变更..."
    git commit -m "🚀 自动部署: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 14. 推送到远程
    echo "📤 推送到GitHub..."
    git push origin gh-pages
    
    echo "✅ 部署完成！"
    echo "🌐 访问地址: https://$(git config user.name).github.io/AR2/"
else
    echo "ℹ️  没有变更需要提交"
fi

# 15. 切换回main分支
echo "🔄 切换回main分支..."
git checkout main

echo "🎉 自动化部署流程完成！"
echo ""
echo "📋 部署信息："
echo "   - 构建时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "   - 分支: gh-pages"
echo "   - 访问地址: https://$(git config user.name).github.io/AR2/"
echo ""
echo "💡 提示："
echo "   - GitHub Pages可能需要几分钟才能更新"
echo "   - 如果页面还是白屏，请强制刷新浏览器 (Ctrl+F5)"
echo "   - 检查F12控制台是否有错误信息" 