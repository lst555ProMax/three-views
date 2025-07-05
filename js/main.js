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
        
        // 渲染模式
        this.renderMode = 'solid'; // 'solid', 'wireframe', 'transparent'
        
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
        const wasLevelMode = this.levelManager.isLevelMode;
        this.workspaceSize = parseInt(newSize);
        this.workspace = this.createWorkspaceArray(this.workspaceSize);
        this.blocks.clear();
        this.historyManager.clear();
        this.levelManager.clearLevel();
        // 在无重力模式下重置当前层级为1
        if (!this.gravityMode) {
            this.currentLayer = 1;
            this.uiManager.updateCurrentLayer(this.currentLayer);
        }
        this.rebuildWorkspace();
        // 如果之前是关卡模式，重新生成关卡
        if (wasLevelMode) {
            this.levelManager.generateLevel();
            this.uiManager.updateViewLabelsForMode(true);
        }
    }

    rebuildWorkspace() {
        // 保存当前透视相机状态
        const currentCamera = this.cameras.perspective ? {
            position: this.cameras.perspective.position.clone(),
            quaternion: this.cameras.perspective.quaternion.clone()
        } : null;
        
        this.sceneManager.clearAllScenes();
        // 重置正交视图状态
        this.orthographicViews = { front: 'front', side: 'right', top: 'top' };
        this.cameraManager.setupCameras();
        
        // 恢复透视相机状态
        if (currentCamera && this.cameras.perspective) {
            this.cameras.perspective.position.copy(currentCamera.position);
            this.cameras.perspective.quaternion.copy(currentCamera.quaternion);
        }
        
        this.workspaceBuilder.buildAll();
        this.sceneManager.addToAllScenes();
        // 更新视图标签
        this.uiManager.updateViewLabel('front', 'front');
        this.uiManager.updateViewLabel('side', 'right');
        this.uiManager.updateViewLabel('top', 'top');
        // 使用动画过渡到默认视角
        this.cameraManager.setViewDirection('corner1');
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
        // 重置层级为默认值
        if (!this.gravityMode) {
            this.currentLayer = 1;
            this.uiManager.updateCurrentLayer(this.currentLayer);
            this.workspaceBuilder.updatePlaceholders();
        }
        this.uiManager.updateModeButtons('free');
        this.uiManager.updateViewLabelsForMode(false);
        // 重置视角为右上前角视图
        this.cameraManager.setViewDirection('corner1');
    }

    setLevelMode() {
        // 重置当前层级为1
        if (!this.gravityMode) {
            this.currentLayer = 1;
            this.uiManager.updateCurrentLayer(this.currentLayer);
            this.workspaceBuilder.updatePlaceholders();
        }
        this.levelManager.generateLevel();
        this.uiManager.updateModeButtons('level');
        this.uiManager.updateViewLabelsForMode(true);
        // 重置视角为右上前角视图
        this.cameraManager.setViewDirection('corner1');
    }

    setRenderMode(mode) {
        this.renderMode = mode;
        this.uiManager.updateRenderButtons(mode);
        this.blockManager.updateAllBlocksRender();
    }

    setGravityMode(enabled) {
        const wasLevelMode = this.levelManager.isLevelMode;
        this.gravityMode = enabled;
        this.currentLayer = enabled ? 0 : 1;
        this.uiManager.updateGravityButtons(enabled);
        this.uiManager.updateLayerControl(enabled);
        if (!enabled) {
            this.uiManager.updateCurrentLayer(this.currentLayer);
        }
        this.workspaceBuilder.updatePlaceholders();
        // 清空方块和重置视图状态
        this.blockManager.clearWorkspace();
        this.cameraManager.setViewDirection('corner1');
        // 如果之前是关卡模式，重新生成关卡
        if (wasLevelMode) {
            this.levelManager.generateLevel();
            this.uiManager.updateViewLabelsForMode(true);
        }
    }

    changeLayer(delta) {
        if (!this.gravityMode) {
            const newLayer = Math.max(0, Math.min(this.workspaceSize, this.currentLayer + delta));
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