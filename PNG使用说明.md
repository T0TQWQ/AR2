# PNG图片使用说明

## 如何添加您的PNG图片

### 1. 动画PNG序列（用于AR动画效果）

**文件命名规则：**
```
assets/anim1.png  - 动画第1帧
assets/anim2.png  - 动画第2帧
assets/anim3.png  - 动画第3帧
assets/anim4.png  - 动画第4帧
assets/anim5.png  - 动画第5帧
... 更多帧
```

**步骤：**
1. 将您的PNG动画序列文件放入 `assets` 文件夹
2. 按照 `anim1.png`, `anim2.png`, `anim3.png` 的格式命名
3. 启动应用，系统会自动加载这些动画帧
4. 当检测到标记时，会播放您的PNG动画序列

**动画设置：**
- 动画速度可以通过修改 `ar-animation.js` 中的 `animationSpeed` 参数调整
- 默认帧率约为10fps，可以根据需要调整

### 2. 标记PNG图片（用于AR识别）

**预定义文件名：**
```
assets/marker1.png  - 自定义标记1
assets/marker2.png  - 自定义标记2
assets/marker3.png  - 自定义标记3
assets/logo.png     - 公司Logo
assets/icon.png     - 图标
```

**步骤：**
1. 将您的PNG标记图片放入 `assets` 文件夹
2. 使用上述预定义文件名，或修改 `image-tracker.js` 中的文件名列表
3. 系统会自动加载这些标记用于AR识别
4. 当摄像头对准这些图片时，会触发AR动画

### 3. 自定义文件名

如果您想使用自己的文件名，可以修改以下文件：

**修改动画文件列表：**
在 `ar-animation.js` 中找到 `loadPngAnimation()` 方法，修改 `pngFiles` 数组：

```javascript
const pngFiles = [
    'assets/your-anim1.png',
    'assets/your-anim2.png',
    'assets/your-anim3.png'
];
```

**修改标记文件列表：**
在 `image-tracker.js` 中找到 `loadCustomMarkers()` 方法，修改 `customMarkers` 数组：

```javascript
const customMarkers = [
    { id: 'myMarker1', url: 'assets/my-marker1.png' },
    { id: 'myMarker2', url: 'assets/my-marker2.png' }
];
```

## 图片要求

### 动画PNG要求：
- 格式：PNG（推荐）或JPG
- 尺寸：建议 256x256 到 512x512 像素
- 背景：透明背景效果最佳
- 文件大小：每帧建议小于100KB
- 帧数：建议5-30帧

### 标记PNG要求：
- 格式：PNG（推荐）或JPG
- 尺寸：建议 64x64 到 256x256 像素
- 对比度：高对比度，黑白分明
- 特征：具有明显的几何特征
- 文件大小：建议小于50KB

## 测试方法

1. **启动应用：**
   ```bash
   npm run dev
   ```

2. **访问标记页面：**
   打开 `http://localhost:3000/markers.html`

3. **测试自定义标记：**
   - 将您的PNG标记图片放入 `assets` 文件夹
   - 刷新页面，查看是否显示在"自定义PNG标记示例"部分
   - 打印或保存标记页面到手机

4. **测试AR效果：**
   - 打开主应用页面
   - 点击"开始AR体验"
   - 将摄像头对准您的标记图片
   - 观察是否显示您的PNG动画

## 故障排除

### 动画不显示：
- 检查文件名是否正确（anim1.png, anim2.png...）
- 确认文件在 `assets` 文件夹中
- 查看浏览器控制台是否有错误信息

### 标记不识别：
- 确保图片有足够的对比度
- 检查图片尺寸是否合适
- 尝试调整光照条件

### 性能问题：
- 减少动画帧数
- 压缩图片文件大小
- 降低图片分辨率

## 高级配置

### 调整动画速度：
```javascript
// 在 ar-animation.js 中
this.animationSpeed = 0.1; // 调整这个值
```

### 调整检测灵敏度：
```javascript
// 在 image-tracker.js 中
this.detectionThreshold = 0.7; // 调整这个值
```

### 添加新的动画效果：
在 `ar-animation.js` 的 `updatePngAnimation()` 方法中添加自定义效果。 