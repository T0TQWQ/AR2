import * as THREE from 'three';

export class ARAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationGroup = null;
        this.isVisible = false;
        this.targetPosition = { x: 0, y: 0 };
        this.targetSize = { width: 100, height: 100 };
        
        // PNG动画相关
        this.pngSprites = [];
        this.currentFrame = 0;
        this.frameCount = 0;
        this.animationSpeed = 0.1; // 动画速度
        this.isPngAnimation = false;
        
        this.init();
    }

    init() {
        // 创建Three.js场景
        this.scene = new THREE.Scene();
        
        // 创建正交相机（适合2D渲染）
        const aspect = this.canvas.width / this.canvas.height;
        this.camera = new THREE.OrthographicCamera(
            -aspect, aspect, 1, -1, 0.1, 1000
        );
        this.camera.position.z = 1;

        // 创建WebGL渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.setClearColor(0x000000, 0); // 透明背景

        // 创建动画组
        this.createAnimationGroup();
        
        // 加载PNG动画（如果有的话）
        this.loadPngAnimation();
    }

    // 加载PNG动画序列
    async loadPngAnimation() {
        try {
            // 这里可以加载您的PNG动画序列
            // 示例：假设您有anim1.png, anim2.png, anim3.png等
            const pngFiles = [
                'assets/anim1.png',
                'assets/anim2.png', 
                'assets/anim3.png',
                'assets/anim4.png',
                'assets/anim5.png'
            ];
            
            this.pngSprites = [];
            this.frameCount = pngFiles.length;
            
            const loader = new THREE.TextureLoader();
            
            for (let i = 0; i < pngFiles.length; i++) {
                try {
                    const texture = await this.loadTexture(loader, pngFiles[i]);
                    if (texture) {
                        this.pngSprites.push(texture);
                    }
                } catch (error) {
                    console.log(`无法加载PNG文件: ${pngFiles[i]}`, error);
                }
            }
            
            if (this.pngSprites.length > 0) {
                this.isPngAnimation = true;
                console.log(`成功加载 ${this.pngSprites.length} 帧PNG动画`);
            }
            
        } catch (error) {
            console.log('PNG动画加载失败，将使用默认动画:', error);
        }
    }

    // 加载纹理的Promise包装
    loadTexture(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (texture) => resolve(texture),
                undefined,
                (error) => reject(error)
            );
        });
    }

    createAnimationGroup() {
        this.animationGroup = new THREE.Group();

        if (this.isPngAnimation) {
            this.createPngSpriteAnimation();
        } else {
            // 创建默认的Three.js动画元素
            this.createFloatingElements();
            this.createParticleSystem();
            this.createGlowingCircle();
        }

        this.scene.add(this.animationGroup);
    }

    // 创建PNG精灵动画
    createPngSpriteAnimation() {
        if (this.pngSprites.length === 0) return;
        
        // 创建精灵材质
        const material = new THREE.SpriteMaterial({
            map: this.pngSprites[0],
            transparent: true,
            alphaTest: 0.1
        });
        
        // 创建精灵
        this.pngSprite = new THREE.Sprite(material);
        this.pngSprite.scale.set(0.5, 0.5, 1); // 调整大小
        
        this.animationGroup.add(this.pngSprite);
    }

    createFloatingElements() {
        // 创建浮动的几何体
        const geometries = [
            new THREE.CircleGeometry(0.1, 32),
            new THREE.BoxGeometry(0.15, 0.15, 0.01),
            new THREE.RingGeometry(0.08, 0.12, 32)
        ];

        const materials = [
            new THREE.MeshBasicMaterial({ 
                color: 0xff6b6b, 
                transparent: true, 
                opacity: 0.8 
            }),
            new THREE.MeshBasicMaterial({ 
                color: 0x4ecdc4, 
                transparent: true, 
                opacity: 0.7 
            }),
            new THREE.MeshBasicMaterial({ 
                color: 0x45b7d1, 
                transparent: true, 
                opacity: 0.6 
            })
        ];

        for (let i = 0; i < 5; i++) {
            const geometry = geometries[i % geometries.length];
            const material = materials[i % materials.length];
            const mesh = new THREE.Mesh(geometry, material);

            // 随机位置
            mesh.position.set(
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.8,
                0
            );

            // 添加动画属性
            mesh.userData = {
                originalY: mesh.position.y,
                speed: 0.5 + Math.random() * 0.5,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            };

            this.animationGroup.add(mesh);
        }
    }

    createParticleSystem() {
        // 创建粒子系统
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = 0;

            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });

        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.animationGroup.add(this.particleSystem);
    }

    createGlowingCircle() {
        // 创建发光圆圈
        const circleGeometry = new THREE.RingGeometry(0.3, 0.4, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        this.glowCircle = new THREE.Mesh(circleGeometry, circleMaterial);
        this.animationGroup.add(this.glowCircle);
    }

    showAnimation(position, size) {
        if (!this.isVisible) {
            this.isVisible = true;
            this.animationGroup.visible = true;
        }

        // 更新目标位置和大小
        this.targetPosition = position;
        this.targetSize = size;

        // 将屏幕坐标转换为Three.js坐标
        const x = (position.x / this.canvas.width) * 2 - 1;
        const y = -(position.y / this.canvas.height) * 2 + 1;

        // 平滑移动动画组
        this.animationGroup.position.x = x;
        this.animationGroup.position.y = y;

        // 根据检测到的标记大小调整动画组大小
        const scale = Math.min(size.width, size.height) / 100;
        this.animationGroup.scale.set(scale, scale, 1);
    }

    hideAnimation() {
        if (this.isVisible) {
            this.isVisible = false;
            this.animationGroup.visible = false;
        }
    }

    update() {
        if (!this.isVisible) return;

        const time = Date.now() * 0.001;

        if (this.isPngAnimation) {
            this.updatePngAnimation(time);
        } else {
            this.updateDefaultAnimation(time);
        }

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }

    updatePngAnimation(time) {
        if (!this.pngSprite || this.pngSprites.length === 0) return;

        // 更新当前帧
        this.currentFrame += this.animationSpeed;
        if (this.currentFrame >= this.pngSprites.length) {
            this.currentFrame = 0;
        }

        const frameIndex = Math.floor(this.currentFrame);
        if (this.pngSprites[frameIndex]) {
            this.pngSprite.material.map = this.pngSprites[frameIndex];
            this.pngSprite.material.needsUpdate = true;
        }
    }

    updateDefaultAnimation(time) {
        // 更新浮动元素
        this.animationGroup.children.forEach((child, index) => {
            if (child.userData && child.userData.originalY !== undefined) {
                // 浮动动画
                child.position.y = child.userData.originalY + Math.sin(time * child.userData.speed) * 0.1;
                
                // 旋转动画
                child.rotation.z += child.userData.rotationSpeed;
            }
        });

        // 更新粒子系统
        if (this.particleSystem) {
            this.particleSystem.rotation.z += 0.001;
        }

        // 更新发光圆圈
        if (this.glowCircle) {
            this.glowCircle.rotation.z += 0.01;
            this.glowCircle.material.opacity = 0.3 + Math.sin(time * 2) * 0.2;
        }
    }

    // 渲染到指定的canvas上下文（用于拍照）
    renderToCanvas(ctx) {
        if (!this.isVisible) return;

        // 创建临时canvas来获取Three.js渲染结果
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        const tempRenderer = new THREE.WebGLRenderer({ canvas: tempCanvas, alpha: true });
        tempRenderer.setSize(this.canvas.width, this.canvas.height);
        tempRenderer.setClearColor(0x000000, 0);
        
        tempRenderer.render(this.scene, this.camera);
        
        // 将Three.js渲染结果绘制到目标canvas
        ctx.drawImage(tempCanvas, 0, 0);
        
        tempRenderer.dispose();
    }

    // 设置PNG动画文件列表
    setPngAnimationFiles(fileList) {
        this.pngFiles = fileList;
        this.loadPngAnimation();
    }

    // 设置动画速度
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
    }
} 