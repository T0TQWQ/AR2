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

# 切换到main分支
echo "🔄 切换到 main 分支..."
git checkout main
if [ $? -ne 0 ]; then
    echo "❌ 切换到main分支失败"
    exit 1
fi

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

# 提交main分支的更改
echo "📝 提交main分支更改..."
git add .
git commit -m "Update: 自动构建并部署最新产物"

# 推送到main分支
echo "🚀 推送到main分支..."
git push origin main
if [ $? -ne 0 ]; then
    echo "❌ 推送到main分支失败"
    exit 1
fi

# 用临时目录保存构建产物
echo "📦 复制构建产物到临时目录..."
rm -rf /tmp/ar2-dist
mkdir -p /tmp/ar2-dist
cp -r dist/* /tmp/ar2-dist/

# 切换到gh-pages分支
echo "🔄 切换到 gh-pages 分支..."
git checkout gh-pages 2>/dev/null || git checkout -b gh-pages

# 清理gh-pages分支的所有文件
echo "🧹 清理 gh-pages 分支..."
git rm -rf .
git clean -fdx

# 复制构建产物到根目录
echo "📋 复制构建产物..."
cp -r /tmp/ar2-dist/* .

# 添加所有文件
echo "📝 添加部署文件..."
git add .

# 提交部署
echo "💾 提交部署..."
git commit -m "deploy: 自动构建并部署最新产物"

# 强制推送到gh-pages分支
echo "🚀 推送到 gh-pages 分支..."
git push origin gh-pages --force
if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo ""
    echo "🌐 应用将在以下地址上线："
    echo "   https://your-username.github.io/ar2-animation/"
    echo ""
    echo "⏱️  等待GitHub Pages部署（通常需要2-3分钟）..."
    echo ""
    echo "📋 检查清单："
    echo "   ✅ 代码已构建"
    echo "   ✅ 已推送到main分支"
    echo "   ✅ 已推送到gh-pages分支"
    echo "   ⏳ 等待GitHub Pages部署"
    echo "   ⏳ 测试应用功能"
    echo ""
    echo "🔧 如果遇到问题，请检查："
    echo "   • GitHub仓库设置中的Pages配置"
    echo "   • 确保gh-pages分支被设置为部署源"
else
    echo "❌ 推送到gh-pages分支失败"
    exit 1
fi

# 切换回main分支
echo "🔄 切换回 main 分支..."
git checkout main 