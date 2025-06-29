/**
 * 关卡管理器 - 处理关卡生成和验证
 */
class LevelManager {
    constructor(app) {
        this.app = app;
        this.targetModel = null;
        this.targetViews = null;
        this.levelCanvases = {};
        this.isLevelMode = false;
    }

    generateLevel() {
        this.app.clearWorkspace();
        this.targetModel = this.generateRandomModel();
        this.targetViews = this.generateTargetViews();
        this.isLevelMode = true;
        this.hideThreeJSViews();
        this.createLevelCanvases();
        this.updateLevelViews();
    }

    generateRandomModel() {
        const size = this.app.workspaceSize;
        const model = [];
        
        for (let x = 0; x < size; x++) {
            model[x] = [];
            for (let z = 0; z < size; z++) {
                let height = 0;
                const rand = Math.random();
                if (rand < 0.25) {
                    height = 0;
                } else {
                    // 指数分布：缓慢下降，低高度概率更大
                    const exponential = -Math.log(Math.random()) * 0.99;
                    height = Math.min(size, Math.floor(exponential) + 1);
                }
                model[x][z] = height;
            }
        }
        
        return model;
    }

    generateTargetViews() {
        const size = this.app.workspaceSize;
        const views = { front: [], side: [], top: [] };

        // 正视图 (X-Y)
        for (let y = size - 1; y >= 0; y--) {
            views.front[size - 1 - y] = [];
            for (let x = 0; x < size; x++) {
                let hasBlock = false;
                for (let z = 0; z < size; z++) {
                    if (this.targetModel[x][z] > y) {
                        hasBlock = true;
                        break;
                    }
                }
                views.front[size - 1 - y][x] = hasBlock;
            }
        }

        // 右视图 (Z-Y，从右侧看)
        for (let y = size - 1; y >= 0; y--) {
            views.side[size - 1 - y] = [];
            for (let z = size - 1; z >= 0; z--) {
                let hasBlock = false;
                for (let x = 0; x < size; x++) {
                    if (this.targetModel[x][z] > y) {
                        hasBlock = true;
                        break;
                    }
                }
                views.side[size - 1 - y][size - 1 - z] = hasBlock;
            }
        }

        // 俯视图 (X-Z)
        for (let z = 0; z < size; z++) {
            views.top[z] = [];
            for (let x = 0; x < size; x++) {
                views.top[z][x] = this.targetModel[x][z] > 0;
            }
        }

        return views;
    }

    hideThreeJSViews() {
        const viewNames = ['front', 'side', 'top'];
        viewNames.forEach(viewName => {
            const canvas = this.app.renderers[viewName].domElement;
            canvas.style.display = 'none';
        });
    }

    showThreeJSViews() {
        const viewNames = ['front', 'side', 'top'];
        viewNames.forEach(viewName => {
            const canvas = this.app.renderers[viewName].domElement;
            canvas.style.display = 'block';
        });
    }

    createLevelCanvases() {
        const viewNames = ['front', 'side', 'top'];
        
        viewNames.forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            
            // 移除旧的canvas
            const oldCanvas = container.querySelector('.level-canvas');
            if (oldCanvas) oldCanvas.remove();
            
            // 创建新的canvas
            const canvas = document.createElement('canvas');
            canvas.className = 'level-canvas';
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '5';
            
            container.appendChild(canvas);
            this.levelCanvases[viewName] = canvas;
        });
    }

    updateLevelViews() {
        if (!this.targetViews || !this.isLevelMode) return;
        
        const currentViews = this.generateCurrentViews();
        const size = this.app.workspaceSize;
        
        Object.keys(this.levelCanvases).forEach(viewName => {
            const canvas = this.levelCanvases[viewName];
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const cellSize = Math.min(canvas.width / size, canvas.height / size) * 0.9;
            const offsetX = (canvas.width - cellSize * size) / 2;
            const offsetY = (canvas.height - cellSize * size) / 2;
            
            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    const x = offsetX + col * cellSize;
                    const y = offsetY + row * cellSize;
                    
                    const targetHas = this.targetViews[viewName][row] && this.targetViews[viewName][row][col];
                    const currentHas = currentViews[viewName][row] && currentViews[viewName][row][col];
                    
                    // 绘制背景网格
                    ctx.strokeStyle = '#ddd';
                    ctx.strokeRect(x, y, cellSize, cellSize);
                    
                    // 绘制目标背景
                    if (targetHas) {
                        ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
                        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    }
                    
                    // 绘制匹配状态
                    if (targetHas && currentHas) {
                        ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
                        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    } else if (!targetHas && currentHas) {
                        ctx.fillStyle = 'rgba(244, 67, 54, 0.8)';
                        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    }
                }
            }
        });
    }

    generateCurrentViews() {
        const size = this.app.workspaceSize;
        const views = { front: [], side: [], top: [] };

        // 正视图
        for (let y = size - 1; y >= 0; y--) {
            views.front[size - 1 - y] = [];
            for (let x = 0; x < size; x++) {
                let hasBlock = false;
                for (let z = 0; z < size; z++) {
                    if (this.app.workspace[x][y][z]) {
                        hasBlock = true;
                        break;
                    }
                }
                views.front[size - 1 - y][x] = hasBlock;
            }
        }

        // 右视图
        for (let y = size - 1; y >= 0; y--) {
            views.side[size - 1 - y] = [];
            for (let z = size - 1; z >= 0; z--) {
                let hasBlock = false;
                for (let x = 0; x < size; x++) {
                    if (this.app.workspace[x][y][z]) {
                        hasBlock = true;
                        break;
                    }
                }
                views.side[size - 1 - y][size - 1 - z] = hasBlock;
            }
        }

        // 俯视图
        for (let z = 0; z < size; z++) {
            views.top[z] = [];
            for (let x = 0; x < size; x++) {
                let hasBlock = false;
                for (let y = 0; y < size; y++) {
                    if (this.app.workspace[x][y][z]) {
                        hasBlock = true;
                        break;
                    }
                }
                views.top[z][x] = hasBlock;
            }
        }

        return views;
    }

    checkCompletion() {
        if (!this.targetViews) return false;
        const currentViews = this.generateCurrentViews();
        return this.compareViews(currentViews.front, this.targetViews.front) &&
               this.compareViews(currentViews.side, this.targetViews.side) &&
               this.compareViews(currentViews.top, this.targetViews.top);
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

    onBlockChange() {
        if (this.isLevelMode) {
            this.updateLevelViews();
            if (this.checkCompletion()) {
                alert('恭喜！关卡完成！');
            }
        }
    }

    clearLevel() {
        this.targetModel = null;
        this.targetViews = null;
        this.isLevelMode = false;
        
        // 清理canvas
        Object.values(this.levelCanvases).forEach(canvas => {
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });
        this.levelCanvases = {};
        
        // 恢复Three.js视图
        this.showThreeJSViews();
    }
}