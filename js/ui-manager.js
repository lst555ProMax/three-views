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
        this.updateGravityButtons(true);
        this.updateLayerControl(true);
        this.updateRenderButtons('solid');
    }

    updateViewLabelsForMode(isLevelMode) {
        this.updateViewLabel('front', this.app.orthographicViews.front, isLevelMode);
        this.updateViewLabel('side', this.app.orthographicViews.side, isLevelMode);
        this.updateViewLabel('top', this.app.orthographicViews.top, isLevelMode);
    }

    updateGravityButtons(gravityMode) {
        const gravityBtn = document.getElementById('gravity-mode-btn');
        const noGravityBtn = document.getElementById('no-gravity-mode-btn');
        
        if (gravityMode) {
            gravityBtn.style.background = '#007cba';
            noGravityBtn.style.background = '#ccc';
        } else {
            gravityBtn.style.background = '#ccc';
            noGravityBtn.style.background = '#ff9800';
        }
    }

    updateLayerControl(gravityMode) {
        const layerControl = document.getElementById('layer-control');
        layerControl.style.display = gravityMode ? 'none' : 'block';
        if (!gravityMode) {
            this.updateCurrentLayer(0);
        }
    }

    updateCurrentLayer(layer) {
        const currentLayerSpan = document.getElementById('current-layer');
        currentLayerSpan.textContent = layer;
    }

    updateRenderButtons(activeMode) {
        const solidBtn = document.getElementById('solid-render-btn');
        const wireframeBtn = document.getElementById('wireframe-render-btn');
        const transparentBtn = document.getElementById('transparent-render-btn');
        
        [solidBtn, wireframeBtn, transparentBtn].forEach(btn => {
            if (btn) btn.style.background = '#ccc';
        });
        
        if (activeMode === 'solid' && solidBtn) {
            solidBtn.style.background = '#007cba';
        } else if (activeMode === 'wireframe' && wireframeBtn) {
            wireframeBtn.style.background = '#ff9800';
        } else if (activeMode === 'transparent' && transparentBtn) {
            transparentBtn.style.background = '#9c27b0';
        }
    }
}