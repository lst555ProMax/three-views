/**
 * 场景管理器 - 负责管理4个视图的场景创建和渲染
 */
class SceneManager {
    constructor(app) {
        this.app = app;
    }

    // 创建标准光照系统
    createLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);  // 环境光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);  // 方向光
        directionalLight.position.set(10, 10, 5);
        return { ambientLight, directionalLight };
    }

    setupScenes() {
        const views = ['perspective', 'front', 'side', 'top'];
        
        views.forEach(viewName => {
            // 获取html显示位置
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;

            // 创建3D世界（内存中的数据结构）
            this.app.scenes[viewName] = new THREE.Scene();
            this.app.scenes[viewName].background = new THREE.Color(0xf8f8f8);

            // 创建画布和绘制工具
            this.app.renderers[viewName] = new THREE.WebGLRenderer({ antialias: true });  // 抗锯齿渲染
            this.app.renderers[viewName].setSize(width, height);

            // 将画布放到html页面中显示
            container.appendChild(this.app.renderers[viewName].domElement);

            // 添加光照系统
            const lights = this.createLights();
            this.app.scenes[viewName].add(lights.ambientLight, lights.directionalLight);
        });
    }

    addToAllScenes() {
        Object.keys(this.app.scenes).forEach(viewName => {
            this.app.scenes[viewName].add(this.app.gridLines.clone()); // 增加的是副本
            this.app.scenes[viewName].add(this.app.placeholders.clone());
            this.app.scenes[viewName].add(this.app.blocks.clone());
            if (viewName === 'perspective') {
                this.app.scenes[viewName].add(this.app.axisHelper.clone());
            }
        });
    }

    // 用户添加/删除方块时，同步更新所有场景
    updateAllScenes() {
        Object.keys(this.app.scenes).forEach(viewName => {
            //  找到旧的方块组（是组对象，且包含子对象满足：有用户数据、有网格位置信息、不是占位符）
            const oldBlocks = this.app.scenes[viewName].children.filter(child => 
                child.type === 'Group' && child.children.some(c => c.userData && c.userData.gridPos && !c.userData.isPlaceholder)
            ); // ?
            oldBlocks.forEach(group => this.app.scenes[viewName].remove(group));  // 移除旧方块
            this.app.scenes[viewName].add(this.app.blocks.clone());  //  添加新方块
        });
    }

    updatePlaceholders() {
        Object.keys(this.app.scenes).forEach(viewName => {
            // 移除旧的占位符组
            const oldPlaceholders = this.app.scenes[viewName].children.filter(child => 
                child.type === 'Group' && child.children.some(c => c.userData && c.userData.isGroundPlane)
            );
            oldPlaceholders.forEach(group => this.app.scenes[viewName].remove(group));
            // 添加新的占位符组
            this.app.scenes[viewName].add(this.app.placeholders.clone());
        });
    }

    clearAllScenes() {
        Object.keys(this.app.scenes).forEach(viewName => {
            this.app.scenes[viewName].clear();
            // 重新添加光照系统
            const lights = this.createLights();
            this.app.scenes[viewName].add(lights.ambientLight, lights.directionalLight);
        });
    }

    //  核心的动画循环，持续渲染所有试图
    animate() {
        // 请求下一帧动画
        requestAnimationFrame(() => this.animate());
        // 渲染所有视图
        Object.keys(this.app.renderers).forEach(viewName => {
            this.app.renderers[viewName].render(this.app.scenes[viewName], this.app.cameras[viewName]);
        });
    }
}