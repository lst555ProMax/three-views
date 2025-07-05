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
        
        // 重力模式
        this.gravityMode = true;
        this.currentLayer = 0;
        
        // 正交视图状态
        this.orthographicViews = {
            front: 'front',
            side: 'right', 
            top: 'top'
        };
        
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
        this.levelManager = new LevelManager(this);
        this.uiManager = new UIManager(this);
        
        this.init();
    }

    init() {
        this.sceneManager.setupScenes();
        this.cameraManager.setupCameras();
        this.workspaceBuilder.buildAll();
        this.sceneManager.addToAllScenes();
        this.interactionHandler.setupControls();
        this.sceneManager.animate();
        // 初始化UI
        setTimeout(() => {
            this.uiManager.initializeUI();
        }, 100);
    }

    createWorkspaceArray(size) {
        return new Array(size).fill().map(() => new Array(size).fill().map(() => new Array(size).fill(false)));
    }

    changeWorkspaceSize(newSize) {
        this.workspaceSize = parseInt(newSize);
        this.workspace = this.createWorkspaceArray(this.workspaceSize);
        this.blocks.clear();
        this.historyManager.clear();
        this.levelManager.clearLevel();
        this.rebuildWorkspace();
    }

    rebuildWorkspace() {
        this.sceneManager.clearAllScenes();
        // 重置正交视图状态
        this.orthographicViews = { front: 'front', side: 'right', top: 'top' };
        this.cameraManager.setupCameras();
        this.workspaceBuilder.buildAll();
        this.sceneManager.addToAllScenes();
        // 更新视图标签
        this.uiManager.updateViewLabel('front', 'front');
        this.uiManager.updateViewLabel('side', 'right');
        this.uiManager.updateViewLabel('top', 'top');
    }

    // 代理方法，保持向后兼容
    setViewDirection(direction) {
        this.cameraManager.setViewDirection(direction);
    }

    clearWorkspace() {
        this.blockManager.clearWorkspace();
        this.levelManager.clearLevel();
    }

    generateLevel() {
        this.levelManager.generateLevel();
    }

    setFreeMode() {
        this.clearWorkspace();
        this.uiManager.updateModeButtons('free');
        this.uiManager.updateViewLabelsForMode(false);
    }

    setLevelMode() {
        this.levelManager.generateLevel();
        this.uiManager.updateModeButtons('level');
        this.uiManager.updateViewLabelsForMode(true);
    }

    setGravityMode(enabled) {
        this.gravityMode = enabled;
        this.currentLayer = 0;
        this.uiManager.updateGravityButtons(enabled);
        this.uiManager.updateLayerControl(enabled);
        this.workspaceBuilder.updatePlaceholders();
    }

    changeLayer(delta) {
        if (!this.gravityMode) {
            const newLayer = Math.max(0, Math.min(this.workspaceSize - 1, this.currentLayer + delta));
            if (newLayer !== this.currentLayer) {
                this.currentLayer = newLayer;
                this.uiManager.updateCurrentLayer(this.currentLayer);
                this.workspaceBuilder.updatePlaceholders();
            }
        }
    }



    toggleOrthographicView(viewName) {
        const toggleMap = {
            front: { current: 'front', next: 'back' },
            back: { current: 'back', next: 'front' },
            right: { current: 'right', next: 'left' },
            left: { current: 'left', next: 'right' },
            top: { current: 'top', next: 'bottom' },
            bottom: { current: 'bottom', next: 'top' }
        };
        
        const currentView = this.orthographicViews[viewName];
        const toggle = toggleMap[currentView];
        if (toggle) {
            this.orthographicViews[viewName] = toggle.next;
            this.cameraManager.updateOrthographicView(viewName, toggle.next);
            this.uiManager.updateViewLabel(viewName, toggle.next);
        }
    }


}

// 全局应用实例
let app;

window.addEventListener('load', () => {
    app = new ThreeViewsApp();
});