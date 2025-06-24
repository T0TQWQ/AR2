# AR2 透明动画应用

一个基于Web技术的透明底2D动画AR应用，支持通过手机扫描图片或二维码显示动画，并提供拍照功能。

## 🌟 功能特性

- 📱 **移动端优化** - 专为手机设计的响应式界面
- 🎯 **多标记支持** - 支持二维码和图片标记识别
- 🎨 **透明动画** - 基于Three.js的透明底2D动画效果
- 📸 **拍照功能** - 支持AR场景拍照和保存
- 🔧 **调试工具** - 内置摄像头测试和调试功能

## 🚀 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd AR2
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   - 本地: http://localhost:3000/
   - 网络: http://your-ip:3000/ (供手机访问)

### GitHub Pages 部署

1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **启用GitHub Pages**
   - 进入GitHub仓库设置
   - 找到 "Pages" 选项
   - 选择 "Deploy from a branch"
   - 选择 "gh-pages" 分支
   - 保存设置

3. **访问部署的应用**
   - 应用将在 `https://your-username.github.io/your-repo-name/` 上线

## 📱 使用说明

### 基本使用
1. 点击"开始AR体验"按钮
2. 允许摄像头权限
3. 将摄像头对准二维码或图片标记
4. 观看透明动画效果
5. 点击拍照按钮保存精彩瞬间

### 调试功能
- **测试摄像头** - 专门测试摄像头功能
- **调试信息** - 检查浏览器兼容性
- **按钮测试** - 验证按钮点击功能

## 🛠️ 技术栈

- **前端框架**: 原生JavaScript (ES6+)
- **构建工具**: Vite
- **3D渲染**: Three.js
- **样式**: CSS3 + 响应式设计
- **部署**: GitHub Pages + GitHub Actions

## 📁 项目结构

```
AR2/
├── index.html          # 主页面
├── main.js            # 主应用逻辑
├── ar-animation.js    # AR动画模块
├── qr-tracker.js      # 二维码追踪
├── image-tracker.js   # 图片追踪
├── style.css          # 样式文件
├── assets/            # 资源文件夹
├── dist/              # 构建输出
└── .github/           # GitHub配置
```

## 🔧 开发说明

### 添加PNG动画
1. 将PNG动画序列文件放入 `assets/` 文件夹
2. 文件名格式: `anim1.png`, `anim2.png`, `anim3.png` 等
3. 确保PNG文件有透明背景

### 添加标记图片
1. 将用于识别的图片放入 `assets/` 文件夹
2. 支持格式: PNG, JPG, JPEG
3. 确保图片有足够的对比度

## 🌐 浏览器支持

- ✅ Chrome 60+
- ✅ Safari 11+
- ✅ Firefox 55+
- ✅ Edge 79+

## 📝 注意事项

- 需要HTTPS环境或localhost才能使用摄像头
- 确保浏览器支持WebRTC API
- 手机端建议使用Chrome或Safari浏览器

## 🤝 贡献

欢迎提交Issue和Pull Request！

## �� 许可证

MIT License 