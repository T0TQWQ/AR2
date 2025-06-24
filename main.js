import { ARAnimation } from './ar-animation.js';
import { ImageTracker } from './image-tracker.js';

console.log('AR应用开始加载...');

// 快速启动模式配置
const FAST_START_CONFIG = {
    // 快速启动：立即显示界面，后台加载资源
    enableFastStart: true,
    // 资源加载超时时间
    resourceTimeout: 2000,
    // 检测间隔（毫秒）
    detectionInterval: 200,
    // 简化检测模式
    simpleDetection: true,
    // 延迟初始化追踪器
    delayTrackerInit: 500
};

// 检查基本功能
function checkBasicFeatures() {
    console.log('检查基本功能...');
    
    // 检查DOM是否加载完成
    if (document.readyState === 'loading') {
        console.log('DOM还在加载中...');
        return false;
    }
    
    // 检查必要的元素是否存在
    const startARBtn = document.getElementById('startAR');
    const startScreen = document.getElementById('startScreen');
    const arScreen = document.getElementById('arScreen');
    const loadingScreen = document.getElementById('loadingScreen');
    
    console.log('UI元素检查:', {
        startARBtn: !!startARBtn,
        startScreen: !!startScreen,
        arScreen: !!arScreen,
        loadingScreen: !!loadingScreen
    });
    
    if (!startARBtn || !startScreen || !arScreen || !loadingScreen) {
        console.error('必要的UI元素未找到！');
        return false;
    }
    
    return true;
}

// 优化的AR应用类
class OptimizedARApp {
    constructor() {
        console.log('初始化OptimizedARApp...');
        this.isInitialized = false;
        this.isTracking = false;
        this.animation = null;
        this.imageTracker = null;
        this.detectionCanvas = null;
        this.detectionCtx = null;
        this.resourcesLoaded = false;
        this.init();
    }

    init() {
        console.log('开始快速初始化...');
        
        if (!checkBasicFeatures()) {
            console.error('基本功能检查失败');
            this.hideLoading();
            this.showError('应用初始化失败：基本功能检查失败');
            return;
        }
        
        try {
            this.initUI();
            this.initEventListeners();
            
            // 快速启动：立即显示界面
            if (FAST_START_CONFIG.enableFastStart) {
                this.isInitialized = true;
                this.hideLoading();
                this.showStartScreen(); // 明确显示启动界面
                console.log('快速启动完成，界面已显示');
                
                // 后台异步加载资源
                this.loadResourcesInBackground();
            } else {
                // 传统模式：等待资源加载完成
                this.initTrackersAsync();
            }
            
        } catch (error) {
            console.error('初始化过程中出错:', error);
            this.hideLoading();
            this.showError('应用初始化失败: ' + error.message);
        }
    }

    initUI() {
        console.log('初始化UI元素...');
        this.startScreen = document.getElementById('startScreen');
        this.arScreen = document.getElementById('arScreen');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.startARBtn = document.getElementById('startAR');
        this.backBtn = document.getElementById('backBtn');
        this.captureBtn = document.getElementById('captureBtn');
        this.status = document.getElementById('status');
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }
        
        // 创建检测用的canvas
        this.detectionCanvas = document.createElement('canvas');
        this.detectionCtx = this.detectionCanvas.getContext('2d');
        
        console.log('UI元素初始化完成');
    }

    async loadResourcesInBackground() {
        console.log('后台加载资源...');
        
        try {
            // 延迟初始化追踪器，减少启动时间
            setTimeout(async () => {
                await this.initTrackersAsync();
            }, FAST_START_CONFIG.delayTrackerInit);
            
        } catch (error) {
            console.error('后台资源加载失败:', error);
        }
    }

    async initTrackersAsync() {
        try {
            console.log('开始异步初始化追踪器...');
            
            // 并行初始化核心组件
            const [imageTracker, animation] = await Promise.allSettled([
                this.createImageTracker(),
                this.createAnimation()
            ]);
            
            if (imageTracker.status === 'fulfilled') {
                this.imageTracker = imageTracker.value;
                console.log('图片追踪器初始化成功');
            }
            
            if (animation.status === 'fulfilled') {
                this.animation = animation.value;
                console.log('动画组件初始化成功');
            }
            
            this.resourcesLoaded = true;
            console.log('AR组件初始化完成');
            
        } catch (error) {
            console.error('追踪器初始化失败:', error);
        }
    }

    async createImageTracker() {
        const tracker = new ImageTracker();
        
        // 设置简化的检测模式
        if (FAST_START_CONFIG.simpleDetection) {
            tracker.detectionInterval = FAST_START_CONFIG.detectionInterval;
            tracker.threshold = 0.15; // 降低阈值，提高检测灵敏度
        }
        
        // 尝试加载marker，但不阻塞
        try {
            await tracker.addTemplate('/images/marker.png', 'marker');
            console.log('Marker加载成功');
        } catch (error) {
            console.log('Marker加载失败，使用备用方案');
            await this.addTestTemplate(tracker);
        }
        
        return tracker;
    }

    async createAnimation() {
        const animation = new ARAnimation();
        
        // 尝试加载PNG动画，但不阻塞
        try {
            await animation.loadFrames();
            console.log('PNG动画加载成功');
        } catch (error) {
            console.log('PNG动画加载失败:', error.message);
        }
        
        return animation;
    }

    async addTestTemplate(tracker) {
        try {
            // 创建一个简单的测试模板
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 80;
            canvas.height = 80;
            
            // 绘制一个简单的测试图案
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 80, 80);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, 60, 60);
            ctx.fillStyle = '#000000';
            ctx.fillRect(25, 25, 30, 30);
            
            // 将canvas转换为blob URL
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                tracker.addTemplate(url, 'test-marker');
                console.log('测试模板添加成功');
            });
            
        } catch (error) {
            console.error('添加测试模板失败:', error);
        }
    }

    initEventListeners() {
        console.log('初始化事件监听器...');
        
        if (this.startARBtn) {
            this.startARBtn.addEventListener('click', () => this.startAR());
        }
        
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.stopAR());
        }
        
        if (this.captureBtn) {
            this.captureBtn.addEventListener('click', () => this.capturePhoto());
        }
        
        console.log('事件监听器初始化完成');
    }

    async startAR() {
        console.log('开始AR体验...');
        
        if (!this.isInitialized) {
            this.showError('AR组件尚未初始化完成，请稍后再试');
            return;
        }
        
        try {
            this.showARScreen();
            this.updateStatus('正在启动摄像头...');
            
            const cameraStarted = await this.requestCamera();
            if (!cameraStarted) {
                this.showError('无法启动摄像头，请检查权限设置');
                return;
            }
            
            this.updateStatus('摄像头已启动，等待视频加载...');
            await this.waitForVideoLoad();
            
            this.updateStatus('开始追踪marker...');
            this.startTracking();
            
        } catch (error) {
            console.error('启动AR失败:', error);
            this.showError('启动AR失败: ' + error.message);
        }
    }

    startTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        this.trackFrame();
        console.log('开始追踪');
    }

    stopTracking() {
        this.isTracking = false;
        
        if (this.animation) {
            this.animation.stop();
        }
        
        console.log('停止追踪');
    }

    trackFrame() {
        if (!this.isTracking || !this.video || !this.canvas || !this.ctx) return;
        
        try {
            // 绘制视频帧到canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // 检测marker
            this.detectMarker();
            
            // 继续下一帧
            requestAnimationFrame(() => this.trackFrame());
            
        } catch (error) {
            console.error('追踪帧处理错误:', error);
            this.stopTracking();
        }
    }

    async detectMarker() {
        if (!this.imageTracker || !this.ctx) return;
        
        try {
            const detectionResult = await this.imageTracker.detect(
                this.ctx, 
                this.canvas.width, 
                this.canvas.height
            );
            
            if (detectionResult.detected) {
                this.showAnimation(detectionResult);
            } else {
                this.hideAnimation();
            }
            
        } catch (error) {
            console.error('检测marker错误:', error);
        }
    }

    showAnimation(detectionResult) {
        if (!this.animation || !this.canvas) return;
        
        try {
            const position = {
                x: detectionResult.position.x + detectionResult.size.width / 2,
                y: detectionResult.position.y - detectionResult.size.height / 2 // 显示在marker上方
            };
            
            const size = {
                width: detectionResult.size.width,
                height: detectionResult.size.height
            };
            
            this.animation.start(this.canvas, position, size);
            this.updateStatus('检测到marker，显示动画');
            
        } catch (error) {
            console.error('显示动画错误:', error);
        }
    }

    hideAnimation() {
        if (this.animation) {
            this.animation.stop();
        }
    }

    async requestCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'environment' // 优先使用后置摄像头
                }
            });
            
            this.video.srcObject = stream;
            this.video.play();
            
            console.log('摄像头启动成功');
            return true;
            
        } catch (error) {
            console.error('摄像头启动失败:', error);
            return false;
        }
    }

    waitForVideoLoad() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('视频加载超时'));
            }, 5000);
            
            this.video.onloadedmetadata = () => {
                clearTimeout(timeout);
                
                // 设置canvas尺寸
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                
                console.log('视频加载完成');
                resolve();
            };
            
            this.video.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error('视频加载失败'));
            };
        });
    }

    stopAR() {
        console.log('停止AR体验...');
        
        this.stopTracking();
        
        // 停止摄像头
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        this.showStartScreen();
        this.updateStatus('AR体验已停止');
    }

    capturePhoto() {
        if (!this.canvas) return;
        
        try {
            // 创建拍照canvas
            const photoCanvas = document.createElement('canvas');
            const photoCtx = photoCanvas.getContext('2d');
            
            photoCanvas.width = this.canvas.width;
            photoCanvas.height = this.canvas.height;
            
            // 绘制当前帧
            photoCtx.drawImage(this.canvas, 0, 0);
            
            // 转换为图片
            const photoDataUrl = photoCanvas.toDataURL('image/png');
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `ar-photo-${Date.now()}.png`;
            link.href = photoDataUrl;
            link.click();
            
            this.updateStatus('照片已保存');
            console.log('照片已保存');
            
        } catch (error) {
            console.error('拍照失败:', error);
            this.updateStatus('拍照失败');
        }
    }

    showLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
        }
        if (this.arScreen) {
            this.arScreen.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }

    showStartScreen() {
        if (this.startScreen) {
            this.startScreen.style.display = 'flex';
        }
        if (this.arScreen) {
            this.arScreen.style.display = 'none';
        }
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }

    showARScreen() {
        if (this.arScreen) {
            this.arScreen.style.display = 'flex';
        }
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
        }
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }

    updateStatus(message) {
        if (this.status) {
            this.status.textContent = message;
        }
        console.log('状态更新:', message);
    }

    showError(message) {
        console.error('错误:', message);
        this.updateStatus('错误: ' + message);
        
        // 3秒后清除错误信息
        setTimeout(() => {
            this.updateStatus('');
        }, 3000);
    }
}

// 初始化应用
function initApp() {
    console.log('开始初始化AR应用...');
    
    // 检查浏览器兼容性
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('您的浏览器不支持摄像头功能，请使用现代浏览器');
        return;
    }
    
    // 创建应用实例
    window.arApp = new OptimizedARApp();
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
} 