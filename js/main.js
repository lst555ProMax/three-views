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
        
        this.init();
    }

    init() {
        this.sceneManager.setupScenes();
        this.cameraManager.setupCameras();
        this.workspaceBuilder.buildAll();
        this.sceneManager.addToAllScenes();
        this.interactionHandler.setupControls();
        this.sceneManager.animate();
        // 初始化视图标签和按钮状态
        setTimeout(() => {
            this.updateViewLabel('front', 'front');
            this.updateViewLabel('side', 'right');
            this.updateViewLabel('top', 'top');
            this.updateModeButtons('free');
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
        this.updateViewLabel('front', 'front');
        this.updateViewLabel('side', 'right');
        this.updateViewLabel('top', 'top');
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
        this.updateModeButtons('free');
        // 更新自由模式下的视图标签
        this.updateViewLabel('front', 'front', false);
        this.updateViewLabel('side', 'right', false);
        this.updateViewLabel('top', 'top', false);
    }

    setLevelMode() {
        this.levelManager.generateLevel();
        this.updateModeButtons('level');
        // 更新关卡模式下的视图标签
        this.updateViewLabel('front', 'front', true);
        this.updateViewLabel('side', 'right', true);
        this.updateViewLabel('top', 'top', true);
    }

    updateModeButtons(activeMode) {
        const freeBtn = document.getElementById('free-mode-btn');
        const levelBtn = document.getElementById('level-mode-btn');
        
        if (activeMode === 'free') {
            freeBtn.style.background = '#007cba';
            levelBtn.style.background = '#ccc';
        } else {
            freeBtn.style.background = '#ccc';
            levelBtn.style.background = '#28a745';
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
            this.updateViewLabel(viewName, toggle.next);
        }
    }

    updateViewLabel(viewName, direction, isLevelMode = false) {
        const labels = {
            front: '正视图', back: '背视图',
            right: '右视图', left: '左视图', 
            top: '俯视图', bottom: '仰视图'
        };
        const container = document.getElementById(`${viewName}-view`);
        const label = container ? container.querySelector('.view-label') : null;
        if (label) {
            const suffix = isLevelMode ? '' : ' - 右键切换';
            label.textContent = `${labels[direction]}${suffix}`;
        }
    }
}

// 全局应用实例
let app;

window.addEventListener('load', () => {
    app = new ThreeViewsApp();
});