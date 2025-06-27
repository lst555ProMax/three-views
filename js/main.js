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
        
        Object.keys(this.scenes).forEach(viewName => {
            this.scenes[viewName].add(this.gridLines.clone());
            this.scenes[viewName].add(this.placeholders.clone());
            this.scenes[viewName].add(this.blocks.clone());
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
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0,
            visible: false
        });
        
        // 创建125个透明占位方块
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                for (let z = 0; z < 5; z++) {
                    const placeholder = new THREE.Mesh(geometry, material);
                    const worldPos = this.gridToWorld({x, y, z});
                    placeholder.position.set(worldPos.x, worldPos.y, worldPos.z);
                    placeholder.userData = { gridPos: {x, y, z}, isPlaceholder: true };
                    this.placeholders.add(placeholder);
                }
            }
        }
    }

    setupControls() {
        const canvas = this.renderers.perspective.domElement;
        
        // 点击添加/删除方块
        canvas.addEventListener('click', (event) => {
            if (!this.isDragging) {
                this.onMouseClick(event);
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
        
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    onMouseClick(event) {
        if (this.isDragging) return;
        
        const rect = this.renderers.perspective.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.cameras.perspective);
        
        // 先检测占位方块（更精确）
        const placeholderGroup = this.scenes.perspective.children.find(child => 
            child.type === 'Group' && child.children.length > 0 && 
            child.children[0].userData && child.children[0].userData.isPlaceholder
        );
        const placeholderIntersects = placeholderGroup ? 
            this.raycaster.intersectObjects(placeholderGroup.children, false) : [];
        
        if (placeholderIntersects.length > 0) {
            const gridPos = placeholderIntersects[0].object.userData.gridPos;
            if (this.isAddMode) {
                this.addBlock(gridPos);
            } else {
                this.removeBlock(gridPos);
            }
            return;
        }
        
        // 如果没有命中占位方块，再检测其他对象
        const intersects = this.raycaster.intersectObjects(this.scenes.perspective.children, true);
        if (intersects.length > 0) {
            const intersect = intersects.find(i => i.object.userData && i.object.userData.gridPos);
            if (intersect && !this.isAddMode) {
                this.removeBlock(intersect.object.userData.gridPos);
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

    addBlock(gridPos) {
        if (this.workspace[gridPos.x][gridPos.y][gridPos.z]) return;
        
        this.workspace[gridPos.x][gridPos.y][gridPos.z] = true;
        const worldPos = this.gridToWorld(gridPos);
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        const cube = new THREE.Mesh(geometry, material);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        
        cube.position.set(worldPos.x, worldPos.y, worldPos.z);
        cube.add(wireframe);
        cube.userData = { gridPos };
        
        this.blocks.add(cube);
        this.updateAllScenes();
    }

    removeBlock(gridPos) {
        if (!this.workspace[gridPos.x][gridPos.y][gridPos.z]) return;
        
        this.workspace[gridPos.x][gridPos.y][gridPos.z] = false;
        const blockToRemove = this.blocks.children.find(child => 
            child.userData.gridPos && 
            child.userData.gridPos.x === gridPos.x &&
            child.userData.gridPos.y === gridPos.y &&
            child.userData.gridPos.z === gridPos.z
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