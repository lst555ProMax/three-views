/**
 * UI管理器 - 处理界面更新和用户交互反馈
 */
class UIManager {
    constructor(app) {
        this.app = app;
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

    initializeUI() {
        // 初始化视图标签和按钮状态
        this.updateViewLabel('front', 'front');
        this.updateViewLabel('side', 'right');
        this.updateViewLabel('top', 'top');
        this.updateModeButtons('free');
    }

    updateViewLabelsForMode(isLevelMode) {
        this.updateViewLabel('front', this.app.orthographicViews.front, isLevelMode);
        this.updateViewLabel('side', this.app.orthographicViews.side, isLevelMode);
        this.updateViewLabel('top', this.app.orthographicViews.top, isLevelMode);
    }
}