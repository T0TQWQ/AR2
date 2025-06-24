// 移除Three.js依赖，只使用原生Canvas API
// import * as THREE from 'three';

export class ARAnimation {
    constructor() {
        this.canvas = null;
        this.isVisible = false;
        this.isRunning = false;
        this.targetPosition = { x: 0, y: 0 };
        this.targetSize = { width: 100, height: 100 };
        
        // PNG逐帧动画相关 - 优化版本
        this.frames = []; // 存储所有帧图片
        this.currentFrame = 0; // 当前帧索引
        this.frameCount = 0; // 总帧数
        this.fps = 8; // 降低帧率到8fps，减少CPU使用
        this.lastFrameTime = 0; // 上一帧时间
        this.isLoaded = false; // 是否加载完成
        
        // 2D Canvas动画相关
        this.ctx = null;
        this.animationId = null;
        
        // 性能优化：预计算尺寸
        this.cachedSizes = new Map();
        
        console.log('AR动画类初始化完成');
    }

    start(canvas, position, size) {
        if (!canvas) return;
        
        console.log('启动AR动画...');
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.targetPosition = position || { x: 0, y: 0 };
        this.targetSize = size || { width: 100, height: 100 };
        
        if (!this.isRunning) {
            this.isRunning = true;
            this.isVisible = true;
            this.lastFrameTime = performance.now();
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

    // 优化的逐帧动画循环
    animate() {
        if (!this.isRunning || !this.ctx || !this.canvas) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        // 根据帧率更新帧
        if (deltaTime >= (1000 / this.fps)) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.lastFrameTime = currentTime;
        }
        
        // 清除之前的绘制
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制当前帧
        this.drawCurrentFrame();
        
        // 继续动画循环
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 优化的绘制当前帧
    drawCurrentFrame() {
        if (!this.isLoaded || this.frames.length === 0) return;
        
        const frame = this.frames[this.currentFrame];
        if (!frame) return;
        
        // 使用缓存的尺寸计算
        const drawInfo = this.getCachedDrawInfo(frame);
        
        // 绘制当前帧
        this.ctx.drawImage(
            frame, 
            drawInfo.x, 
            drawInfo.y, 
            drawInfo.width, 
            drawInfo.height
        );
    }

    // 缓存绘制信息，避免重复计算
    getCachedDrawInfo(frame) {
        const cacheKey = `${frame.width}-${frame.height}-${this.targetSize.width}-${this.targetSize.height}`;
        
        if (this.cachedSizes.has(cacheKey)) {
            return this.cachedSizes.get(cacheKey);
        }
        
        // 计算绘制位置和大小
        const centerX = this.targetPosition.x;
        const centerY = this.targetPosition.y;
        
        // 使用更大的尺寸，确保动画足够大且清晰
        const minSize = 120; // 稍微减小最小尺寸
        const maxSize = Math.max(this.targetSize.width, this.targetSize.height);
        const size = Math.max(minSize, maxSize * 1.0); // 减少缩放倍数
        
        // 计算帧的绘制位置和大小
        const frameWidth = frame.width;
        const frameHeight = frame.height;
        const scale = Math.min(size / frameWidth, size / frameHeight);
        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        
        // 计算左上角位置
        const drawX = centerX - drawWidth / 2;
        const drawY = centerY - drawHeight / 2;
        
        // 边界检查，确保动画不会超出屏幕
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let finalX = Math.max(10, Math.min(drawX, viewportWidth - drawWidth - 10));
        let finalY = Math.max(10, Math.min(drawY, viewportHeight - drawHeight - 10));
        
        const drawInfo = { x: finalX, y: finalY, width: drawWidth, height: drawHeight };
        
        // 缓存结果
        this.cachedSizes.set(cacheKey, drawInfo);
        
        return drawInfo;
    }

    // 优化的PNG逐帧动画加载
    loadFrames() {
        return new Promise((resolve, reject) => {
            const framePaths = [
                '/images/GIF1.png',
                '/images/GIF2.png',
                '/images/GIF3.png',
                '/images/GIF4.png'
            ];
            
            let loadedCount = 0;
            let errorCount = 0;
            const totalFrames = framePaths.length;
            
            // 设置总体超时
            const overallTimeout = setTimeout(() => {
                if (loadedCount < totalFrames) {
                    reject(new Error('动画加载超时'));
                }
            }, 3000);
            
            framePaths.forEach((path, index) => {
                const img = new Image();
                
                // 设置单个图片加载超时
                const timeout = setTimeout(() => {
                    errorCount++;
                    console.warn(`帧${index + 1}加载超时: ${path}`);
                    
                    if (errorCount === totalFrames) {
                        clearTimeout(overallTimeout);
                        reject(new Error('所有帧加载失败'));
                    }
                }, 2000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    this.frames[index] = img;
                    loadedCount++;
                    
                    console.log(`帧${index + 1}加载成功: ${path}, 尺寸: ${img.width}x${img.height}`);
                    
                    if (loadedCount === totalFrames) {
                        clearTimeout(overallTimeout);
                        this.frameCount = totalFrames;
                        this.isLoaded = true;
                        console.log(`所有帧加载完成，共${totalFrames}帧`);
                        resolve();
                    }
                };
                
                img.onerror = (error) => {
                    clearTimeout(timeout);
                    errorCount++;
                    console.error(`帧${index + 1}加载失败:`, error);
                    
                    if (errorCount === totalFrames) {
                        clearTimeout(overallTimeout);
                        reject(new Error('所有帧加载失败'));
                    }
                };
                
                // 设置跨域属性
                img.crossOrigin = 'anonymous';
                img.src = path;
            });
        });
    }

    // 兼容旧版本的GIF加载方法
    loadGif(gifPath) {
        console.log('检测到GIF路径，自动切换到PNG逐帧动画模式');
        return this.loadFrames();
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
        
        // 清理帧图片
        this.frames = [];
        this.isLoaded = false;
        
        // 清理缓存
        this.cachedSizes.clear();
        
        console.log('AR动画资源已清理');
    }
} 