export class ImageTracker {
    constructor() {
        this.lastDetection = null;
        this.detectionTimeout = 300; // 进一步减少到300ms
        this.templates = [];
        this.threshold = 0.2; // 进一步降低匹配阈值
        this.debugMode = false;
        this.lastDetectionTime = 0;
        this.detectionInterval = 150; // 增加到150ms，减少CPU使用
        this.isInitialized = false;
        
        // 延迟初始化，减少启动时间
        setTimeout(() => {
            this.isInitialized = true;
            console.log('图片追踪器延迟初始化完成');
        }, 100);
    }

    // 添加模板图片 - 优化版本
    addTemplate(imageUrl, name = 'template') {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // 设置加载超时
            const timeout = setTimeout(() => {
                reject(new Error('图片加载超时'));
            }, 3000);
            
            img.onload = () => {
                clearTimeout(timeout);
                
                // 优化canvas创建
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 限制图片尺寸以提高性能
                const maxSize = 200;
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

    // 检测图片
    async detect(ctx, width, height) {
        try {
            // 限制检测频率
            const now = Date.now();
            if (now - this.lastDetectionTime < this.detectionInterval) {
                return this.lastDetection ? this.lastDetection.result : { detected: false };
            }
            this.lastDetectionTime = now;

            // 检查是否有有效的检测结果
            if (this.lastDetection && 
                now - this.lastDetection.timestamp < this.detectionTimeout) {
                return this.lastDetection.result;
            }

            // 获取当前帧的图像数据
            const frameData = ctx.getImageData(0, 0, width, height);
            
            // 对每个模板进行匹配
            for (const template of this.templates) {
                const match = this.matchTemplate(frameData, template, width, height);
                
                if (match && match.confidence > this.threshold) {
                    console.log(`✅ 检测到图片 "${template.name}"，匹配度: ${match.confidence.toFixed(3)}`);
                    this.lastDetection = {
                        timestamp: now,
                        result: {
                            detected: true,
                            type: 'image',
                            name: template.name,
                            position: match.position,
                            size: match.size,
                            confidence: match.confidence
                        }
                    };
                    return this.lastDetection.result;
                }
            }

            // 如果没有检测到图片，清除上次检测结果
            if (this.lastDetection && 
                now - this.lastDetection.timestamp > this.detectionTimeout) {
                this.lastDetection = null;
            }

            return { detected: false };

        } catch (error) {
            console.error('图片检测错误:', error);
            return { detected: false };
        }
    }

    // 模板匹配算法 - 优化版本
    matchTemplate(frameData, template, frameWidth, frameHeight) {
        const templateWidth = template.width;
        const templateHeight = template.height;
        
        // 如果模板太大，跳过
        if (templateWidth > frameWidth || templateHeight > frameHeight) {
            return null;
        }

        let bestMatch = null;
        let bestConfidence = 0;

        // 增加搜索步长以提高性能
        const step = Math.max(2, Math.floor(Math.min(templateWidth, templateHeight) / 15));
        
        // 限制搜索范围，只搜索中心区域
        const searchMargin = Math.min(100, Math.floor(Math.min(frameWidth, frameHeight) * 0.1));
        const startX = searchMargin;
        const startY = searchMargin;
        const endX = frameWidth - templateWidth - searchMargin;
        const endY = frameHeight - templateHeight - searchMargin;
        
        for (let y = startY; y <= endY; y += step) {
            for (let x = startX; x <= endX; x += step) {
                const confidence = this.calculateSimilarity(
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
                }
            }
        }

        return bestMatch;
    }

    // 计算相似度
    calculateSimilarity(frameData, templateData, frameX, frameY, frameWidth, 
                       templateX, templateY, templateWidth, width, height) {
        let totalDiff = 0;
        let totalPixels = width * height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const frameIndex = ((frameY + y) * frameWidth + (frameX + x)) * 4;
                const templateIndex = ((templateY + y) * templateWidth + (templateX + x)) * 4;

                // 计算RGB差异
                const rDiff = Math.abs(frameData.data[frameIndex] - templateData.data[frameIndex]);
                const gDiff = Math.abs(frameData.data[frameIndex + 1] - templateData.data[frameIndex + 1]);
                const bDiff = Math.abs(frameData.data[frameIndex + 2] - templateData.data[frameIndex + 2]);

                totalDiff += (rDiff + gDiff + bDiff) / 3;
            }
        }

        // 计算相似度（0-1，1表示完全匹配）
        const averageDiff = totalDiff / totalPixels;
        return Math.max(0, 1 - averageDiff / 255);
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
                        position: region.center,
                        size: region.size,
                        type: 'image',
                        confidence: region.confidence
                    };
                }
            }
            
            return { detected: false };
            
        } catch (error) {
            console.error('简单图片检测错误:', error);
            return { detected: false };
        }
    }

    findHighContrastRegions(imageData, width, height) {
        const regions = [];
        const step = 20;
        const minRegionSize = 50;
        
        for (let y = step; y < height - step; y += step) {
            for (let x = step; x < width - step; x += step) {
                const contrast = this.calculateRegionContrast(imageData, x, y, step, width);
                
                if (contrast > 50) { // 高对比度阈值
                    const region = this.expandRegion(imageData, x, y, width, height);
                    if (region.size.width > minRegionSize && region.size.height > minRegionSize) {
                        regions.push(region);
                    }
                }
            }
        }
        
        return regions;
    }

    calculateRegionContrast(imageData, x, y, size, width) {
        let totalContrast = 0;
        let count = 0;
        
        for (let dy = -size/2; dy < size/2; dy++) {
            for (let dx = -size/2; dx < size/2; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < imageData.height) {
                    const index = (ny * width + nx) * 4;
                    const brightness = (imageData.data[index] + 
                                      imageData.data[index + 1] + 
                                      imageData.data[index + 2]) / 3;
                    
                    // 计算与周围像素的对比度
                    let localContrast = 0;
                    for (let sy = -2; sy <= 2; sy++) {
                        for (let sx = -2; sx <= 2; sx++) {
                            if (sx === 0 && sy === 0) continue;
                            
                            const sx2 = nx + sx;
                            const sy2 = ny + sy;
                            if (sx2 >= 0 && sx2 < width && sy2 >= 0 && sy2 < imageData.height) {
                                const index2 = (sy2 * width + sx2) * 4;
                                const brightness2 = (imageData.data[index2] + 
                                                   imageData.data[index2 + 1] + 
                                                   imageData.data[index2 + 2]) / 3;
                                localContrast += Math.abs(brightness - brightness2);
                            }
                        }
                    }
                    
                    totalContrast += localContrast;
                    count++;
                }
            }
        }
        
        return count > 0 ? totalContrast / count : 0;
    }

    expandRegion(imageData, startX, startY, width, height) {
        // 简单的区域扩展算法
        let minX = startX, maxX = startX;
        let minY = startY, maxY = startY;
        
        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const index = (y * width + x) * 4;
            const brightness = (imageData.data[index] + 
                              imageData.data[index + 1] + 
                              imageData.data[index + 2]) / 3;
            
            // 如果像素足够亮，扩展区域
            if (brightness > 100) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                
                // 添加相邻像素
                const neighbors = [
                    {x: x+1, y}, {x: x-1, y},
                    {x, y: y+1}, {x, y: y-1}
                ];
                
                for (const neighbor of neighbors) {
                    if (neighbor.x >= 0 && neighbor.x < width && 
                        neighbor.y >= 0 && neighbor.y < height) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        
        return {
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2
            },
            size: {
                width: maxX - minX,
                height: maxY - minY
            },
            confidence: visited.size / ((maxX - minX) * (maxY - minY))
        };
    }

    isImageLike(region, imageData, width, height) {
        // 检查区域是否具有图片特征
        const { center, size } = region;
        
        // 检查大小是否合理
        if (size.width < 30 || size.height < 30) return false;
        if (size.width > width * 0.8 || size.height > height * 0.8) return false;
        
        // 检查宽高比是否合理
        const aspectRatio = size.width / size.height;
        if (aspectRatio < 0.2 || aspectRatio > 5) return false;
        
        return true;
    }

    // 清理资源
    dispose() {
        this.templates = [];
        this.lastDetection = null;
    }
} 