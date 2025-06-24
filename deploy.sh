#!/bin/bash

# AR2 应用部署脚本
echo "🚀 AR2 应用部署脚本"
echo "=================="

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装，请先安装Git"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf dist/

# 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 项目构建失败"
    exit 1
fi

# 检查构建输出
echo "🔍 检查构建输出..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ 构建输出中缺少 index.html"
    exit 1
fi

if [ ! -f "dist/.nojekyll" ]; then
    echo "❌ 构建输出中缺少 .nojekyll 文件"
    exit 1
fi

echo "✅ 构建输出检查通过"
echo "📁 构建文件:"
ls -la dist/

# 检查Git仓库状态
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    git add .
    git commit -m "Initial commit: AR2应用"
    echo "⚠️  请先创建GitHub仓库，然后运行以下命令："
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
    exit 0
fi

# 检查是否有远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  未找到远程仓库，请先添加GitHub仓库："
    echo "   git remote add origin <your-repo-url>"
    exit 0
fi

# 提交更改
echo "📝 提交更改..."
git add .
git commit -m "Update: 修复Jekyll构建问题，优化GitHub Pages部署"

# 推送到GitHub
echo "🚀 推送到GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ 推送成功！"
    echo ""
    echo "📱 接下来请按照以下步骤配置GitHub Pages："
    echo ""
    echo "1️⃣ 进入GitHub仓库设置："
    echo "   https://github.com/your-username/ar2-animation/settings"
    echo ""
    echo "2️⃣ 在左侧菜单找到 'Pages'"
    echo ""
    echo "3️⃣ 在 'Source' 部分选择："
    echo "   • Deploy from a branch"
    echo "   • Branch: gh-pages"
    echo "   • Folder: / (root) ← 重要：选择root，不是doc"
    echo ""
    echo "4️⃣ 点击 'Save' 保存设置"
    echo ""
    echo "5️⃣ 等待GitHub Actions自动部署（2-3分钟）"
    echo ""
    echo "🌐 应用将在以下地址上线："
    echo "   https://your-username.github.io/ar2-animation/"
    echo ""
    echo "🔧 如果遇到问题，请查看："
    echo "   • TROUBLESHOOTING.md - 故障排除指南"
    echo "   • DEPLOYMENT.md - 详细部署说明"
    echo ""
    echo "📋 检查清单："
    echo "   ✅ 代码已推送"
    echo "   ⏳ 等待GitHub Actions构建"
    echo "   ⏳ 等待GitHub Pages部署"
    echo "   ⏳ 测试应用功能"
else
    echo "❌ 推送失败，请检查网络连接和仓库权限"
    echo ""
    echo "🔧 可能的解决方案："
    echo "1. 检查网络连接"
    echo "2. 确认GitHub仓库权限"
    echo "3. 检查GitHub Token设置"
fi 