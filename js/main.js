/**
 * 三视图应用主类 - 模块化架构
 */
class ThreeViewsApp {
    constructor() {
        // 核心属性
        this.scenes = {};
        this.cameras = {};
        this.renderers = {};
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 工作空间
        this.workspaceSize = 5;
        this.workspace = this.createWorkspaceArray(this.workspaceSize);
        this.blocks = new THREE.Group();
        
        // 工作空间元素
        this.gridLines = null;
        this.placeholders = null;
        this.axisHelper = null;
        
        // 初始化管理器
        this.sceneManager = new SceneManager(this);
        this.cameraManager = new CameraManager(this);
        this.workspaceBuilder = new WorkspaceBuilder(this);
        this.blockManager = new BlockManager(this);
        this.interactionHandler = new InteractionHandler(this);
        this.historyManager = new HistoryManager(this);
        
        this.init();
    }

    init() {
        this.sceneManager.setupScenes();
        this.cameraManager.setupCameras();
        this.workspaceBuilder.buildAll();
        this.sceneManager.addToAllScenes();
        this.interactionHandler.setupControls();
        this.sceneManager.animate();
    }

    createWorkspaceArray(size) {
        return new Array(size).fill().map(() => new Array(size).fill().map(() => new Array(size).fill(false)));
    }

    changeWorkspaceSize(newSize) {
        this.workspaceSize = parseInt(newSize);
        this.workspace = this.createWorkspaceArray(this.workspaceSize);
        this.blocks.clear();
        this.historyManager.clear();
        this.rebuildWorkspace();
    }

    rebuildWorkspace() {
        this.sceneManager.clearAllScenes();
        this.cameraManager.setupCameras(); // 重新设置相机以适配新的工作空间大小
        this.workspaceBuilder.buildAll();
        this.sceneManager.addToAllScenes();
    }

    // 代理方法，保持向后兼容
    setViewDirection(direction) {
        this.cameraManager.setViewDirection(direction);
    }

    clearWorkspace() {
        this.blockManager.clearWorkspace();
    }
}

// 全局应用实例
let app;

window.addEventListener('load', () => {
    app = new ThreeViewsApp();
});