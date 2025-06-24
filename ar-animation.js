import * as THREE from 'three';

export class ARAnimation {
    constructor() {
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationGroup = null;
        this.isVisible = false;
        this.isRunning = false;
        this.targetPosition = { x: 0, y: 0 };
        this.targetSize = { width: 100, height: 100 };
        
        // GIF动画相关
        this.gifImage = null;
        this.gifLoaded = false;
        
        // 2D Canvas动画相关
        this.ctx = null;
        this.animationId = null;
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
            this.animate();
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
        
        // 清除canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        console.log('AR动画已停止');
    }

    animate() {
        if (!this.isRunning || !this.ctx || !this.canvas) return;
        
        // 清除之前的绘制
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制GIF动画
        this.drawGifAnimation();
        
        // 继续动画循环
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawGifAnimation() {
        if (!this.ctx || !this.gifImage) return;
        
        const centerX = this.targetPosition.x;
        const centerY = this.targetPosition.y;
        const size = Math.min(this.targetSize.width, this.targetSize.height) * 0.8;
        
        // 计算GIF的绘制位置和大小
        const gifWidth = this.gifImage.width;
        const gifHeight = this.gifImage.height;
        const scale = Math.min(size / gifWidth, size / gifHeight);
        const drawWidth = gifWidth * scale;
        const drawHeight = gifHeight * scale;
        const drawX = centerX - drawWidth / 2;
        const drawY = centerY - drawHeight / 2;
        
        // 绘制GIF
        this.ctx.drawImage(this.gifImage, drawX, drawY, drawWidth, drawHeight);
    }

    // 加载GIF动画
    loadGif(gifPath) {
        return new Promise((resolve, reject) => {
            this.gifImage = new Image();
            this.gifImage.onload = () => {
                this.gifLoaded = true;
                console.log('GIF动画加载成功:', gifPath);
                resolve();
            };
            this.gifImage.onerror = (error) => {
                console.error('GIF动画加载失败:', error);
                reject(error);
            };
            this.gifImage.src = gifPath;
        });
    }

    // 兼容旧版本的Three.js方法
    init() {
        // 这个方法保留用于兼容性，但现在主要使用2D Canvas动画
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
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.scene) {
            this.scene.clear();
        }
        
        console.log('AR动画资源已释放');
    }
} 