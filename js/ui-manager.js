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
        this.updateGravityButton(true);
        this.updateLayerControl(true);
        this.updateRenderButton('solid');
        this.updateColorPickerVisibility(true);
        this.updateLevelTypeVisibility(false);
        this.updateLevelTypeButtons('normal');
    }

    updateViewLabelsForMode(isLevelMode) {
        this.updateViewLabel('front', this.app.orthographicViews.front, isLevelMode);
        this.updateViewLabel('side', this.app.orthographicViews.side, isLevelMode);
        this.updateViewLabel('top', this.app.orthographicViews.top, isLevelMode);
    }

    updateGravityButton(gravityMode) {
        const gravityBtn = document.getElementById('gravity-toggle-btn');
        if (gravityBtn) {
            if (gravityMode) {
                gravityBtn.textContent = '重力生效';
                gravityBtn.style.background = '#007cba';
            } else {
                gravityBtn.textContent = '重力失效';
                gravityBtn.style.background = '#ff9800';
            }
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

    updateColorPickerVisibility(visible) {
        const colorPicker = document.getElementById('color-picker-control');
        if (colorPicker) {
            colorPicker.style.display = visible ? 'flex' : 'none';
        }
    }

    updateLevelTypeVisibility(visible) {
        const levelTypeControl = document.getElementById('level-type-control');
        if (levelTypeControl) {
            levelTypeControl.style.display = visible ? 'block' : 'none';
        }
    }

    updateLevelTypeButtons(activeType) {
        const normalBtn = document.getElementById('normal-level-btn');
        const colorBtn = document.getElementById('color-level-btn');
        
        if (normalBtn && colorBtn) {
            if (activeType === 'normal') {
                normalBtn.style.background = '#007cba';
                colorBtn.style.background = '#ccc';
            } else {
                normalBtn.style.background = '#ccc';
                colorBtn.style.background = '#9c27b0';
            }
        }
    }

    updateRenderButton(activeMode) {
        const renderBtn = document.getElementById('render-toggle-btn');
        if (renderBtn) {
            if (activeMode === 'solid') {
                renderBtn.textContent = '实心方块';
                renderBtn.style.background = '#007cba';
            } else if (activeMode === 'wireframe') {
                renderBtn.textContent = '描线方块';
                renderBtn.style.background = '#ff9800';
            } else if (activeMode === 'transparent') {
                renderBtn.textContent = '透明方块';
                renderBtn.style.background = '#9c27b0';
            }
        }
    }
}