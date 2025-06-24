// 移除Three.js依赖，只使用原生Canvas API
// import * as THREE from 'three';

export class ARAnimation {
    constructor() {
        this.canvas = null;
        this.isVisible = false;
        this.isRunning = false;
        this.targetPosition = { x: 0, y: 0 };
        this.targetSize = { width: 100, height: 100 };
        
        // GIF动画相关
        this.gifImage = null;
        this.gifLoaded = false;
        this.gifElement = null; // 用于显示动态GIF的img元素
        
        // 2D Canvas动画相关
        this.ctx = null;
        this.animationId = null;
        
        console.log('AR动画类初始化完成');
    }

    start(canvas, position, size) {
        console.log('启动AR动画...');
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.targetPosition = position || { x: 0, y: 0 };
        this.targetSize = size || { width: 100, height: 100 };
        
        if (!this.isRunning) {
            this.isRunning = true;
            this.isVisible = true;
            this.showGifAnimation();
        }
        
        console.log('AR动画已启动');
    }

    stop() {
        console.log('停止AR动画...');
        
        this.isRunning = false;
        this.isVisible = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 隐藏GIF元素
        if (this.gifElement) {
            this.gifElement.style.display = 'none';
        }
        
        // 清除canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        console.log('AR动画已停止');
    }

    showGifAnimation() {
        if (!this.isRunning || !this.gifElement) return;
        
        // 计算GIF的显示位置和大小
        const centerX = this.targetPosition.x;
        const centerY = this.targetPosition.y;
        
        // 使用更大的尺寸，确保GIF动画足够大且清晰
        const minSize = 150;
        const maxSize = Math.max(this.targetSize.width, this.targetSize.height);
        const size = Math.max(minSize, maxSize * 1.2); // 比目标尺寸稍大
        
        // 计算GIF的绘制位置和大小
        const gifWidth = this.gifImage.width;
        const gifHeight = this.gifImage.height;
        const scale = Math.min(size / gifWidth, size / gifHeight);
        const drawWidth = gifWidth * scale;
        const drawHeight = gifHeight * scale;
        
        // 计算左上角位置（GIF元素使用左上角定位）
        const drawX = centerX - drawWidth / 2;
        const drawY = centerY - drawHeight / 2;
        
        // 边界检查，确保GIF不会超出屏幕
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let finalX = Math.max(10, Math.min(drawX, viewportWidth - drawWidth - 10));
        let finalY = Math.max(10, Math.min(drawY, viewportHeight - drawHeight - 10));
        
        // 设置GIF元素的位置和大小
        this.gifElement.style.position = 'fixed'; // 使用fixed定位，相对于视口
        this.gifElement.style.left = finalX + 'px';
        this.gifElement.style.top = finalY + 'px';
        this.gifElement.style.width = drawWidth + 'px';
        this.gifElement.style.height = drawHeight + 'px';
        this.gifElement.style.display = 'block';
        this.gifElement.style.zIndex = '1000';
        this.gifElement.style.pointerEvents = 'none'; // 防止干扰触摸事件
        
        console.log('GIF动画显示:', {
            originalPosition: { x: centerX, y: centerY },
            calculatedPosition: { x: drawX, y: drawY },
            finalPosition: { x: finalX, y: finalY },
            size: { width: drawWidth, height: drawHeight },
            originalSize: { width: gifWidth, height: gifHeight },
            viewport: { width: viewportWidth, height: viewportHeight }
        });
    }

    // 加载GIF动画
    loadGif(gifPath) {
        return new Promise((resolve, reject) => {
            this.gifImage = new Image();
            this.gifImage.onload = () => {
                this.gifLoaded = true;
                console.log('GIF动画加载成功:', gifPath, '尺寸:', this.gifImage.width, 'x', this.gifImage.height);
                
                // 创建用于显示的img元素
                this.createGifElement(gifPath);
                
                resolve();
            };
            this.gifImage.onerror = (error) => {
                console.error('GIF动画加载失败:', error);
                reject(error);
            };
            this.gifImage.src = gifPath;
        });
    }

    createGifElement(gifPath) {
        // 移除旧的GIF元素
        if (this.gifElement) {
            this.gifElement.remove();
        }
        
        // 创建新的GIF元素
        this.gifElement = document.createElement('img');
        this.gifElement.src = gifPath;
        this.gifElement.style.display = 'none'; // 初始隐藏
        this.gifElement.style.position = 'absolute';
        this.gifElement.style.zIndex = '1000';
        this.gifElement.style.pointerEvents = 'none';
        
        // 添加到body中
        document.body.appendChild(this.gifElement);
        
        console.log('GIF元素已创建并添加到页面');
    }

    // 兼容旧版本的方法
    init() {
        console.log('AR动画初始化完成');
    }

    showAnimation(position, size) {
        this.start(null, position, size);
    }

    hideAnimation() {
        this.stop();
    }

    update() {
        // 这个方法保留用于兼容性
    }

    dispose() {
        this.stop();
        
        // 移除GIF元素
        if (this.gifElement) {
            this.gifElement.remove();
            this.gifElement = null;
        }
        
        console.log('AR动画资源已释放');
    }
} 