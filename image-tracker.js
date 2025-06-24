export class ImageTracker {
    constructor() {
        this.lastDetection = null;
        this.detectionTimeout = 500; // 增加到500ms，减少重复检测
        this.templates = [];
        this.threshold = 0.15; // 降低匹配阈值，提高检测灵敏度
        this.debugMode = false;
        this.lastDetectionTime = 0;
        this.detectionInterval = 250; // 增加到250ms，大幅减少CPU使用
        this.isInitialized = false;
        
        // 性能优化：缓存检测结果
        this.detectionCache = new Map();
        this.cacheTimeout = 1000; // 缓存1秒
        
        // 延迟初始化，减少启动时间
        setTimeout(() => {
            this.isInitialized = true;
            console.log('图片追踪器延迟初始化完成');
        }, 200); // 减少延迟时间
    }

    // 添加模板图片 - 进一步优化版本
    addTemplate(imageUrl, name = 'template') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // 设置加载超时
            const timeout = setTimeout(() => {
                reject(new Error('图片加载超时'));
            }, 2000); // 减少超时时间
            
            img.onload = () => {
                clearTimeout(timeout);
                
                // 优化canvas创建
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 进一步限制图片尺寸以提高性能
                const maxSize = 150; // 减少最大尺寸
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                this.templates.push({
                    name,
                    imageData,
                    width: canvas.width,
                    height: canvas.height
                });
                
                console.log(`模板图片 "${name}" 添加成功，尺寸: ${canvas.width}x${canvas.height}`);
                resolve();
            };
            
            img.onerror = (error) => {
                clearTimeout(timeout);
                console.error(`模板图片 "${name}" 加载失败:`, error);
                reject(error);
            };
            
            img.src = imageUrl;
        });
    }

    // 优化的图片检测
    async detect(ctx, width, height) {
        try {
            // 限制检测频率
            const now = Date.now();
            if (now - this.lastDetectionTime < this.detectionInterval) {
                return this.lastDetection ? this.lastDetection.result : { detected: false };
            }
            this.lastDetectionTime = now;

            // 检查缓存
            const cacheKey = `${width}x${height}`;
            const cachedResult = this.detectionCache.get(cacheKey);
            if (cachedResult && now - cachedResult.timestamp < this.cacheTimeout) {
                return cachedResult.result;
            }

            // 检查是否有有效的检测结果
            if (this.lastDetection && 
                now - this.lastDetection.timestamp < this.detectionTimeout) {
                return this.lastDetection.result;
            }

            // 获取当前帧的图像数据
            const frameData = ctx.getImageData(0, 0, width, height);
            
            // 对每个模板进行匹配
            for (const template of this.templates) {
                const match = this.matchTemplateOptimized(frameData, template, width, height);
                
                if (match && match.confidence > this.threshold) {
                    const result = {
                        detected: true,
                        type: 'image',
                        name: template.name,
                        position: match.position,
                        size: match.size,
                        confidence: match.confidence
                    };
                    
                    // 缓存结果
                    this.detectionCache.set(cacheKey, {
                        timestamp: now,
                        result: result
                    });
                    
                    this.lastDetection = {
                        timestamp: now,
                        result: result
                    };
                    
                    console.log(`✅ 检测到图片 "${template.name}"，匹配度: ${match.confidence.toFixed(3)}`);
                    return result;
                }
            }

            // 如果没有检测到图片，清除上次检测结果
            if (this.lastDetection && 
                now - this.lastDetection.timestamp > this.detectionTimeout) {
                this.lastDetection = null;
            }

            // 缓存未检测到结果
            const noDetectionResult = { detected: false };
            this.detectionCache.set(cacheKey, {
                timestamp: now,
                result: noDetectionResult
            });

            return noDetectionResult;

        } catch (error) {
            console.error('图片检测错误:', error);
            return { detected: false };
        }
    }

    // 优化的模板匹配算法
    matchTemplateOptimized(frameData, template, frameWidth, frameHeight) {
        const templateWidth = template.width;
        const templateHeight = template.height;
        
        // 如果模板太大，跳过
        if (templateWidth > frameWidth || templateHeight > frameHeight) {
            return null;
        }

        let bestMatch = null;
        let bestConfidence = 0;

        // 增加搜索步长以提高性能
        const step = Math.max(3, Math.floor(Math.min(templateWidth, templateHeight) / 20));
        
        // 限制搜索范围，只搜索中心区域
        const searchMargin = Math.min(80, Math.floor(Math.min(frameWidth, frameHeight) * 0.08));
        const startX = searchMargin;
        const startY = searchMargin;
        const endX = frameWidth - templateWidth - searchMargin;
        const endY = frameHeight - templateHeight - searchMargin;
        
        // 使用更少的采样点
        const maxSamples = 100; // 限制最大采样数
        let sampleCount = 0;
        
        for (let y = startY; y <= endY && sampleCount < maxSamples; y += step) {
            for (let x = startX; x <= endX && sampleCount < maxSamples; x += step) {
                sampleCount++;
                
                const confidence = this.calculateSimilarityFast(
                    frameData, template.imageData,
                    x, y, frameWidth,
                    0, 0, templateWidth,
                    templateWidth, templateHeight
                );

                if (confidence > bestConfidence) {
                    bestConfidence = confidence;
                    bestMatch = {
                        position: { x, y },
                        size: { width: templateWidth, height: templateHeight },
                        confidence
                    };
                    
                    // 如果找到很好的匹配，提前退出
                    if (confidence > 0.8) {
                        return bestMatch;
                    }
                }
            }
        }

        return bestMatch;
    }

    // 快速相似度计算
    calculateSimilarityFast(frameData, templateData, frameX, frameY, frameWidth, 
                           templateX, templateY, templateWidth, width, height) {
        let totalDiff = 0;
        let totalPixels = 0;

        // 使用更少的采样点进行计算
        const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 10));
        
        for (let y = 0; y < height; y += sampleStep) {
            for (let x = 0; x < width; x += sampleStep) {
                const frameIndex = ((frameY + y) * frameWidth + (frameX + x)) * 4;
                const templateIndex = ((templateY + y) * templateWidth + (templateX + x)) * 4;

                // 只计算RGB差异，忽略Alpha通道
                const rDiff = Math.abs(frameData.data[frameIndex] - templateData.data[templateIndex]);
                const gDiff = Math.abs(frameData.data[frameIndex + 1] - templateData.data[templateIndex + 1]);
                const bDiff = Math.abs(frameData.data[frameIndex + 2] - templateData.data[templateIndex + 2]);

                totalDiff += (rDiff + gDiff + bDiff) / 3;
                totalPixels++;
            }
        }

        // 计算相似度（0-1，1表示完全匹配）
        if (totalPixels === 0) return 0;
        const averageDiff = totalDiff / totalPixels;
        return Math.max(0, 1 - averageDiff / 255);
    }

    // 原始模板匹配算法（保留用于兼容性）
    matchTemplate(frameData, template, frameWidth, frameHeight) {
        return this.matchTemplateOptimized(frameData, template, frameWidth, frameHeight);
    }

    // 原始相似度计算（保留用于兼容性）
    calculateSimilarity(frameData, templateData, frameX, frameY, frameWidth, 
                       templateX, templateY, templateWidth, width, height) {
        return this.calculateSimilarityFast(frameData, templateData, frameX, frameY, frameWidth, 
                                          templateX, templateY, templateWidth, width, height);
    }

    // 简化的图片检测（基于颜色和形状特征）
    detectSimple(ctx, width, height) {
        try {
            const imageData = ctx.getImageData(0, 0, width, height);
            
            // 寻找高对比度区域
            const regions = this.findHighContrastRegions(imageData, width, height);
            
            for (const region of regions) {
                if (this.isImageLike(region, imageData, width, height)) {
                    return {
                        detected: true,
                        type: 'simple',
                        position: { x: region.x, y: region.y },
                        size: { width: region.width, height: region.height },
                        confidence: 0.5
                    };
                }
            }
            
            return { detected: false };
            
        } catch (error) {
            console.error('简化检测错误:', error);
            return { detected: false };
        }
    }

    // 寻找高对比度区域
    findHighContrastRegions(imageData, width, height) {
        const regions = [];
        const regionSize = 50;
        const step = 25;
        
        for (let y = 0; y < height - regionSize; y += step) {
            for (let x = 0; x < width - regionSize; x += step) {
                const contrast = this.calculateRegionContrast(imageData, x, y, regionSize, width);
                
                if (contrast > 30) { // 降低对比度阈值
                    regions.push({
                        x, y, width: regionSize, height: regionSize, contrast
                    });
                }
            }
        }
        
        // 按对比度排序，返回前几个
        return regions.sort((a, b) => b.contrast - a.contrast).slice(0, 3);
    }

    // 计算区域对比度
    calculateRegionContrast(imageData, x, y, size, width) {
        let minBrightness = 255;
        let maxBrightness = 0;
        
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const index = ((y + dy) * width + (x + dx)) * 4;
                const brightness = (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
                
                minBrightness = Math.min(minBrightness, brightness);
                maxBrightness = Math.max(maxBrightness, brightness);
            }
        }
        
        return maxBrightness - minBrightness;
    }

    // 检查区域是否像图片
    isImageLike(region, imageData, width, height) {
        // 简单的图片特征检查
        const edgeDensity = this.calculateEdgeDensity(imageData, region.x, region.y, region.width, region.height, width);
        return edgeDensity > 0.1; // 边缘密度阈值
    }

    // 计算边缘密度
    calculateEdgeDensity(imageData, x, y, w, h, width) {
        let edgeCount = 0;
        let totalPixels = 0;
        
        for (let dy = 1; dy < h - 1; dy++) {
            for (let dx = 1; dx < w - 1; dx++) {
                const index = ((y + dy) * width + (x + dx)) * 4;
                const center = (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
                
                // 检查周围像素
                const left = ((y + dy) * width + (x + dx - 1)) * 4;
                const leftBrightness = (imageData.data[left] + imageData.data[left + 1] + imageData.data[left + 2]) / 3;
                
                if (Math.abs(center - leftBrightness) > 20) {
                    edgeCount++;
                }
                
                totalPixels++;
            }
        }
        
        return totalPixels > 0 ? edgeCount / totalPixels : 0;
    }

    // 清理资源
    dispose() {
        this.templates = [];
        this.detectionCache.clear();
        this.lastDetection = null;
        console.log('图片追踪器资源已清理');
    }
} 