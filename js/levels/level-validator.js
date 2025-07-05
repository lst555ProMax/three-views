/**
 * 关卡验证器 - 负责检查关卡完成状态
 */
class LevelValidator {
    constructor(app) {
        this.app = app;
    }

    checkCompletion(targetViews) {
        if (!targetViews) return false;
        const currentViews = this.generateCurrentViews();
        return this.compareViews(currentViews.front, targetViews.front) &&
               this.compareViews(currentViews.side, targetViews.side) &&
               this.compareViews(currentViews.top, targetViews.top);
    }

    compareViews(view1, view2) {
        if (!view1 || !view2) return false;
        for (let i = 0; i < view1.length; i++) {
            for (let j = 0; j < view1[i].length; j++) {
                if (view1[i][j] !== view2[i][j]) return false;
            }
        }
        return true;
    }

    generateCurrentViews() {
        // 使用renderer的统一方法
        return this.app.levelManager.renderer.generateProjection('current', 'boolean');
    }
}