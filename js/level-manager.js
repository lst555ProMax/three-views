/**
 * 关卡管理器 - 协调关卡生成、渲染和验证
 */
class LevelManager {
    constructor(app) {
        this.app = app;
        this.targetModel = null;
        this.targetViews = null;
        this.isLevelMode = false;
        
        // 初始化子模块
        this.generator = new LevelGenerator(app);
        this.renderer = new LevelRenderer(app);
        this.validator = new LevelValidator(app);
    }

    generateLevel() {
        this.app.clearWorkspace();
        this.targetModel = this.generator.generateRandomModel();
        this.targetViews = this.generator.generateTargetViews(this.targetModel);
        this.isLevelMode = true;
        this.renderer.hideThreeJSViews();
        this.renderer.createLevelCanvases();
        this.renderer.updateLevelViews(this.targetViews);
    }

    onBlockChange() {
        if (this.isLevelMode) {
            this.renderer.updateLevelViews(this.targetViews);
            if (this.validator.checkCompletion(this.targetViews)) {
                setTimeout(() => {
                    alert('恭喜！关卡完成！');
                }, 100);
            }
        }
    }

    clearLevel() {
        this.targetModel = null;
        this.targetViews = null;
        this.isLevelMode = false;
        
        // 清理canvas
        this.renderer.clearCanvases();
        
        // 恢复Three.js视图
        this.renderer.showThreeJSViews();
    }
}