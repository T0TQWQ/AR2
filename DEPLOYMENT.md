# 🚀 GitHub Pages 自动部署指南

## 📋 部署步骤

### 1. 准备GitHub仓库

确保你的GitHub仓库名称是 `ar2-animation`（与vite.config.js中的base路径匹配）

### 2. 启用GitHub Pages

1. 进入GitHub仓库页面
2. 点击 `Settings` 标签
3. 在左侧菜单中找到 `Pages`
4. 在 `Source` 部分选择：
   - **Deploy from a branch**
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)` ← **重要：选择root，不是doc**

### 3. 配置GitHub Actions权限

1. 在 `Settings` > `Actions` > `General`
2. 确保 `Actions permissions` 设置为 `Allow all actions and reusable workflows`
3. 在 `Workflow permissions` 中选择 `Read and write permissions`

### 4. 推送代码触发自动部署

```bash
# 确保代码已提交
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 5. 查看部署状态

1. 进入GitHub仓库页面
2. 点击 `Actions` 标签
3. 查看最新的工作流运行状态
4. 等待部署完成（通常需要2-3分钟）

### 6. 访问部署的应用

部署成功后，你的应用将在以下地址上线：
```
https://your-username.github.io/ar2-animation/
```

## 🔧 常见问题解决

### 问题1: 部署失败
**解决方案**:
- 检查GitHub Actions日志
- 确保所有依赖都正确安装
- 验证vite.config.js配置正确

### 问题2: 页面显示404
**解决方案**:
- 确认GitHub Pages设置中选择的是 `/ (root)`
- 检查base路径是否正确
- 等待几分钟让部署生效

### 问题3: 资源加载失败
**解决方案**:
- 检查assets文件夹路径
- 确认相对路径正确
- 查看浏览器控制台错误信息

## 📱 测试部署

### 本地测试构建
```bash
npm run build
npm run preview
```

### 移动端测试
1. 在手机上访问部署的URL
2. 测试摄像头功能
3. 验证AR功能正常

## 🎯 部署检查清单

- [ ] GitHub仓库名称正确
- [ ] GitHub Pages已启用
- [ ] 选择 `/ (root)` 文件夹
- [ ] GitHub Actions权限已配置
- [ ] 代码已推送到main分支
- [ ] 构建成功完成
- [ ] 应用可以正常访问

## 📞 获取帮助

如果遇到问题：
1. 查看GitHub Actions日志
2. 检查浏览器控制台错误
3. 验证所有配置步骤
4. 参考GitHub Pages文档 