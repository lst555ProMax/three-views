class ThreeViewsApp {
    constructor() {
        this.scenes = {};
        this.cameras = {};
        this.renderers = {};
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.workspace = new Array(5).fill().map(() => new Array(5).fill().map(() => new Array(5).fill(false)));
        this.blocks = new THREE.Group();
        this.isAddMode = true;
        this.init();
    }

    init() {
        this.setupViews();
        this.setupWorkspace();
        this.setupControls();
        this.animate();
    }

    setupViews() {
        const views = ['perspective', 'front', 'side', 'top'];
        
        views.forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;

            this.scenes[viewName] = new THREE.Scene();
            this.scenes[viewName].background = new THREE.Color(0xf8f8f8);

            if (viewName === 'perspective') {
                this.cameras[viewName] = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
                this.cameras[viewName].position.set(8, 8, 8);
            } else {
                this.cameras[viewName] = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 1000);
                this.setCameraPosition(viewName);
            }
            this.cameras[viewName].lookAt(0, 0, 0);

            this.renderers[viewName] = new THREE.WebGLRenderer({ antialias: true });
            this.renderers[viewName].setSize(width, height);
            container.appendChild(this.renderers[viewName].domElement);

            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            this.scenes[viewName].add(ambientLight, directionalLight);
        });

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setCameraPosition(viewName) {
        const positions = {
            front: [0, 0, 8],
            side: [8, 0, 0],
            top: [0, 8, 0]
        };
        this.cameras[viewName].position.set(...positions[viewName]);
    }

    setupWorkspace() {
        // 创建3D网格线
        this.createGridLines();
        
        // 创建透明占位方块用于点击检测
        this.createPlaceholders();
        
        // 创建坐标轴指示器
        this.createAxisHelper();
        
        Object.keys(this.scenes).forEach(viewName => {
            this.scenes[viewName].add(this.gridLines.clone());
            this.scenes[viewName].add(this.placeholders.clone());
            this.scenes[viewName].add(this.blocks.clone());
            if (viewName === 'perspective') {
                this.scenes[viewName].add(this.axisHelper.clone());
            }
        });
    }
    
    createGridLines() {
        this.gridLines = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xcccccc, 
            opacity: 0.4, 
            transparent: true 
        });
        
        // 底面网格 (Y = -2.5)
        for (let x = 0; x < 6; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - 2.5, -2.5, -2.5),
                new THREE.Vector3(x - 2.5, -2.5, 2.5)
            ]);
            this.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        for (let z = 0; z < 6; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2.5, -2.5, z - 2.5),
                new THREE.Vector3(2.5, -2.5, z - 2.5)
            ]);
            this.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        
        // 左面网格 (X = -2.5)
        for (let y = 0; y < 6; y++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2.5, y - 2.5, -2.5),
                new THREE.Vector3(-2.5, y - 2.5, 2.5)
            ]);
            this.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        for (let z = 0; z < 6; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2.5, -2.5, z - 2.5),
                new THREE.Vector3(-2.5, 2.5, z - 2.5)
            ]);
            this.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        
        // 后面网格 (Z = -2.5)
        for (let x = 0; x < 6; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - 2.5, -2.5, -2.5),
                new THREE.Vector3(x - 2.5, 2.5, -2.5)
            ]);
            this.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        for (let y = 0; y < 6; y++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-2.5, y - 2.5, -2.5),
                new THREE.Vector3(2.5, y - 2.5, -2.5)
            ]);
            this.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
    }
    
    createPlaceholders() {
        this.placeholders = new THREE.Group();
        
        // 创建一个大的底部平面用于检测
        const planeGeometry = new THREE.PlaneGeometry(5, 5);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0,
            visible: false
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2; // 旋转使其水平
        plane.position.set(0, -2, 0); // 放在底部
        plane.userData = { isGroundPlane: true };
        
        this.placeholders.add(plane);
    }
    
    createAxisHelper() {
        this.axisHelper = new THREE.Group();
        
        // X轴 - 红色 (沿着底面和后面的交线)
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-2.5, -2.5, -2.5),
            new THREE.Vector3(2.5, -2.5, -2.5)
        ]);
        const xLine = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }));
        this.axisHelper.add(xLine);
        
        // X轴箭头
        const xArrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const xArrow = new THREE.Mesh(xArrowGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        xArrow.position.set(2.8, -2.5, -2.5);
        xArrow.rotateZ(-Math.PI / 2);
        this.axisHelper.add(xArrow);
        
        // Y轴 - 绿色 (沿着左面和后面的交线)
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-2.5, -2.5, -2.5),
            new THREE.Vector3(-2.5, 2.5, -2.5)
        ]);
        const yLine = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }));
        this.axisHelper.add(yLine);
        
        // Y轴箭头
        const yArrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const yArrow = new THREE.Mesh(yArrowGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        yArrow.position.set(-2.5, 2.8, -2.5);
        this.axisHelper.add(yArrow);
        
        // Z轴 - 蓝色 (沿着左面和底面的交线，右手坐标系)
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-2.5, -2.5, -2.5),
            new THREE.Vector3(-2.5, -2.5, 2.5)
        ]);
        const zLine = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 }));
        this.axisHelper.add(zLine);
        
        // Z轴箭头
        const zArrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const zArrow = new THREE.Mesh(zArrowGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
        zArrow.position.set(-2.5, -2.5, 2.8);
        zArrow.rotateX(Math.PI / 2);
        this.axisHelper.add(zArrow);
        
        // 添加轴标签
        this.createAxisLabels();
    }
    
    createAxisLabels() {
        // X轴标签
        const xCanvas = document.createElement('canvas');
        const xContext = xCanvas.getContext('2d');
        xCanvas.width = 64;
        xCanvas.height = 64;
        xContext.font = '48px Arial';
        xContext.fillStyle = '#ff0000';
        xContext.textAlign = 'center';
        xContext.fillText('X', 32, 40);
        const xTexture = new THREE.CanvasTexture(xCanvas);
        const xSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: xTexture }));
        xSprite.position.set(3.2, -2.5, -2.5);
        xSprite.scale.set(0.5, 0.5, 1);
        this.axisHelper.add(xSprite);
        
        // Y轴标签
        const yCanvas = document.createElement('canvas');
        const yContext = yCanvas.getContext('2d');
        yCanvas.width = 64;
        yCanvas.height = 64;
        yContext.font = '48px Arial';
        yContext.fillStyle = '#00ff00';
        yContext.textAlign = 'center';
        yContext.fillText('Y', 32, 40);
        const yTexture = new THREE.CanvasTexture(yCanvas);
        const ySprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: yTexture }));
        ySprite.position.set(-2.5, 3.2, -2.5);
        ySprite.scale.set(0.5, 0.5, 1);
        this.axisHelper.add(ySprite);
        
        // Z轴标签
        const zCanvas = document.createElement('canvas');
        const zContext = zCanvas.getContext('2d');
        zCanvas.width = 64;
        zCanvas.height = 64;
        zContext.font = '48px Arial';
        zContext.fillStyle = '#0000ff';
        zContext.textAlign = 'center';
        zContext.fillText('Z', 32, 40);
        const zTexture = new THREE.CanvasTexture(zCanvas);
        const zSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTexture }));
        zSprite.position.set(-2.5, -2.5, 3.2);
        zSprite.scale.set(0.5, 0.5, 1);
        this.axisHelper.add(zSprite);
    }

    setupControls() {
        const canvas = this.renderers.perspective.domElement;
        
        // 左键点击添加方块
        canvas.addEventListener('click', (event) => {
            if (!this.isDragging) {
                this.onMouseClick(event);
            }
        });
        
        // 右键点击删除方块
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (!this.isDragging) {
                this.onRightClick(event);
            }
        });
        
        // 拖拽旋转控制
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        
        canvas.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // 左键
                this.isDragging = false;
                this.previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (event.buttons === 1) { // 左键按下
                const deltaMove = {
                    x: event.clientX - this.previousMousePosition.x,
                    y: event.clientY - this.previousMousePosition.y
                };
                
                if (Math.abs(deltaMove.x) > 3 || Math.abs(deltaMove.y) > 3) {
                    this.isDragging = true;
                    this.rotateCamera(deltaMove.x * 0.01, deltaMove.y * 0.01);
                }
                
                this.previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            setTimeout(() => { this.isDragging = false; }, 100);
        });
        
        // 滚轮缩放
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.zoomCamera(event.deltaY * 0.001);
        });
        

    }

    onMouseClick(event) {
        if (this.isDragging) return;
        
        const rect = this.renderers.perspective.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.cameras.perspective);
        
        // 先检测现有方块
        const blockGroup = this.scenes.perspective.children.find(child => 
            child.type === 'Group' && child.children.some(c => c.userData && c.userData.gridPos && !c.userData.isGroundPlane)
        );
        const blockIntersects = blockGroup ? 
            this.raycaster.intersectObjects(blockGroup.children, true) : [];
        
        if (blockIntersects.length > 0) {
            // 通过交点位置确定真正被点击的方块
            for (let intersect of blockIntersects) {
                const block = intersect.object;
                if (block.userData && block.userData.gridPos) {
                    const intersectPoint = intersect.point;
                    const blockPos = block.position;
                    
                    // 检查交点是否在该方块的范围内
                    const tolerance = 0.5;
                    if (Math.abs(intersectPoint.x - blockPos.x) <= tolerance &&
                        Math.abs(intersectPoint.y - blockPos.y) <= tolerance &&
                        Math.abs(intersectPoint.z - blockPos.z) <= tolerance) {
                        const gridPos = block.userData.gridPos;
                        this.addBlockAbove(gridPos.x, gridPos.y, gridPos.z);
                        return;
                    }
                }
            }
        }
        
        // 如果没有点击到方块，检测底部平面
        const placeholderGroup = this.scenes.perspective.children.find(child => 
            child.type === 'Group' && child.children.length > 0 && 
            child.children[0].userData && child.children[0].userData.isGroundPlane
        );
        const planeIntersects = placeholderGroup ? 
            this.raycaster.intersectObjects(placeholderGroup.children, false) : [];
        
        if (planeIntersects.length > 0) {
            const intersectPoint = planeIntersects[0].point;
            const gridX = Math.floor(intersectPoint.x + 2.5);
            const gridZ = Math.floor(intersectPoint.z + 2.5);
            
            if (gridX >= 0 && gridX < 5 && gridZ >= 0 && gridZ < 5) {
                this.addBlockAtXZ(gridX, gridZ);
            }
        }
    }
    
    onRightClick(event) {
        if (this.isDragging) return;
        
        const rect = this.renderers.perspective.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.cameras.perspective);
        
        // 检测现有方块
        const blockGroup = this.scenes.perspective.children.find(child => 
            child.type === 'Group' && child.children.some(c => c.userData && c.userData.gridPos && !c.userData.isGroundPlane)
        );
        const blockIntersects = blockGroup ? 
            this.raycaster.intersectObjects(blockGroup.children, true) : [];
        
        if (blockIntersects.length > 0) {
            // 通过交点位置确定真正被点击的方块
            for (let intersect of blockIntersects) {
                const block = intersect.object;
                if (block.userData && block.userData.gridPos) {
                    const intersectPoint = intersect.point;
                    const blockPos = block.position;
                    
                    // 检查交点是否在该方块的范围内
                    const tolerance = 0.5;
                    if (Math.abs(intersectPoint.x - blockPos.x) <= tolerance &&
                        Math.abs(intersectPoint.y - blockPos.y) <= tolerance &&
                        Math.abs(intersectPoint.z - blockPos.z) <= tolerance) {
                        const gridPos = block.userData.gridPos;
                        this.removeBlock(gridPos.x, gridPos.y, gridPos.z);
                        return;
                    }
                }
            }
        }
    }

    rotateCamera(deltaX, deltaY) {
        const camera = this.cameras.perspective;
        const spherical = new THREE.Spherical();
        const offset = new THREE.Vector3();
        
        offset.copy(camera.position).sub(new THREE.Vector3(0, 0, 0));
        spherical.setFromVector3(offset);
        
        spherical.theta -= deltaX;
        spherical.phi += deltaY;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        offset.setFromSpherical(spherical);
        camera.position.copy(offset.add(new THREE.Vector3(0, 0, 0)));
        camera.lookAt(0, 0, 0);
    }
    
    zoomCamera(delta) {
        const camera = this.cameras.perspective;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        const distance = camera.position.length();
        const newDistance = Math.max(3, Math.min(20, distance + delta * distance));
        
        camera.position.normalize().multiplyScalar(newDistance);
        camera.lookAt(0, 0, 0);
    }

    worldToGrid(worldPos) {
        return {
            x: Math.round(worldPos.x + 2),
            y: Math.round(worldPos.y + 2),
            z: Math.round(worldPos.z + 2)
        };
    }

    gridToWorld(gridPos) {
        return {
            x: gridPos.x - 2,
            y: gridPos.y - 2,
            z: gridPos.z - 2
        };
    }

    isValidPosition(pos) {
        return pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 5 && pos.z >= 0 && pos.z < 5;
    }

    addBlockAtXZ(x, z) {
        // 计算该XZ坐标已有的方块数量
        let blockCount = 0;
        for (let y = 0; y < 5; y++) {
            if (this.workspace[x][y][z]) {
                blockCount++;
            }
        }
        
        // 如果已经叠了5个方块，无法添加
        if (blockCount >= 5) return;
        
        const targetY = blockCount; // 新方块的Y位置
        this.workspace[x][targetY][z] = true;
        const worldPos = this.gridToWorld({x, y: targetY, z});
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        const cube = new THREE.Mesh(geometry, material);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        
        cube.position.set(worldPos.x, worldPos.y, worldPos.z);
        cube.add(wireframe);
        cube.userData = { gridPos: {x, y: targetY, z} };
        
        this.blocks.add(cube);
        this.updateAllScenes();
    }
    
    addBlockAbove(x, y, z) {
        const newY = y + 1;
        
        // 检查是否超出边界或已被占用
        if (newY >= 5 || this.workspace[x][newY][z]) return;
        
        this.workspace[x][newY][z] = true;
        const worldPos = this.gridToWorld({x, y: newY, z});
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        const cube = new THREE.Mesh(geometry, material);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        
        cube.position.set(worldPos.x, worldPos.y, worldPos.z);
        cube.add(wireframe);
        cube.userData = { gridPos: {x, y: newY, z} };
        
        this.blocks.add(cube);
        this.updateAllScenes();
    }
    
    removeBlock(x, y, z) {
        this.workspace[x][y][z] = false;
        const blockToRemove = this.blocks.children.find(child => 
            child.userData.gridPos && 
            child.userData.gridPos.x === x &&
            child.userData.gridPos.y === y &&
            child.userData.gridPos.z === z
        );
        
        if (blockToRemove) {
            this.blocks.remove(blockToRemove);
            this.updateAllScenes();
        }
    }

    removeTopBlock(x, z) {
        // 找到该X-Z坐标的最高方块
        let topY = -1;
        for (let y = 4; y >= 0; y--) {
            if (this.workspace[x][y][z]) {
                topY = y;
                break;
            }
        }
        
        if (topY === -1) return; // 没有方块可删除
        
        this.workspace[x][topY][z] = false;
        const blockToRemove = this.blocks.children.find(child => 
            child.userData.gridPos && 
            child.userData.gridPos.x === x &&
            child.userData.gridPos.y === topY &&
            child.userData.gridPos.z === z
        );
        
        if (blockToRemove) {
            this.blocks.remove(blockToRemove);
            this.updateAllScenes();
        }
    }

    updateAllScenes() {
        Object.keys(this.scenes).forEach(viewName => {
            // 移除旧的方块组
            const oldBlocks = this.scenes[viewName].children.filter(child => 
                child.type === 'Group' && child.children.some(c => c.userData && c.userData.gridPos && !c.userData.isPlaceholder)
            );
            oldBlocks.forEach(group => this.scenes[viewName].remove(group));
            
            // 添加新的方块组
            this.scenes[viewName].add(this.blocks.clone());
        });
    }

    toggleMode() {
        this.isAddMode = !this.isAddMode;
        document.getElementById('mode-btn').textContent = this.isAddMode ? '添加模式' : '删除模式';
    }

    setViewDirection(direction) {
        const camera = this.cameras.perspective;
        const positions = {
            top: [0, 10, 0],
            bottom: [0, -10, 0],
            front: [0, 0, 10],
            back: [0, 0, -10],
            left: [-10, 0, 0],
            right: [10, 0, 0]
        };
        
        const upVectors = {
            top: [0, 0, -1],
            bottom: [0, 0, 1],
            front: [0, 1, 0],
            back: [0, 1, 0],
            left: [0, 1, 0],
            right: [0, 1, 0]
        };
        
        const startPos = camera.position.clone();
        const startUp = camera.up.clone();
        const endPos = new THREE.Vector3(...positions[direction]);
        const endUp = new THREE.Vector3(...upVectors[direction]);
        const duration = 1000;
        const startTime = Date.now();
        
        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            if (progress >= 1) {
                camera.position.copy(endPos);
                camera.up.copy(endUp);
                camera.lookAt(0, 0, 0);
            } else {
                camera.position.lerpVectors(startPos, endPos, easeProgress);
                camera.up.lerpVectors(startUp, endUp, easeProgress);
                camera.lookAt(0, 0, 0);
                requestAnimationFrame(animateCamera);
            }
        };
        
        animateCamera();
    }

    clearWorkspace() {
        this.workspace = new Array(5).fill().map(() => new Array(5).fill().map(() => new Array(5).fill(false)));
        this.blocks.clear();
        this.updateAllScenes();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        Object.keys(this.renderers).forEach(viewName => {
            this.renderers[viewName].render(this.scenes[viewName], this.cameras[viewName]);
        });
    }

    onWindowResize() {
        Object.keys(this.renderers).forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            if (this.cameras[viewName].isPerspectiveCamera) {
                this.cameras[viewName].aspect = width / height;
            }
            this.cameras[viewName].updateProjectionMatrix();
            this.renderers[viewName].setSize(width, height);
        });
    }
}

// 全局实例
let app;

// 页面加载完成后初始化
window.addEventListener('load', () => {
    app = new ThreeViewsApp();
});