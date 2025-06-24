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
            this.showScreen('loading');
            this.updateStatus('正在初始化摄像头...');

            // 获取摄像头权限
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            this.video = document.getElementById('video');
            this.canvas = document.getElementById('canvas');
            this.video.srcObject = this.stream;

            // 等待视频加载
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });

            this.updateStatus('正在初始化AR组件...');

            // 初始化AR组件
            this.arAnimation = new ARAnimation(this.canvas);
            this.imageTracker = new ImageTracker();
            this.qrTracker = new QRCodeTracker();

            // 开始AR体验
            this.showScreen('ar');
            this.isARActive = true;
            this.updateStatus('请将摄像头对准图片或二维码');
            
            this.startARLoop();

        } catch (error) {
            console.error('启动AR失败:', error);
            this.updateStatus('启动失败，请检查摄像头权限');
            setTimeout(() => {
                this.showScreen('start');
            }, 2000);
        }
    }

    stopAR() {
        this.isARActive = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
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
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new ARApp();
}); 