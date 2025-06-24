# AR2 透明动画应用

一个基于Web技术的增强现实(AR)应用，支持扫描图片或二维码显示透明底的2D动画，并提供拍照功能。



## 技术栈

- **前端框架**: 原生JavaScript (ES6+)
- **3D渲染**: Three.js
- **构建工具**: Vite
- **AR技术**: WebXR + 计算机视觉
- **样式**: CSS3 + 现代UI设计

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用方法

1. **启动应用**: 打开应用后点击"开始AR体验"按钮
2. **权限授权**: 允许浏览器访问摄像头
3. **扫描标记**: 将摄像头对准图片或二维码
4. **观看动画**: 检测到标记后会自动显示透明动画
5. **拍照保存**: 点击拍照按钮拍摄AR照片并保存

## 支持的标记类型

### 图片标记
- 棋盘格图案
- 圆形图案  
- 十字图案

### 二维码
- 标准QR码
- 高对比度二维码

## 项目结构

```
AR2/
├── index.html          # 主HTML文件
├── style.css           # 样式文件
├── main.js             # 主应用逻辑
├── ar-animation.js     # AR动画模块
├── image-tracker.js    # 图片跟踪器
├── qr-tracker.js       # 二维码跟踪器
├── package.json        # 项目配置
├── vite.config.js      # Vite配置
└── README.md           # 项目说明
```

## 浏览器兼容性

- Chrome 67+
- Firefox 60+
- Safari 11.1+
- Edge 79+

**注意**: 需要支持WebGL和getUserMedia API的现代浏览器

## 开发说明

### 添加新的图片标记

```javascript
// 在image-tracker.js中添加新的标记
const newPattern = createCustomPattern();
imageTracker.addMarker('newPattern', newPattern);
```

### 自定义动画效果

```javascript
// 在ar-animation.js中修改动画效果
createCustomAnimation() {
    // 添加自定义动画元素
}
```

### 扩展二维码功能

```javascript
// 在qr-tracker.js中添加更多二维码处理逻辑
processQRCodeData(data) {
    // 处理二维码数据
}
```

## 性能优化

- 使用Web Worker进行二维码检测
- 实现帧率控制避免过度渲染
- 优化图像处理算法
- 使用requestAnimationFrame进行动画

## 故障排除

### 摄像头无法访问
- 确保浏览器支持getUserMedia API
- 检查摄像头权限设置
- 尝试使用HTTPS协议

### 动画不显示
- 检查WebGL支持
- 确认Three.js正确加载
- 查看浏览器控制台错误信息

### 标记检测不准确
- 确保标记有足够的对比度
- 保持摄像头稳定
- 调整光照条件

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持图片和二维码检测
- 实现透明动画效果
- 添加拍照功能 
