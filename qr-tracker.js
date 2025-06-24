export class QRCodeTracker {
    constructor() {
        this.lastDetection = null;
        this.detectionTimeout = 1000; // 1秒超时
        this.qrWorker = null;
        this.initWorker();
    }

    initWorker() {
        // 创建Web Worker用于二维码检测
        const workerCode = `
            self.onmessage = function(e) {
                const { imageData, width, height } = e.data;
                
                // 简化的二维码检测算法
                // 在实际应用中，这里应该使用专业的二维码检测库
                const result = detectQRCode(imageData, width, height);
                self.postMessage(result);
            };

            function detectQRCode(imageData, width, height) {
                // 简化的二维码检测
                // 这里应该使用专业的二维码检测算法
                
                // 寻找二维码的特征点
                const corners = findQRCodeCorners(imageData, width, height);
                
                if (corners.length >= 3) {
                    // 计算二维码的位置和大小
                    const position = calculatePosition(corners);
                    const size = calculateSize(corners);
                    
                    return {
                        detected: true,
                        position: position,
                        size: size,
                        corners: corners,
                        data: "Sample QR Code Data" // 实际应该解析二维码内容
                    };
                }
                
                return { detected: false };
            }

            function findQRCodeCorners(imageData, width, height) {
                const corners = [];
                const step = 5;
                
                // 简化的角点检测
                for (let y = step; y < height - step; y += step) {
                    for (let x = step; x < width - step; x += step) {
                        if (isCorner(imageData, x, y, width)) {
                            corners.push({ x, y });
                        }
                    }
                }
                
                return corners;
            }

            function isCorner(imageData, x, y, width) {
                // 简化的角点检测算法
                const index = (y * width + x) * 4;
                const brightness = (imageData.data[index] + 
                                  imageData.data[index + 1] + 
                                  imageData.data[index + 2]) / 3;
                
                // 检查周围像素的对比度
                let contrast = 0;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIndex = (ny * width + nx) * 4;
                            const nBrightness = (imageData.data[nIndex] + 
                                               imageData.data[nIndex + 1] + 
                                               imageData[nIndex + 2]) / 3;
                            contrast += Math.abs(brightness - nBrightness);
                        }
                    }
                }
                
                return contrast > 100; // 阈值
            }

            function calculatePosition(corners) {
                // 计算二维码中心位置
                const centerX = corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length;
                const centerY = corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length;
                
                return { x: centerX, y: centerY };
            }

            function calculateSize(corners) {
                // 计算二维码大小
                const xs = corners.map(c => c.x);
                const ys = corners.map(c => c.y);
                
                const width = Math.max(...xs) - Math.min(...xs);
                const height = Math.max(...ys) - Math.min(...ys);
                
                return { width, height };
            }
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.qrWorker = new Worker(URL.createObjectURL(blob));
    }

    async detect(ctx, width, height) {
        try {
            // 检查是否有有效的检测结果
            if (this.lastDetection && 
                Date.now() - this.lastDetection.timestamp < this.detectionTimeout) {
                return this.lastDetection.result;
            }

            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, width, height);
            
            // 使用Worker进行二维码检测
            const result = await this.detectWithWorker(imageData, width, height);
            
            if (result.detected) {
                this.lastDetection = {
                    timestamp: Date.now(),
                    result: {
                        ...result,
                        type: 'qrcode'
                    }
                };
                return this.lastDetection.result;
            }

            // 如果没有检测到二维码，清除上次检测结果
            if (this.lastDetection && 
                Date.now() - this.lastDetection.timestamp > this.detectionTimeout) {
                this.lastDetection = null;
            }

            return { detected: false };

        } catch (error) {
            console.error('二维码检测错误:', error);
            return { detected: false };
        }
    }

    detectWithWorker(imageData, width, height) {
        return new Promise((resolve) => {
            if (!this.qrWorker) {
                resolve({ detected: false });
                return;
            }

            const timeout = setTimeout(() => {
                resolve({ detected: false });
            }, 1000);

            this.qrWorker.onmessage = (e) => {
                clearTimeout(timeout);
                resolve(e.data);
            };

            this.qrWorker.postMessage({ imageData, width, height });
        });
    }

    // 简化的二维码检测（不使用Worker）
    detectSimple(ctx, width, height) {
        try {
            const imageData = ctx.getImageData(0, 0, width, height);
            
            // 寻找高对比度区域
            const regions = this.findHighContrastRegions(imageData, width, height);
            
            for (const region of regions) {
                if (this.isQRCodeLike(region, imageData, width, height)) {
                    return {
                        detected: true,
                        position: region.center,
                        size: region.size,
                        type: 'qrcode'
                    };
                }
            }
            
            return { detected: false };
            
        } catch (error) {
            console.error('简单二维码检测错误:', error);
            return { detected: false };
        }
    }

    findHighContrastRegions(imageData, width, height) {
        const regions = [];
        const step = 20;
        
        for (let y = 0; y < height - step; y += step) {
            for (let x = 0; x < width - step; x += step) {
                const contrast = this.calculateRegionContrast(imageData, x, y, step, width);
                
                if (contrast > 50) {
                    regions.push({
                        center: { x: x + step/2, y: y + step/2 },
                        size: { width: step, height: step },
                        contrast: contrast
                    });
                }
            }
        }
        
        return regions;
    }

    calculateRegionContrast(imageData, x, y, size, width) {
        let totalContrast = 0;
        let pixelCount = 0;
        
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const index = ((y + dy) * width + (x + dx)) * 4;
                const brightness = (imageData.data[index] + 
                                  imageData.data[index + 1] + 
                                  imageData.data[index + 2]) / 3;
                
                // 计算与周围像素的对比度
                for (let ny = Math.max(0, y + dy - 1); 
                     ny <= Math.min(height - 1, y + dy + 1); ny++) {
                    for (let nx = Math.max(0, x + dx - 1); 
                         nx <= Math.min(width - 1, x + dx + 1); nx++) {
                        if (nx === x + dx && ny === y + dy) continue;
                        
                        const nIndex = (ny * width + nx) * 4;
                        const nBrightness = (imageData.data[nIndex] + 
                                           imageData.data[nIndex + 1] + 
                                           imageData.data[nIndex + 2]) / 3;
                        
                        totalContrast += Math.abs(brightness - nBrightness);
                        pixelCount++;
                    }
                }
            }
        }
        
        return pixelCount > 0 ? totalContrast / pixelCount : 0;
    }

    isQRCodeLike(region, imageData, width, height) {
        // 简化的二维码特征检测
        // 检查是否有黑白相间的模式
        
        const centerX = Math.floor(region.center.x);
        const centerY = Math.floor(region.center.y);
        const size = Math.min(region.size.width, region.size.height);
        
        let blackPixels = 0;
        let whitePixels = 0;
        
        for (let y = centerY - size/2; y < centerY + size/2; y++) {
            for (let x = centerX - size/2; x < centerX + size/2; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const index = (y * width + x) * 4;
                    const brightness = (imageData.data[index] + 
                                      imageData.data[index + 1] + 
                                      imageData.data[index + 2]) / 3;
                    
                    if (brightness < 128) {
                        blackPixels++;
                    } else {
                        whitePixels++;
                    }
                }
            }
        }
        
        const totalPixels = blackPixels + whitePixels;
        if (totalPixels === 0) return false;
        
        const blackRatio = blackPixels / totalPixels;
        
        // 二维码通常有大约50%的黑白像素
        return blackRatio > 0.3 && blackRatio < 0.7;
    }

    dispose() {
        if (this.qrWorker) {
            this.qrWorker.terminate();
            this.qrWorker = null;
        }
    }
} 