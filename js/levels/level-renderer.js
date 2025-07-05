/**
 * 关卡渲染器 - 负责渲染关卡视图和Canvas绘制
 */
class LevelRenderer {
    constructor(app) {
        this.app = app;
        this.levelCanvases = {};
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

    updateLevelViews(targetViews) {
        if (!targetViews) return;
        
        const isColorMode = this.app.levelType === 'color';
        const size = this.app.workspaceSize;
        
        // 获取数据
        const targetData = isColorMode ? this.generateTargetCounts() : targetViews;
        const currentData = isColorMode ? this.generateCurrentCounts() : this.generateCurrentViews();
        
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
                    
                    // 绘制背景网格
                    ctx.strokeStyle = '#ddd';
                    ctx.strokeRect(x, y, cellSize, cellSize);
                    
                    if (isColorMode) {
                        this.drawColorCell(ctx, x, y, cellSize, targetData, currentData, viewName, row, col);
                    } else {
                        this.drawNormalCell(ctx, x, y, cellSize, targetData, currentData, viewName, row, col);
                    }
                }
            }
        });
    }

    drawNormalCell(ctx, x, y, cellSize, targetViews, currentViews, viewName, row, col) {
        const targetHas = targetViews[viewName][row] && targetViews[viewName][row][col];
        const currentHas = currentViews[viewName][row] && currentViews[viewName][row][col];
        
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

    drawColorCell(ctx, x, y, cellSize, targetCounts, currentCounts, viewName, row, col) {
        const targetCount = targetCounts[viewName][row] ? targetCounts[viewName][row][col] : 0;
        const currentCount = currentCounts[viewName][row] ? currentCounts[viewName][row][col] : 0;
        
        let fillColor;
        if (currentCount > targetCount) {
            // 过多：红色
            fillColor = 'rgba(244, 67, 54, 0.8)';
        } else if (currentCount === targetCount) {
            // 正确：绿色
            fillColor = 'rgba(76, 175, 80, 0.8)';
        } else if (targetCount > 0) {
            // 不足：根据差值显示颜色
            const diff = targetCount - currentCount;
            fillColor = this.getStackColor(diff);
        } else {
            // 目标为0但当前不为0：不显示颜色，只显示网格
            fillColor = null;
        }
        
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
        
        // 显示数字（只在目标不为0或当前不为0时显示）
        if (targetCount > 0 || currentCount > 0) {
            ctx.fillStyle = '#000';
            ctx.font = `${cellSize * 0.3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${currentCount}/${targetCount}`, x + cellSize/2, y + cellSize/2);
        }
    }

    getStackColor(stackCount) {
        // 根据堆叠数量返回颜色
        const colors = [
            'rgba(255, 255, 255, 0.8)',  // 0: 白色
            'rgba(255, 235, 59, 0.8)',   // 1: 黄色
            'rgba(255, 152, 0, 0.8)',    // 2: 橙色
            'rgba(156, 39, 176, 0.8)',   // 3: 紫色
            'rgba(63, 81, 181, 0.8)',    // 4: 蓝色
            'rgba(0, 150, 136, 0.8)',    // 5: 青色
            'rgba(121, 85, 72, 0.8)',    // 6: 棕色
            'rgba(96, 125, 139, 0.8)'    // 7+: 灰色
        ];
        return colors[Math.min(stackCount, colors.length - 1)];
    }

    generateCurrentViews() {
        return this.generateProjection('current', 'boolean');
    }

    generateTargetViews() {
        return this.generateProjection('target', 'boolean');
    }

    generateTargetCounts() {
        return this.generateProjection('target', 'count');
    }

    generateCurrentCounts() {
        return this.generateProjection('current', 'count');
    }

    generateProjection(source, type) {
        const size = this.app.workspaceSize;
        const result = { front: [], side: [], top: [] };
        const isTarget = source === 'target';
        const targetModel = isTarget ? this.app.levelManager.targetModel : null;
        const isCount = type === 'count';
        
        // 检查方块是否存在的函数
        const hasBlock = (x, y, z) => {
            if (isTarget) {
                if (this.app.gravityMode) {
                    return targetModel[x][z] > y;
                } else {
                    return targetModel[x][y][z];
                }
            } else {
                return this.app.workspace[x][y][z];
            }
        };

        // 视图配置：[viewName, outerAxis, innerAxis, projectionAxis, outerReverse, innerReverse]
        const viewConfigs = [
            ['front', 'y', 'x', 'z', true, false],   // 正视图: Y-X平面，投影Z轴
            ['side', 'y', 'z', 'x', true, true],     // 右视图: Y-Z平面，投影X轴
            ['top', 'z', 'x', 'y', false, false]     // 俯视图: Z-X平面，投影Y轴
        ];

        viewConfigs.forEach(([viewName, outerAxis, innerAxis, projAxis, outerReverse, innerReverse]) => {
            const outerRange = outerReverse ? 
                Array.from({length: size}, (_, i) => size - 1 - i) : 
                Array.from({length: size}, (_, i) => i);
            const innerRange = innerReverse ? 
                Array.from({length: size}, (_, i) => size - 1 - i) : 
                Array.from({length: size}, (_, i) => i);

            outerRange.forEach((outerVal, outerIdx) => {
                result[viewName][outerIdx] = [];
                innerRange.forEach((innerVal, innerIdx) => {
                    // 俯视图在重力模式下的特殊处理
                    if (viewName === 'top' && isTarget && this.app.gravityMode && isCount) {
                        result[viewName][outerIdx][innerIdx] = targetModel[innerVal][outerVal];
                    } else {
                        let count = 0;
                        let hasAnyBlock = false;
                        
                        for (let projVal = 0; projVal < size; projVal++) {
                            const coords = {};
                            coords[outerAxis] = outerVal;
                            coords[innerAxis] = innerVal;
                            coords[projAxis] = projVal;
                            
                            if (hasBlock(coords.x, coords.y, coords.z)) {
                                if (isCount) {
                                    count++;
                                } else {
                                    hasAnyBlock = true;
                                    break;
                                }
                            }
                        }
                        
                        result[viewName][outerIdx][innerIdx] = isCount ? count : hasAnyBlock;
                    }
                });
            });
        });

        return result;
    }

    clearCanvases() {
        Object.values(this.levelCanvases).forEach(canvas => {
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });
        this.levelCanvases = {};
    }
}