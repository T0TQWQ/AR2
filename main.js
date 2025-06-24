import { ARAnimation } from './ar-animation.js';
import { ImageTracker } from './image-tracker.js';

console.log('AR应用开始加载...');

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

// 简化的AR应用类
class SimpleARApp {
    constructor() {
        console.log('初始化SimpleARApp...');
        this.isInitialized = false;
        this.isTracking = false;
        this.animation = null;
        this.imageTracker = null;
        this.detectionCanvas = null;
        this.detectionCtx = null;
        this.init();
    }

    init() {
        console.log('开始初始化...');
        
        if (!checkBasicFeatures()) {
            console.error('基本功能检查失败');
            this.hideLoading();
            this.showError('应用初始化失败：基本功能检查失败');
            return;
        }
        
        try {
            this.initUI();
            this.initEventListeners();
            
            // 异步初始化追踪器
            this.initTrackersAsync();
            
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

    async initTrackersAsync() {
        try {
            console.log('开始异步初始化追踪器...');
            
            // 立即初始化核心组件，不等待资源加载
            this.imageTracker = new ImageTracker();
            this.animation = new ARAnimation();
            
            // 立即设置初始化完成标志
            this.isInitialized = true;
            console.log('AR组件核心初始化完成');
            
            // 立即隐藏加载界面
            this.hideLoading();
            
            // 静默后台加载资源，不更新状态
            this.loadResourcesSilently();
            
        } catch (error) {
            console.error('追踪器初始化失败:', error);
            this.hideLoading();
            this.showError('AR组件初始化失败: ' + error.message);
        }
    }

    async loadResourcesSilently() {
        try {
            console.log('静默后台加载资源...');
            
            // 只尝试最可能的路径，不显示加载状态
            const gifPath = '/images/ts.GIF';
            const markerPath = '/images/marker.png';
            
            // 并行加载，但使用更短的超时
            const promises = [
                this.loadGifSilently(gifPath),
                this.loadMarkerSilently(markerPath)
            ];
            
            await Promise.allSettled(promises);
            console.log('后台资源加载完成');
            
        } catch (error) {
            console.error('后台资源加载失败:', error);
        }
    }

    async loadGifSilently(gifPath) {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('加载超时')), 1500);
            });
            
            await Promise.race([
                this.animation.loadGif(gifPath),
                timeoutPromise
            ]);
            
            console.log(`GIF加载成功: ${gifPath}`);
            
        } catch (error) {
            console.log(`GIF加载失败: ${error.message}`);
        }
    }

    async loadMarkerSilently(markerPath) {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('加载超时')), 1500);
            });
            
            await Promise.race([
                this.imageTracker.addTemplate(markerPath, 'marker'),
                timeoutPromise
            ]);
            
            console.log(`Marker加载成功: ${markerPath}`);
            
        } catch (error) {
            console.log(`Marker加载失败: ${error.message}`);
            // 如果加载失败，添加测试模板
            await this.addTestTemplate();
        }
    }

    async addTestTemplate() {
        try {
            // 创建一个简单的测试模板
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            
            // 绘制一个简单的测试图案
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 100, 100);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, 80, 80);
            ctx.fillStyle = '#000000';
            ctx.fillRect(30, 30, 40, 40);
            
            // 将canvas转换为blob URL
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                this.imageTracker.addTemplate(url, 'test-marker');
                console.log('添加测试模板成功');
            });
            
        } catch (error) {
            console.error('添加测试模板失败:', error);
        }
    }

    initEventListeners() {
        console.log('初始化事件监听器...');
        
        // 开始AR按钮
        if (this.startARBtn) {
            console.log('添加开始AR按钮事件监听器');
            this.startARBtn.addEventListener('click', (e) => {
                console.log('开始AR按钮被点击！');
                e.preventDefault();
                this.startAR();
            });
        } else {
            console.error('开始AR按钮未找到！');
        }
        
        // 返回按钮
        if (this.backBtn) {
            this.backBtn.addEventListener('click', (e) => {
                console.log('返回按钮被点击！');
                e.preventDefault();
                this.stopAR();
            });
        }
        
        // 拍照按钮
        if (this.captureBtn) {
            this.captureBtn.addEventListener('click', (e) => {
                console.log('拍照按钮被点击！');
                e.preventDefault();
                this.capturePhoto();
            });
        }
        
        // 拍照相关事件
        const saveBtn = document.getElementById('saveBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.savePhoto();
            });
        }
        
        if (retakeBtn) {
            retakeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.retakePhoto();
            });
        }
        
        console.log('事件监听器初始化完成');
    }

    async startAR() {
        console.log('开始启动AR...');
        
        try {
            this.showLoading();
            this.updateStatus('正在初始化摄像头...');
            
            // 检查摄像头支持
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('浏览器不支持摄像头功能');
            }
            
            // 请求摄像头权限
            const stream = await this.requestCamera();
            if (!stream) {
                this.hideLoading();
                return;
            }

            // 设置视频流
            if (this.video) {
                this.video.srcObject = stream;
                await this.waitForVideoLoad();
            }
            
            // 切换到AR界面
            this.showARScreen();
            this.updateStatus('摄像头已启动，请对准marker.png图片');
            
            // 开始追踪
            this.startTracking();
            
            console.log('AR启动成功');
            
        } catch (error) {
            console.error('AR启动失败:', error);
            this.hideLoading();
            this.showError('无法启动摄像头: ' + error.message);
        }
    }

    startTracking() {
        if (this.isTracking) return;
        
        console.log('开始追踪...');
        this.isTracking = true;
        this.trackFrame();
    }

    stopTracking() {
        console.log('停止追踪...');
        this.isTracking = false;
        
        // 停止动画
        if (this.animation) {
            this.animation.stop();
        }
    }

    trackFrame() {
        if (!this.isTracking || !this.video || !this.canvas) return;
        
        try {
            // 设置canvas尺寸
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.detectionCanvas.width = this.video.videoWidth;
            this.detectionCanvas.height = this.video.videoHeight;
            
            // 绘制视频帧到canvas
            this.ctx.drawImage(this.video, 0, 0);
            this.detectionCtx.drawImage(this.video, 0, 0);
            
            // 检测marker图片
            this.detectMarker();
            
        } catch (error) {
            console.error('追踪帧错误:', error);
        }
        
        // 继续下一帧
        if (this.isTracking) {
            requestAnimationFrame(() => this.trackFrame());
        }
    }

    async detectMarker() {
        try {
            if (!this.imageTracker) return;
            
            const result = await this.imageTracker.detect(
                this.detectionCtx, 
                this.detectionCanvas.width, 
                this.detectionCanvas.height
            );
            
            if (result.detected) {
                console.log('✅ 检测到marker图片:', result);
                this.updateStatus('检测到marker图片！显示动画中...');
                
                // 显示2D动画
                this.showAnimation(result);
            } else {
                // 尝试使用简化检测
                const simpleResult = this.imageTracker.detectSimple(
                    this.detectionCtx, 
                    this.detectionCanvas.width, 
                    this.detectionCanvas.height
                );
                
                if (simpleResult.detected) {
                    console.log('✅ 简化检测到marker图片:', simpleResult);
                    this.updateStatus('检测到marker图片！显示动画中...');
                    
                    // 显示2D动画
                    this.showAnimation(simpleResult);
                }
            }
            
        } catch (error) {
            console.error('marker检测错误:', error);
        }
    }

    showAnimation(detectionResult) {
        try {
            if (!this.animation) return;
            
            // 使用检测到的marker位置
            const markerPosition = detectionResult.position || { x: 0, y: 0 };
            const markerSize = detectionResult.size || { width: 100, height: 100 };
            
            // 计算动画位置 - 显示在marker正上方
            const position = {
                x: markerPosition.x,  // 与marker水平对齐
                y: markerPosition.y - markerSize.height * 0.8  // 在marker上方，留一些间距
            };
            
            // 使用合适的尺寸，基于marker大小
            const size = {
                width: Math.max(markerSize.width * 1.2, 150),   // 比marker稍大，最小150px
                height: Math.max(markerSize.height * 1.2, 150)  // 比marker稍大，最小150px
            };
            
            console.log('显示动画:', { 
                markerPosition, 
                markerSize, 
                animationPosition: position, 
                animationSize: size 
            });
            
            // 启动动画
            this.animation.start(this.canvas, position, size);
            
        } catch (error) {
            console.error('显示动画错误:', error);
        }
    }

    async requestCamera() {
        try {
            console.log('请求摄像头权限...');
            
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('摄像头权限获取成功');
            return stream;
            
        } catch (error) {
            console.error('摄像头权限获取失败:', error);
            
            let errorMessage = '摄像头启动失败';
            
            switch (error.name) {
                case 'NotAllowedError':
                    errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
                    break;
                case 'NotFoundError':
                    errorMessage = '未找到摄像头设备';
                    break;
                case 'NotSupportedError':
                    errorMessage = '您的浏览器不支持摄像头功能';
                    break;
                case 'NotReadableError':
                    errorMessage = '摄像头被其他应用占用';
                    break;
                case 'OverconstrainedError':
                    errorMessage = '摄像头不支持请求的分辨率';
                    break;
                default:
                    errorMessage = '摄像头启动失败: ' + error.message;
            }
            
            this.showError(errorMessage);
            return null;
        }
    }

    waitForVideoLoad() {
        return new Promise((resolve, reject) => {
            if (!this.video) {
                reject(new Error('视频元素不存在'));
                return;
            }
            
            const timeout = setTimeout(() => {
                reject(new Error('视频加载超时'));
            }, 10000);
            
            if (this.video.readyState >= 2) {
                clearTimeout(timeout);
                resolve();
            } else {
                this.video.addEventListener('loadeddata', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
                
                this.video.addEventListener('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }, { once: true });
            }
        });
    }

    stopAR() {
        console.log('停止AR...');
        
        // 停止追踪
        this.stopTracking();
        
        // 停止动画
        if (this.animation) {
            this.animation.stop();
        }
        
        // 停止视频流
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => {
                track.stop();
                console.log('停止视频轨道:', track.kind);
            });
            this.video.srcObject = null;
        }
        
        // 切换回启动界面
        this.showStartScreen();
        console.log('AR已停止');
    }

    capturePhoto() {
        console.log('拍照功能...');
        alert('拍照功能开发中...');
    }

    savePhoto() {
        console.log('保存照片...');
        alert('保存功能开发中...');
    }

    showLoading() {
        console.log('显示加载界面...');
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
            this.startScreen.classList.add('hidden');
            this.arScreen.classList.add('hidden');
        } else {
            console.error('加载界面元素未找到');
        }
    }

    hideLoading() {
        console.log('隐藏加载界面...');
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        } else {
            console.error('加载界面元素未找到');
        }
    }

    showStartScreen() {
        console.log('显示启动界面...');
        if (this.startScreen) {
            this.startScreen.classList.remove('hidden');
            this.arScreen.classList.add('hidden');
            this.loadingScreen.classList.add('hidden');
        } else {
            console.error('启动界面元素未找到');
        }
    }

    showARScreen() {
        console.log('显示AR界面...');
        if (this.arScreen) {
            this.arScreen.classList.remove('hidden');
            this.startScreen.classList.add('hidden');
            this.loadingScreen.classList.add('hidden');
        } else {
            console.error('AR界面元素未找到');
        }
    }

    updateStatus(message) {
        console.log('状态更新:', message);
        if (this.status) {
            const statusText = this.status.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = message;
            }
        }
    }

    showError(message) {
        console.error('错误:', message);
        alert(message);
        this.hideLoading();
        this.showStartScreen();
    }
}

// 页面加载完成后初始化应用
function initApp() {
    console.log('页面加载完成，开始初始化应用...');
    
    // 延迟一点确保DOM完全加载
    setTimeout(() => {
        try {
            window.arApp = new SimpleARApp();
            console.log('AR应用初始化完成');
        } catch (error) {
            console.error('AR应用初始化失败:', error);
            
            // 尝试隐藏加载界面
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            
            // 显示错误信息
            alert('应用初始化失败: ' + error.message);
        }
    }, 100);
    
    // 添加超时保护
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.warn('应用初始化超时，强制隐藏加载界面');
            loadingScreen.classList.add('hidden');
            
            const startScreen = document.getElementById('startScreen');
            if (startScreen) {
                startScreen.classList.remove('hidden');
            }
            
            alert('应用初始化超时，请刷新页面重试');
        }
    }, 15000); // 15秒超时
}

// 监听页面加载事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 导出应用实例供调试使用
window.initARApp = initApp; 