/**
 * 交互处理器 - 处理鼠标和键盘事件
 */
class InteractionHandler {
    constructor(app) {
        this.app = app;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
    }

    //  设置所有事件监听器
    setupControls() {
        const canvas = this.app.renderers.perspective.domElement;
        
        //  click是一次完整的点击 并且无拖拽
        canvas.addEventListener('click', (event) => {
            if (!this.isDragging) {
                this.onMouseClick(event);
            }
        });
        
        //  鼠标右键点击并且无拖拽
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (!this.isDragging) {
                this.onRightClick(event);
            }
        });
        
        //  鼠标按下
        canvas.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                this.isDragging = false;
                this.previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });
        
        //  鼠标移动
        canvas.addEventListener('mousemove', (event) => {
            if (event.buttons === 1) {
                const deltaMove = {
                    x: event.clientX - this.previousMousePosition.x,
                    y: event.clientY - this.previousMousePosition.y
                };
                
                if (Math.abs(deltaMove.x) > 3 || Math.abs(deltaMove.y) > 3) {
                    this.isDragging = true;
                    this.app.cameraManager.rotateCamera(deltaMove.x * 0.01, deltaMove.y * 0.01);
                }
                
                this.previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });
        
        //  鼠标松开
        canvas.addEventListener('mouseup', () => {
            setTimeout(() => { this.isDragging = false; }, 100);
        });
        
        //  鼠标滚轮
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.app.cameraManager.zoomCamera(event.deltaY * 0.001);
        });
        
        //  键盘操作
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                this.app.historyManager.undo();
            } else if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || 
                       (event.ctrlKey && event.key === 'y')) {
                event.preventDefault();
                this.app.historyManager.redo();
            } else if (!event.ctrlKey) {
                // 键盘相机控制
                switch(event.key) {
                    // WASD - 前后左右移动
                    case 'w':
                    case 'W':
                        event.preventDefault();
                        this.app.cameraManager.moveCamera('forward');
                        break;
                    case 's':
                    case 'S':
                        event.preventDefault();
                        this.app.cameraManager.moveCamera('backward');
                        break;
                    case 'a':
                    case 'A':
                        event.preventDefault();
                        this.app.cameraManager.moveCamera('left');
                        break;
                    case 'd':
                    case 'D':
                        event.preventDefault();
                        this.app.cameraManager.moveCamera('right');
                        break;
                    // 方向键 - 上下移动和旋转
                    case 'ArrowUp':
                        event.preventDefault();
                        this.app.cameraManager.moveCamera('up');
                        break;
                    case 'ArrowDown':
                        event.preventDefault();
                        this.app.cameraManager.moveCamera('down');
                        break;
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.app.cameraManager.rotateAroundCenter('clockwise');
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        this.app.cameraManager.rotateAroundCenter('counterclockwise');
                        break;
                    // 数字键 - 工作空间大小
                    case '3':
                        event.preventDefault();
                        this.app.changeWorkspaceSize(3);
                        document.getElementById('workspace-size').value = '3';
                        break;
                    case '4':
                        event.preventDefault();
                        this.app.changeWorkspaceSize(4);
                        document.getElementById('workspace-size').value = '4';
                        break;
                    case '5':
                        event.preventDefault();
                        this.app.changeWorkspaceSize(5);
                        document.getElementById('workspace-size').value = '5';
                        break;
                    case '6':
                        event.preventDefault();
                        this.app.changeWorkspaceSize(6);
                        document.getElementById('workspace-size').value = '6';
                        break;
                    case '7':
                        event.preventDefault();
                        this.app.changeWorkspaceSize(7);
                        document.getElementById('workspace-size').value = '7';
                        break;
                    case '8':
                        event.preventDefault();
                        this.app.changeWorkspaceSize(8);
                        document.getElementById('workspace-size').value = '8';
                        break;
                    case '9':
                        event.preventDefault();
                        this.app.changeWorkspaceSize(9);
                        document.getElementById('workspace-size').value = '9';
                        break;
                    // 视图切换快捷键
                    case 't':
                    case 'T':
                        event.preventDefault();
                        this.app.setViewDirection('top');
                        break;
                    case 'b':
                    case 'B':
                        event.preventDefault();
                        this.app.setViewDirection('bottom');
                        break;
                    case 'f':
                    case 'F':
                        event.preventDefault();
                        this.app.setViewDirection('front');
                        break;
                    case 'k':
                    case 'K':
                        event.preventDefault();
                        this.app.setViewDirection('back');
                        break;
                    case 'l':
                    case 'L':
                        event.preventDefault();
                        this.app.setViewDirection('left');
                        break;
                    case 'r':
                    case 'R':
                        event.preventDefault();
                        this.app.setViewDirection('right');
                        break;
                    // 角视图快捷键 (Numpad 1-8)
                    case '1':
                        event.preventDefault();
                        this.app.setViewDirection('corner1');
                        break;
                    case '2':
                        event.preventDefault();
                        this.app.setViewDirection('corner2');
                        break;
                    case 'q':
                    case 'Q':
                        event.preventDefault();
                        this.app.setViewDirection('corner3');
                        break;
                    case 'e':
                    case 'E':
                        event.preventDefault();
                        this.app.setViewDirection('corner4');
                        break;
                    case 'u':
                    case 'U':
                        event.preventDefault();
                        this.app.setViewDirection('corner5');
                        break;
                    case 'i':
                    case 'I':
                        event.preventDefault();
                        this.app.setViewDirection('corner6');
                        break;
                    case 'o':
                    case 'O':
                        event.preventDefault();
                        this.app.setViewDirection('corner7');
                        break;
                    case 'p':
                    case 'P':
                        event.preventDefault();
                        this.app.setViewDirection('corner8');
                        break;
                    // 清空工作区
                    case 'c':
                    case 'C':
                        event.preventDefault();
                        this.app.clearWorkspace();
                        break;
                    // 层级切换
                    case '+':
                    case '=':
                        event.preventDefault();
                        this.app.changeLayer(1);
                        break;
                    case '-':
                    case '_':
                        event.preventDefault();
                        this.app.changeLayer(-1);
                        break;
                }
            }
        });

        // 为正交视图添加右键切换功能
        ['front', 'side', 'top'].forEach(viewName => {
            const canvas = this.app.renderers[viewName].domElement;
            canvas.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                this.app.toggleOrthographicView(viewName);
            });
        });

        window.addEventListener('resize', () => this.app.cameraManager.onWindowResize());
    }

    //  设置射线
    setupRaycaster(event) {
        const rect = this.app.renderers.perspective.domElement.getBoundingClientRect();
        this.app.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.app.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.app.raycaster.setFromCamera(this.app.mouse, this.app.cameras.perspective);
    }

    onMouseClick(event) {
        if (this.isDragging) return;
        this.setupRaycaster(event);
        this.handleBlockInteraction('add');
    }

    onRightClick(event) {
        if (this.isDragging) return;
        this.setupRaycaster(event);
        this.handleBlockInteraction('remove');
    }

    handleBlockInteraction(action) {
        const blockGroup = this.findBlockGroup();
        const blockIntersects = blockGroup ? 
            this.app.raycaster.intersectObjects(blockGroup.children, true) : [];
        
        if (this.app.gravityMode) {
            this.handleGravityModeInteraction(action, blockIntersects);
        } else {
            this.handleNoGravityModeInteraction(action, blockIntersects);
        }
    }

    findBlockGroup() {
        return this.app.scenes.perspective.children.find(child => 
            child.type === 'Group' && child.children.some(c => 
                c.userData && c.userData.gridPos && !c.userData.isGroundPlane
            )
        );
    }

    findPlaceholderGroup() {
        return this.app.scenes.perspective.children.find(child => 
            child.type === 'Group' && child.children.length > 0 && 
            child.children[0].userData && child.children[0].userData.isGroundPlane
        );
    }

    isPointInBlock(intersectPoint, blockPos, tolerance = 0.5) {
        return Math.abs(intersectPoint.x - blockPos.x) <= tolerance &&
               Math.abs(intersectPoint.y - blockPos.y) <= tolerance &&
               Math.abs(intersectPoint.z - blockPos.z) <= tolerance;
    }

    getGridFromPlaneIntersect(intersectPoint) {
        const half = this.app.workspaceSize / 2;
        const gridX = Math.round(intersectPoint.x + half - 0.5);
        const gridZ = Math.round(intersectPoint.z + half - 0.5);
        
        if (gridX >= 0 && gridX < this.app.workspaceSize && 
            gridZ >= 0 && gridZ < this.app.workspaceSize) {
            return { x: gridX, z: gridZ };
        }
        return null;
    }

    handleGravityModeInteraction(action, blockIntersects) {
        // 先检查方块交互
        if (blockIntersects.length > 0) {
            for (let intersect of blockIntersects) {
                const block = intersect.object;
                if (block.userData && block.userData.gridPos) {
                    if (this.isPointInBlock(intersect.point, block.position)) {
                        const gridPos = block.userData.gridPos;
                        if (action === 'add') {
                            this.app.blockManager.addBlockAbove(gridPos.x, gridPos.y, gridPos.z);
                        } else if (this.app.blockManager.isTopBlock(gridPos.x, gridPos.y, gridPos.z)) {
                            this.app.blockManager.removeTopBlock(gridPos.x, gridPos.z);
                        }
                        return;
                    }
                }
            }
        }
        
        // 再检查平面交互（只有添加操作才检查平面）
        if (action === 'add') {
            const placeholderGroup = this.findPlaceholderGroup();
            const planeIntersects = placeholderGroup ? 
                this.app.raycaster.intersectObjects(placeholderGroup.children, false) : [];
            
            if (planeIntersects.length > 0) {
                const gridPos = this.getGridFromPlaneIntersect(planeIntersects[0].point);
                if (gridPos) {
                    this.app.blockManager.addBlockAtXZ(gridPos.x, gridPos.z);
                }
            }
        }
    }

    handleNoGravityModeInteraction(action, blockIntersects) {
        if (blockIntersects.length > 0 && this.app.currentLayer > 0) {
            const actualLayer = this.app.currentLayer - 1;
            
            for (let intersect of blockIntersects) {
                const block = intersect.object;
                if (block.userData && block.userData.gridPos && 
                    block.userData.gridPos.y === actualLayer) {
                    
                    if (this.isPointInBlock(intersect.point, block.position)) {
                        const gridPos = block.userData.gridPos;
                        if (action === 'remove') {
                            this.app.blockManager.removeBlockAtLayer(gridPos.x, gridPos.y, gridPos.z);
                        }
                        // 添加操作下点击当前层方块不做任何操作
                        return;
                    }
                }
            }
        }
        
        // 没有击中当前层方块，检查平面（只有添加操作）
        if (action === 'add') {
            const placeholderGroup = this.findPlaceholderGroup();
            const planeIntersects = placeholderGroup ? 
                this.app.raycaster.intersectObjects(placeholderGroup.children, false) : [];
            
            if (planeIntersects.length > 0) {
                const gridPos = this.getGridFromPlaneIntersect(planeIntersects[0].point);
                if (gridPos) {
                    this.app.blockManager.addBlockAtXZ(gridPos.x, gridPos.z);
                }
            }
        }
    }
}