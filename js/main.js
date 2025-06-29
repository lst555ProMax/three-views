/**
 * 三视图应用主类
 * 实现3D方块编辑器，支持透视图、前视图、侧视图、顶视图四个视角
 */
class ThreeViewsApp {
    constructor() {
        // 存储四个视图的场景、相机、渲染器 
        this.scenes = {};
        this.cameras = {};
        this.renderers = {};
        
        // 射线投射器，用于鼠标点击检测
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 5x5x5的工作空间，存储方块状态
        this.workspace = new Array(5).fill().map(() => new Array(5).fill().map(() => new Array(5).fill(false)));
        
        // 方块组，存储所有3D方块
        this.blocks = new THREE.Group();
        
        // 撤回/重做系统
        this.undoStack = [];  // 撤回栈
        this.redoStack = [];  // 重做栈
        this.maxHistorySize = 50;  // 最大历史记录数
        
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.setupViews();      // 设置四个视图
        this.setupWorkspace();  // 设置工作空间
        this.setupControls();   // 设置交互控制
        this.animate();         // 开始渲染循环
    }

    /**
     * 设置四个视图：透视图、前视图、侧视图、顶视图
     */
    setupViews() {
        const views = ['perspective', 'front', 'side', 'top'];
        
        views.forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;

            // 创建场景并设置背景色
            this.scenes[viewName] = new THREE.Scene();
            this.scenes[viewName].background = new THREE.Color(0xf8f8f8);

            // 透视图使用透视相机，其他视图使用正交相机
            if (viewName === 'perspective') {
                this.cameras[viewName] = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
                this.cameras[viewName].position.set(8, 8, 8);
            } else {
                this.cameras[viewName] = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 1000);
                this.setCameraPosition(viewName);
            }
            this.cameras[viewName].lookAt(0, 0, 0);

            // 创建渲染器并添加到DOM
            this.renderers[viewName] = new THREE.WebGLRenderer({ antialias: true });
            this.renderers[viewName].setSize(width, height);
            container.appendChild(this.renderers[viewName].domElement);

            // 添加光照
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);  // 环境光
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);  // 方向光
            directionalLight.position.set(10, 10, 5);
            this.scenes[viewName].add(ambientLight, directionalLight);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * 设置正交视图相机位置
     */
    setCameraPosition(viewName) {
        const positions = {
            front: [0, 0, 8],   // 前视图：从Z轴正方向看
            side: [8, 0, 0],    // 侧视图：从X轴正方向看
            top: [0, 8, 0]      // 顶视图：从Y轴正方向看
        };
        this.cameras[viewName].position.set(...positions[viewName]);
    }

    /**
     * 设置工作空间，包括网格线、占位符和坐标轴
     */
    setupWorkspace() {
        // 创建3D网格线
        this.createGridLines();
        
        // 创建透明占位方块用于点击检测
        this.createPlaceholders();
        
        // 创建坐标轴指示器
        this.createAxisHelper();
        
        // 将网格线、占位符、方块组添加到所有场景
        Object.keys(this.scenes).forEach(viewName => {
            this.scenes[viewName].add(this.gridLines.clone());
            this.scenes[viewName].add(this.placeholders.clone());
            this.scenes[viewName].add(this.blocks.clone());
            // 只在透视图中显示坐标轴
            if (viewName === 'perspective') {
                this.scenes[viewName].add(this.axisHelper.clone());
            }
        });
    }
    
    /**
     * 创建3D网格线，显示5x5x5工作空间的边界
     */
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
    
    /**
     * 创建透明占位符，用于鼠标点击检测
     */
    createPlaceholders() {
        this.placeholders = new THREE.Group();
        
        // 创建一个大的底部平面用于检测底面点击
        const planeGeometry = new THREE.PlaneGeometry(5, 5);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0,
            visible: false,  // 不可见但可以被射线检测
            side: THREE.DoubleSide  // 双面渲染，从任何方向都能检测到
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2; // 旋转使其水平
        plane.position.set(0, -2.5, 0); // 放在底部网格线位置
        plane.userData = { isGroundPlane: true };
        
        this.placeholders.add(plane);
    }
    
    /**
     * 创建坐标轴指示器，显示X(红)、Y(绿)、Z(蓝)轴
     */
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
        const labels = [
            { text: 'X', color: '#ff0000', position: [3.2, -2.5, -2.5] },
            { text: 'Y', color: '#00ff00', position: [-2.5, 3.2, -2.5] },
            { text: 'Z', color: '#0000ff', position: [-2.5, -2.5, 3.2] }
        ];
        
        labels.forEach(({ text, color, position }) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 64;
            context.font = '48px Arial';
            context.fillStyle = color;
            context.textAlign = 'center';
            context.fillText(text, 32, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
            sprite.position.set(...position);
            sprite.scale.set(0.5, 0.5, 1);
            this.axisHelper.add(sprite);
        });
    }

    /**
     * 设置鼠标交互控制
     */
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
        
        // 拖拽旋转控制相关变量
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
        
        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                this.undo();
            } else if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || 
                       (event.ctrlKey && event.key === 'y')) {
                event.preventDefault();
                this.redo();
            }
        });
    }

    /**
     * 将鼠标坐标转换为标准化设备坐标并设置射线投射器
     */
    setupRaycaster(event) {
        const rect = this.renderers.perspective.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.cameras.perspective);
    }

    /**
     * 处理鼠标左键点击事件，用于添加方块
     */
    onMouseClick(event) {
        if (this.isDragging) return;
        this.setupRaycaster(event);
        
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
            const gridX = Math.round(intersectPoint.x + 2);
            const gridZ = Math.round(intersectPoint.z + 2);
            
            console.log('intersectPoint.x:', intersectPoint.x, 'intersectPoint.z:', intersectPoint.z);
            console.log('gridX:', gridX, 'gridZ:', gridZ);
            
            if (gridX >= 0 && gridX < 5 && gridZ >= 0 && gridZ < 5) {
                this.addBlockAtXZ(gridX, gridZ);
            }
        }
    }
    
    /**
     * 处理鼠标右键点击事件，用于删除方块
     */
    onRightClick(event) {
        if (this.isDragging) return;
        this.setupRaycaster(event);
        
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
                        
                        // 检查是否为该XZ位置的最顶层方块
                        if (this.isTopBlock(gridPos.x, gridPos.y, gridPos.z)) {
                            this.removeTopBlock(gridPos.x, gridPos.z);
                        }
                        return;
                    }
                }
            }
        }
    }

    /**
     * 旋转透视相机
     * @param {number} deltaX - 水平旋转量
     * @param {number} deltaY - 垂直旋转量
     */
    rotateCamera(deltaX, deltaY) {
        const camera = this.cameras.perspective;
        const spherical = new THREE.Spherical();
        const offset = new THREE.Vector3();
        
        // 将相机位置转换为球坐标
        offset.copy(camera.position).sub(new THREE.Vector3(0, 0, 0));
        spherical.setFromVector3(offset);
        
        // 更新球坐标角度
        spherical.theta -= deltaX;  // 水平角度
        spherical.phi += deltaY;    // 垂直角度
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi)); // 限制垂直角度
        
        // 将球坐标转换回笛卡尔坐标并更新相机位置
        offset.setFromSpherical(spherical);
        camera.position.copy(offset.add(new THREE.Vector3(0, 0, 0)));
        camera.lookAt(0, 0, 0);
    }
    
    /**
     * 缩放透视相机
     * @param {number} delta - 缩放量
     */
    zoomCamera(delta) {
        const camera = this.cameras.perspective;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        // 计算当前距离和新距离
        const distance = camera.position.length();
        const newDistance = Math.max(3, Math.min(20, distance + delta * distance));
        
        // 更新相机位置
        camera.position.normalize().multiplyScalar(newDistance);
        camera.lookAt(0, 0, 0);
    }

    /**
     * 网格坐标转世界坐标
     */
    gridToWorld(gridPos) {
        return {
            x: gridPos.x - 2,
            y: gridPos.y - 2,
            z: gridPos.z - 2
        };
    }

    /**
     * 保存当前状态到撤回栈
     */
    saveState() {
        const state = this.workspace.map(x => x.map(y => [...y]));
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = []; // 清空重做栈
    }

    /**
     * 从状态重建工作空间
     */
    restoreFromState(state) {
        this.workspace = state.map(x => x.map(y => [...y]));
        this.blocks.clear();
        
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                for (let z = 0; z < 5; z++) {
                    if (this.workspace[x][y][z]) {
                        this.createBlockDirect(x, y, z);
                    }
                }
            }
        }
        this.updateAllScenes();
    }

    /**
     * 直接创建方块（不保存状态）
     */
    createBlockDirect(x, y, z) {
        const worldPos = this.gridToWorld({x, y, z});
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        const cube = new THREE.Mesh(geometry, material);
        
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        
        cube.position.set(worldPos.x, worldPos.y, worldPos.z);
        cube.add(wireframe);
        cube.userData = { gridPos: {x, y, z} };
        
        this.blocks.add(cube);
    }

    /**
     * 创建方块（保存状态）
     */
    createBlock(x, y, z) {
        this.saveState();
        this.workspace[x][y][z] = true;
        this.createBlockDirect(x, y, z);
        this.updateAllScenes();
    }

    /**
     * 在指定XZ坐标添加方块（自动堆叠）
     */
    addBlockAtXZ(x, z) {
        let blockCount = 0;
        for (let y = 0; y < 5; y++) {
            if (this.workspace[x][y][z]) blockCount++;
        }
        if (blockCount >= 5) return;
        this.createBlock(x, blockCount, z);
    }
    
    /**
     * 在指定方块上方添加新方块
     */
    addBlockAbove(x, y, z) {
        const newY = y + 1;
        if (newY >= 5 || this.workspace[x][newY][z]) return;
        this.createBlock(x, newY, z);
    }
    
    /**
     * 检查是否为指定XZ位置的最顶层方块
     */
    isTopBlock(x, y, z) {
        // 检查该方块上方是否没有其他方块
        for (let checkY = y + 1; checkY < 5; checkY++) {
            if (this.workspace[x][checkY][z]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 删除指定XZ位置上最顶层的方块
     */
    removeTopBlock(x, z) {
        // 找到该XZ位置上最高的方块
        let topY = -1;
        for (let y = 4; y >= 0; y--) {
            if (this.workspace[x][y][z]) {
                topY = y;
                break;
            }
        }
        
        if (topY >= 0) {
            this.saveState();
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
    }
    
    /**
     * 删除指定位置的方块（保留用于内部调用）
     */
    removeBlock(x, y, z) {
        this.saveState();
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



    /**
     * 更新所有视图中的方块显示
     */
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



    /**
     * 设置透视相机的视角方向（带动画过渡）
     * @param {string} direction - 视角方向：top, bottom, front, back, left, right
     */
    setViewDirection(direction) {
        const camera = this.cameras.perspective;
        
        // 标准视图 + 8个角视图位置
        const positions = {
            // 6个标准视图
            top: [0, 10, 0],
            bottom: [0, -10, 0],
            front: [0, 0, 10],
            back: [0, 0, -10],
            left: [-10, 0, 0],
            right: [10, 0, 0],
            // 8个角视图（正方体的8个角）
            corner1: [8, 8, 8],     // 右上前
            corner2: [-8, 8, 8],    // 左上前
            corner3: [8, -8, 8],    // 右下前
            corner4: [-8, -8, 8],   // 左下前
            corner5: [8, 8, -8],    // 右上后
            corner6: [-8, 8, -8],   // 左上后
            corner7: [8, -8, -8],   // 右下后
            corner8: [-8, -8, -8]   // 左下后
        };
        
        // 对应的上方向配置
        const upVectors = {
            // 6个标准视图
            top: [0, 0, -1],
            bottom: [0, 0, 1],
            front: [0, 1, 0],
            back: [0, 1, 0],
            left: [0, 1, 0],
            right: [0, 1, 0],
            // 8个角视图都使用标准上方向
            corner1: [0, 1, 0],
            corner2: [0, 1, 0],
            corner3: [0, 1, 0],
            corner4: [0, 1, 0],
            corner5: [0, 1, 0],
            corner6: [0, 1, 0],
            corner7: [0, 1, 0],
            corner8: [0, 1, 0]
        };
        
        // 创建临时相机用于计算四元数
        const startCamera = camera.clone();
        const endCamera = camera.clone();
        endCamera.position.set(...positions[direction]);
        endCamera.up.set(...upVectors[direction]);
        endCamera.lookAt(0, 0, 0);
        
        // 获取起始和结束的四元数
        const startQuaternion = startCamera.quaternion.clone();
        const endQuaternion = endCamera.quaternion.clone();
        const startPosition = startCamera.position.clone();
        const endPosition = endCamera.position.clone();
        
        const duration = 1000;
        const startTime = Date.now();
        
        // 相机动画函数
        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // 缓动函数
            
            if (progress >= 1) {
                camera.position.copy(endPosition);
                camera.quaternion.copy(endQuaternion);
            } else {
                camera.position.lerpVectors(startPosition, endPosition, easeProgress);
                camera.quaternion.slerpQuaternions(startQuaternion, endQuaternion, easeProgress);
                requestAnimationFrame(animateCamera);
            }
        };
        
        animateCamera();
    }

    /**
     * 撤回操作
     */
    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentState = this.workspace.map(x => x.map(y => [...y]));
        this.redoStack.push(currentState);
        
        const previousState = this.undoStack.pop();
        this.restoreFromState(previousState);
    }

    /**
     * 重做操作
     */
    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentState = this.workspace.map(x => x.map(y => [...y]));
        this.undoStack.push(currentState);
        
        const nextState = this.redoStack.pop();
        this.restoreFromState(nextState);
    }

    /**
     * 清空工作空间，删除所有方块
     */
    clearWorkspace() {
        this.saveState();
        this.workspace = new Array(5).fill().map(() => new Array(5).fill().map(() => new Array(5).fill(false)));
        this.blocks.clear();
        this.updateAllScenes();
    }

    /**
     * 渲染循环，持续渲染所有视图
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        Object.keys(this.renderers).forEach(viewName => {
            this.renderers[viewName].render(this.scenes[viewName], this.cameras[viewName]);
        });
    }

    /**
     * 处理窗口大小变化事件
     */
    onWindowResize() {
        Object.keys(this.renderers).forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            // 更新透视相机的宽高比
            if (this.cameras[viewName].isPerspectiveCamera) {
                this.cameras[viewName].aspect = width / height;
            }
            this.cameras[viewName].updateProjectionMatrix();
            this.renderers[viewName].setSize(width, height);
        });
    }
}

// 全局应用实例
let app;

/**
 * 页面加载完成后初始化应用
 */
window.addEventListener('load', () => {
    app = new ThreeViewsApp();
});