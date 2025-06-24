export class ImageTracker {
    constructor() {
        this.markers = new Map();
        this.detectionThreshold = 0.7;
        this.lastDetection = null;
        this.detectionTimeout = 1000; // 1秒超时
        
        this.initMarkers();
        this.loadCustomMarkers();
    }

    initMarkers() {
        // 预定义的图片标记
        this.addMarker('pattern1', this.createPattern1());
        this.addMarker('pattern2', this.createPattern2());
        this.addMarker('pattern3', this.createPattern3());
    }

    // 加载自定义PNG标记
    async loadCustomMarkers() {
        try {
            // 这里可以加载您的自定义PNG标记
            const customMarkers = [
                { id: 'custom1', url: 'assets/marker1.png' },
                { id: 'custom2', url: 'assets/marker2.png' },
                { id: 'custom3', url: 'assets/marker3.png' },
                { id: 'logo', url: 'assets/logo.png' },
                { id: 'icon', url: 'assets/icon.png' }
            ];

            for (const marker of customMarkers) {
                try {
                    await this.addCustomMarker(marker.id, marker.url);
                    console.log(`成功加载自定义标记: ${marker.id}`);
                } catch (error) {
                    console.log(`无法加载标记 ${marker.id}:`, error);
                }
            }
        } catch (error) {
            console.log('加载自定义标记失败:', error);
        }
    }

    addMarker(id, pattern) {
        this.markers.set(id, pattern);
    }

    createPattern1() {
        // 创建简单的黑白图案
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 绘制棋盘格图案
        const size = 8;
        for (let x = 0; x < canvas.width; x += size) {
            for (let y = 0; y < canvas.height; y += size) {
                const isBlack = ((x / size) + (y / size)) % 2 === 0;
                ctx.fillStyle = isBlack ? '#000' : '#fff';
                ctx.fillRect(x, y, size, size);
            }
        }
        
        return canvas;
    }

    createPattern2() {
        // 创建圆形图案
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(32, 32, 10, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    createPattern3() {
        // 创建十字图案
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(24, 8, 16, 48);
        ctx.fillRect(8, 24, 48, 16);
        
        return canvas;
    }

    async detect(ctx, width, height) {
        try {
            // 获取当前帧的图像数据
            const imageData = ctx.getImageData(0, 0, width, height);
            
            // 检查是否有有效的检测结果
            if (this.lastDetection && 
                Date.now() - this.lastDetection.timestamp < this.detectionTimeout) {
                return this.lastDetection.result;
            }

            // 检测所有标记
            for (const [id, pattern] of this.markers) {
                const result = this.detectPattern(imageData, pattern, width, height);
                if (result.detected) {
                    this.lastDetection = {
                        timestamp: Date.now(),
                        result: { ...result, markerId: id }
                    };
                    return this.lastDetection.result;
                }
            }

            // 如果没有检测到标记，清除上次检测结果
            if (this.lastDetection && 
                Date.now() - this.lastDetection.timestamp > this.detectionTimeout) {
                this.lastDetection = null;
            }

            return { detected: false };

        } catch (error) {
            console.error('图片检测错误:', error);
            return { detected: false };
        }
    }

    detectPattern(imageData, pattern, width, height) {
        // 简化的模式匹配算法
        // 在实际应用中，这里应该使用更复杂的计算机视觉算法
        
        const patternData = this.getPatternData(pattern);
        const matches = this.findMatches(imageData, patternData, width, height);
        
        if (matches.length > 0) {
            // 选择最佳匹配
            const bestMatch = matches.reduce((best, current) => 
                current.confidence > best.confidence ? current : best
            );
            
            if (bestMatch.confidence > this.detectionThreshold) {
                return {
                    detected: true,
                    position: bestMatch.position,
                    size: bestMatch.size,
                    confidence: bestMatch.confidence,
                    type: 'image'
                };
            }
        }
        
        return { detected: false };
    }

    getPatternData(pattern) {
        const canvas = pattern;
        const ctx = canvas.getContext('2d');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    findMatches(imageData, patternData, width, height) {
        const matches = [];
        const step = 10; // 搜索步长，提高性能
        
        // 简化的模板匹配
        for (let y = 0; y < height - patternData.height; y += step) {
            for (let x = 0; x < width - patternData.width; x += step) {
                const confidence = this.calculateSimilarity(
                    imageData, patternData, x, y, width
                );
                
                if (confidence > this.detectionThreshold * 0.8) {
                    matches.push({
                        position: { x, y },
                        size: { 
                            width: patternData.width, 
                            height: patternData.height 
                        },
                        confidence: confidence
                    });
                }
            }
        }
        
        return matches;
    }

    calculateSimilarity(imageData, patternData, x, y, imageWidth) {
        let matchCount = 0;
        let totalPixels = 0;
        
        // 简化的相似度计算
        for (let py = 0; py < patternData.height; py++) {
            for (let px = 0; px < patternData.width; px++) {
                const imageIndex = ((y + py) * imageWidth + (x + px)) * 4;
                const patternIndex = (py * patternData.width + px) * 4;
                
                // 比较RGB值
                const imageR = imageData.data[imageIndex];
                const imageG = imageData.data[imageIndex + 1];
                const imageB = imageData.data[imageIndex + 2];
                
                const patternR = patternData.data[patternIndex];
                const patternG = patternData.data[patternIndex + 1];
                const patternB = patternData.data[patternIndex + 2];
                
                // 计算颜色差异
                const diff = Math.abs(imageR - patternR) + 
                           Math.abs(imageG - patternG) + 
                           Math.abs(imageB - patternB);
                
                if (diff < 50) { // 阈值
                    matchCount++;
                }
                
                totalPixels++;
            }
        }
        
        return matchCount / totalPixels;
    }

    // 添加自定义标记的方法
    addCustomMarker(id, imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 64, 64);
                this.addMarker(id, canvas);
                resolve();
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    // 批量添加自定义标记
    addCustomMarkers(markerList) {
        const promises = markerList.map(marker => 
            this.addCustomMarker(marker.id, marker.url)
        );
        return Promise.all(promises);
    }

    // 获取所有已加载的标记ID
    getLoadedMarkerIds() {
        return Array.from(this.markers.keys());
    }

    // 移除标记
    removeMarker(id) {
        return this.markers.delete(id);
    }

    // 清空所有标记
    clearMarkers() {
        this.markers.clear();
    }
} 