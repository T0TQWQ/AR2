import { ARAnimation } from './ar-animation.js';
import { QRCodeTracker } from './qr-tracker.js';
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
        this.init();
    }

    init() {
        console.log('开始初始化...');
        
        if (!checkBasicFeatures()) {
            console.error('基本功能检查失败');
            return;
        }
        
        this.initUI();
        this.initEventListeners();
        this.isInitialized = true;
        console.log('SimpleARApp初始化完成');
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
        
        console.log('UI元素初始化完成');
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
            this.updateStatus('摄像头已启动，请对准二维码或图片');
            
            console.log('AR启动成功');
            
        } catch (error) {
            console.error('AR启动失败:', error);
            this.hideLoading();
            this.showError('无法启动摄像头: ' + error.message);
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
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
            this.startScreen.classList.add('hidden');
            this.arScreen.classList.add('hidden');
        }
    }

    hideLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    showStartScreen() {
        if (this.startScreen) {
            this.startScreen.classList.remove('hidden');
            this.arScreen.classList.add('hidden');
            this.loadingScreen.classList.add('hidden');
        }
    }

    showARScreen() {
        if (this.arScreen) {
            this.arScreen.classList.remove('hidden');
            this.startScreen.classList.add('hidden');
            this.loadingScreen.classList.add('hidden');
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
            alert('应用初始化失败: ' + error.message);
        }
    }, 100);
}

// 监听页面加载事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 导出应用实例供调试使用
window.initARApp = initApp; 