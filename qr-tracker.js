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
                
                if (contrast > 50) { // 高对比度阈值
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
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < imageData.height) {
                    const index = (ny * width + nx) * 4;
                    const brightness = (imageData.data[index] + 
                                      imageData.data[index + 1] + 
                                      imageData.data[index + 2]) / 3;
                    
                    // 计算与周围像素的对比度
                    let localContrast = 0;
                    for (let sy = -1; sy <= 1; sy++) {
                        for (let sx = -1; sx <= 1; sx++) {
                            if (sx === 0 && sy === 0) continue;
                            
                            const sx2 = nx + sx;
                            const sy2 = ny + sy;
                            if (sx2 >= 0 && sx2 < width && sy2 >= 0 && sy2 < imageData.height) {
                                const sIndex = (sy2 * width + sx2) * 4;
                                const sBrightness = (imageData.data[sIndex] + 
                                                   imageData.data[sIndex + 1] + 
                                                   imageData.data[sIndex + 2]) / 3;
                                localContrast += Math.abs(brightness - sBrightness);
                            }
                        }
                    }
                    
                    totalContrast += localContrast;
                    pixelCount++;
                }
            }
        }
        
        return pixelCount > 0 ? totalContrast / pixelCount : 0;
    }

    isQRCodeLike(region, imageData, width, height) {
        // 简化的二维码特征检测
        // 检查是否有足够的角点
        const corners = this.findCornersInRegion(imageData, region, width);
        
        // 检查是否有黑白交替的模式
        const hasAlternatingPattern = this.checkAlternatingPattern(imageData, region, width);
        
        return corners.length >= 3 && hasAlternatingPattern;
    }

    findCornersInRegion(imageData, region, width) {
        const corners = [];
        const step = 2;
        
        for (let y = region.center.y - region.size.height/2; 
             y < region.center.y + region.size.height/2; y += step) {
            for (let x = region.center.x - region.size.width/2; 
                 x < region.center.x + region.size.width/2; x += step) {
                if (this.isCorner(imageData, x, y, width)) {
                    corners.push({ x, y });
                }
            }
        }
        
        return corners;
    }

    isCorner(imageData, x, y, width) {
        const index = (y * width + x) * 4;
        const brightness = (imageData.data[index] + 
                          imageData.data[index + 1] + 
                          imageData.data[index + 2]) / 3;
        
        let contrast = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < imageData.width && ny >= 0 && ny < imageData.height) {
                    const nIndex = (ny * width + nx) * 4;
                    const nBrightness = (imageData.data[nIndex] + 
                                       imageData.data[nIndex + 1] + 
                                       imageData.data[nIndex + 2]) / 3;
                    contrast += Math.abs(brightness - nBrightness);
                }
            }
        }
        
        return contrast > 50;
    }

    checkAlternatingPattern(imageData, region, width) {
        // 检查黑白交替模式
        let transitions = 0;
        const step = 5;
        
        for (let y = region.center.y - region.size.height/2; 
             y < region.center.y + region.size.height/2; y += step) {
            let lastBrightness = null;
            
            for (let x = region.center.x - region.size.width/2; 
                 x < region.center.x + region.size.width/2; x += step) {
                if (x >= 0 && x < imageData.width && y >= 0 && y < imageData.height) {
                    const index = (y * width + x) * 4;
                    const brightness = (imageData.data[index] + 
                                      imageData.data[index + 1] + 
                                      imageData.data[index + 2]) / 3;
                    
                    if (lastBrightness !== null) {
                        const diff = Math.abs(brightness - lastBrightness);
                        if (diff > 100) { // 高对比度阈值
                            transitions++;
                        }
                    }
                    
                    lastBrightness = brightness;
                }
            }
        }
        
        return transitions > 10; // 需要足够多的过渡
    }

    dispose() {
        if (this.qrWorker) {
            this.qrWorker.terminate();
            this.qrWorker = null;
        }
    }
} 