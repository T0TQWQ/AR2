import * as THREE from 'three';
import { ARAnimation } from './ar-animation.js';
import { ImageTracker } from './image-tracker.js';
import { QRCodeTracker } from './qr-tracker.js';

class ARApp {
    constructor() {
        this.currentScreen = 'start';
        this.video = null;
        this.canvas = null;
        this.arAnimation = null;
        this.imageTracker = null;
        this.qrTracker = null;
        this.isARActive = false;
        this.stream = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showScreen('start');
    }

    setupEventListeners() {
        // 启动按钮
        document.getElementById('startAR').addEventListener('click', () => {
            console.log('开始AR按钮被点击');
            this.startAR();
        });

        // 返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            this.stopAR();
        });

        // 拍照按钮
        document.getElementById('captureBtn').addEventListener('click', () => {
            this.capturePhoto();
        });

        // 保存照片
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.savePhoto();
        });

        // 重拍照片
        document.getElementById('retakeBtn').addEventListener('click', () => {
            this.hideCapturePreview();
        });
    }

    async startAR() {
        try {
            console.log('=== AR启动调试信息 ===');
            console.log('浏览器信息:', navigator.userAgent);
            console.log('当前协议:', window.location.protocol);
            console.log('当前域名:', window.location.hostname);
            console.log('mediaDevices支持:', !!navigator.mediaDevices);
            console.log('getUserMedia支持:', !!navigator.mediaDevices?.getUserMedia);
            
            // 检查权限状态
            if (navigator.permissions) {
                try {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                    console.log('摄像头权限状态:', permissionStatus.state);
                } catch (e) {
                    console.log('无法查询权限状态:', e);
                }
            }
            
            console.log('开始启动AR...');
            this.showScreen('loading');
            this.updateStatus('正在检查浏览器支持...');

            // 检查浏览器支持
            if (!navigator.mediaDevices) {
                throw new Error('您的浏览器不支持摄像头访问，请使用Chrome、Safari或Firefox最新版本');
            }

            if (!navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia API不可用，请检查浏览器设置');
            }

            this.updateStatus('正在请求摄像头权限...');

            // 尝试不同的摄像头配置
            const constraints = [
                {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                },
                {
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                },
                {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                },
                {
                    video: true
                }
            ];

            let stream = null;
            let lastError = null;

            for (let i = 0; i < constraints.length; i++) {
                try {
                    console.log(`尝试摄像头配置 ${i + 1}:`, constraints[i]);
                    stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
                    console.log(`摄像头配置 ${i + 1} 成功`);
                    break;
                } catch (error) {
                    console.log(`摄像头配置 ${i + 1} 失败:`, error.name, error.message);
                    lastError = error;
                }
            }

            if (!stream) {
                throw lastError || new Error('无法启动摄像头');
            }

            this.stream = stream;
            console.log('摄像头权限获取成功');
            console.log('视频轨道信息:', stream.getVideoTracks()[0]?.getSettings());

            this.video = document.getElementById('video');
            this.canvas = document.getElementById('canvas');
            
            if (!this.video) {
                throw new Error('找不到video元素');
            }
            
            if (!this.canvas) {
                throw new Error('找不到canvas元素');
            }
            
            console.log('视频和画布元素找到');
            
            // 设置视频属性
            this.video.autoplay = true;
            this.video.playsInline = true;
            this.video.muted = true;
            this.video.srcObject = this.stream;

            // 等待视频加载
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('视频加载超时，请刷新页面重试'));
                }, 15000);

                this.video.onloadedmetadata = () => {
                    clearTimeout(timeout);
                    console.log('视频元数据加载完成');
                    console.log('视频尺寸:', this.video.videoWidth, 'x', this.video.videoHeight);
                    resolve();
                };

                this.video.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('视频加载错误:', error);
                    reject(new Error('视频加载失败'));
                };

                this.video.oncanplay = () => {
                    console.log('视频可以播放');
                };
            });

            this.updateStatus('正在初始化AR组件...');

            // 初始化AR组件
            this.arAnimation = new ARAnimation(this.canvas);
            this.imageTracker = new ImageTracker();
            this.qrTracker = new QRCodeTracker();

            // 开始AR体验
            this.showScreen('ar');
            this.isARActive = true;
            this.updateStatus('摄像头已启动，请将摄像头对准图片或二维码');
            
            console.log('AR启动成功');
            this.startARLoop();

        } catch (error) {
            console.error('启动AR失败:', error);
            console.error('错误堆栈:', error.stack);
            let errorMessage = '启动失败';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = '摄像头权限被拒绝，请点击地址栏的摄像头图标并允许访问';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '未找到摄像头设备，请检查设备是否有摄像头';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = '浏览器不支持摄像头功能，请使用Chrome、Safari或Firefox';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '摄像头被其他应用占用，请关闭其他使用摄像头的应用';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = '摄像头配置不匹配，请刷新页面重试';
            } else if (error.message.includes('超时')) {
                errorMessage = '摄像头启动超时，请刷新页面重试';
            } else if (error.message.includes('HTTPS')) {
                errorMessage = '摄像头需要HTTPS环境，请使用HTTPS访问';
            } else {
                errorMessage = `启动失败: ${error.message}`;
            }
            
            this.updateStatus(errorMessage);
            console.log('详细错误信息:', error);
            
            setTimeout(() => {
                this.showScreen('start');
            }, 5000);
        }
    }

    stopAR() {
        console.log('停止AR');
        this.isARActive = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                console.log('停止摄像头轨道:', track.kind);
            });
            this.stream = null;
        }

        if (this.arAnimation) {
            this.arAnimation.dispose();
            this.arAnimation = null;
        }

        this.showScreen('start');
    }

    startARLoop() {
        const loop = () => {
            if (!this.isARActive) return;

            this.updateAR();
            requestAnimationFrame(loop);
        };
        loop();
    }

    updateAR() {
        if (!this.video || !this.canvas || !this.arAnimation) return;

        const ctx = this.canvas.getContext('2d');
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;

        if (videoWidth === 0 || videoHeight === 0) return;

        // 设置canvas尺寸
        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;

        // 绘制视频帧
        ctx.drawImage(this.video, 0, 0, videoWidth, videoHeight);

        // 检测图片标记
        this.detectMarkers(ctx, videoWidth, videoHeight);

        // 更新AR动画
        this.arAnimation.update();
    }

    async detectMarkers(ctx, width, height) {
        try {
            // 检测图片标记
            const imageResult = await this.imageTracker.detect(ctx, width, height);
            if (imageResult.detected) {
                this.onMarkerDetected(imageResult);
                return;
            }

            // 检测二维码
            const qrResult = await this.qrTracker.detect(ctx, width, height);
            if (qrResult.detected) {
                this.onMarkerDetected(qrResult);
                return;
            }

            // 没有检测到标记
            this.arAnimation.hideAnimation();

        } catch (error) {
            console.error('标记检测错误:', error);
        }
    }

    onMarkerDetected(result) {
        this.updateStatus('检测到标记，显示动画中...');
        this.arAnimation.showAnimation(result.position, result.size);
    }

    capturePhoto() {
        if (!this.canvas) return;

        const capturedImage = document.getElementById('capturedImage');
        capturedImage.src = this.canvas.toDataURL('image/png');
        
        document.getElementById('capturePreview').classList.remove('hidden');
        this.updateStatus('照片已拍摄');
    }

    savePhoto() {
        const link = document.createElement('a');
        link.download = `ar-photo-${Date.now()}.png`;
        link.href = document.getElementById('capturedImage').src;
        link.click();
        
        this.hideCapturePreview();
        this.updateStatus('照片已保存');
    }

    hideCapturePreview() {
        document.getElementById('capturePreview').classList.add('hidden');
    }

    showScreen(screenName) {
        // 隐藏所有屏幕
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // 显示指定屏幕
        document.getElementById(`${screenName}Screen`).classList.remove('hidden');
        this.currentScreen = screenName;
    }

    updateStatus(message) {
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = message;
        }
        console.log('状态更新:', message);
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('AR应用初始化开始');
    console.log('浏览器信息:', navigator.userAgent);
    console.log('HTTPS状态:', window.location.protocol === 'https:');
    new ARApp();
}); 