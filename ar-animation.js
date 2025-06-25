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
        if (!this.isLoaded || this.frames.length === 0) {
            console.log('动画未加载完成，跳过绘制', {
                isLoaded: this.isLoaded,
                framesCount: this.frames.length,
                currentFrame: this.currentFrame
            });
            
            // 在canvas上绘制调试信息
            if (this.ctx && this.canvas) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                this.ctx.fillRect(10, 10, 300, 60);
                this.ctx.fillStyle = 'white';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('动画未加载', 20, 35);
                this.ctx.fillText(`已加载: ${this.frames.filter(f => f).length}/${this.frameCount}`, 20, 55);
            }
            return;
        }
        
        const frame = this.frames[this.currentFrame];
        if (!frame) {
            console.log('当前帧不存在', {
                currentFrame: this.currentFrame,
                totalFrames: this.frameCount,
                frames: this.frames.map(f => f ? 'loaded' : 'null')
            });
            
            // 在canvas上绘制调试信息
            if (this.ctx && this.canvas) {
                this.ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
                this.ctx.fillRect(10, 10, 300, 60);
                this.ctx.fillStyle = 'white';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('当前帧不存在', 20, 35);
                this.ctx.fillText(`帧${this.currentFrame} / 总${this.frameCount}`, 20, 55);
            }
            return;
        }
        
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
        
        // 绘制调试边框
        this.ctx.strokeStyle = 'lime';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(drawInfo.x, drawInfo.y, drawInfo.width, drawInfo.height);
        
        // 绘制帧信息
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(drawInfo.x, drawInfo.y - 25, 150, 25);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`帧${this.currentFrame + 1}/${this.frameCount}`, drawInfo.x + 5, drawInfo.y - 8);
        
        // 调试信息：每10帧输出一次
        if (this.currentFrame % 10 === 0) {
            console.log('绘制动画帧', {
                frame: this.currentFrame,
                position: drawInfo,
                frameSize: `${frame.width}x${frame.height}`,
                canvasSize: `${this.canvas.width}x${this.canvas.height}`
            });
        }
    }

    // 新增：在指定的context上绘制当前帧（用于拍照功能）
    drawCurrentFrameToContext(targetCtx, canvasWidth, canvasHeight) {
        if (!this.isLoaded || this.frames.length === 0) {
            console.log('动画未加载完成，跳过绘制到目标context');
            return;
        }
        
        const frame = this.frames[this.currentFrame];
        if (!frame) {
            console.log('当前帧不存在，跳过绘制到目标context');
            return;
        }
        
        // 计算在目标canvas上的绘制位置和大小
        const centerX = this.targetPosition.x;
        const centerY = this.targetPosition.y;
        
        // 使用更大的尺寸，确保动画足够大且清晰
        const minSize = 120;
        const maxSize = Math.max(this.targetSize.width, this.targetSize.height);
        const size = Math.max(minSize, maxSize * 1.0);
        
        // 计算帧的绘制位置和大小
        const frameWidth = frame.width;
        const frameHeight = frame.height;
        const scale = Math.min(size / frameWidth, size / frameHeight);
        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        
        // 计算左上角位置
        const drawX = centerX - drawWidth / 2;
        const drawY = centerY - drawHeight / 2;
        
        // 边界检查，确保动画不会超出目标canvas
        let finalX = Math.max(10, Math.min(drawX, canvasWidth - drawWidth - 10));
        let finalY = Math.max(10, Math.min(drawY, canvasHeight - drawHeight - 10));
        
        // 绘制当前帧到目标context
        targetCtx.drawImage(
            frame, 
            finalX, 
            finalY, 
            drawWidth, 
            drawHeight
        );
        
        console.log('动画帧已绘制到目标context', {
            frame: this.currentFrame,
            position: { x: finalX, y: finalY, width: drawWidth, height: drawHeight },
            targetCanvasSize: `${canvasWidth}x${canvasHeight}`
        });
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
                'images/GIF1.png',
                'images/GIF2.png',
                'images/GIF3.png',
                'images/GIF4.png'
            ];
            
            let loadedCount = 0;
            let errorCount = 0;
            const totalFrames = framePaths.length;
            
            console.log('开始加载PNG动画帧...', framePaths);
            
            // 设置总体超时
            const overallTimeout = setTimeout(() => {
                if (loadedCount < totalFrames) {
                    console.error('动画加载超时，已加载:', loadedCount, '/', totalFrames);
                    reject(new Error('动画加载超时'));
                }
            }, 5000); // 增加超时时间到5秒
            
            framePaths.forEach((path, index) => {
                const img = new Image();
                
                img.onload = () => {
                    loadedCount++;
                    console.log(`✅ 帧${index + 1}加载成功:`, path, `(${img.width}x${img.height})`);
                    this.frames[index] = img;
                    
                    if (loadedCount === totalFrames) {
                        clearTimeout(overallTimeout);
                        this.frameCount = totalFrames;
                        this.isLoaded = true;
                        console.log('🎉 所有动画帧加载完成!', {
                            totalFrames: this.frameCount,
                            frames: this.frames.map(f => f ? `${f.width}x${f.height}` : 'null')
                        });
                        resolve();
                    }
                };
                
                img.onerror = (error) => {
                    errorCount++;
                    console.error(`❌ 帧${index + 1}加载失败:`, path, error);
                    this.frames[index] = null;
                    
                    if (errorCount === totalFrames) {
                        clearTimeout(overallTimeout);
                        console.error('所有动画帧加载失败');
                        reject(new Error('所有动画帧加载失败'));
                    }
                };
                
                // 添加跨域支持
                img.crossOrigin = 'anonymous';
                img.src = path;
                console.log(`🔄 开始加载帧${index + 1}:`, path);
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