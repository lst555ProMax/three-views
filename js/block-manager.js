/**
 * 方块管理器 - 处理方块创建、删除和坐标转换
 */
class BlockManager {
    constructor(app) {
        this.app = app;
    }

    // 将网格坐标转换为3D世界坐标
    gridToWorld(gridPos) {
        const half = this.app.workspaceSize / 2;
        return {
            x: gridPos.x - half + 0.5,
            y: gridPos.y - half + 0.5,
            z: gridPos.z - half + 0.5
        };
    }

    // 直接创建方块
    createBlockDirect(x, y, z) {
        const worldPos = this.gridToWorld({x, y, z});
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        let material, cube;
        
        if (this.app.renderMode === 'wireframe') {
            // 线框模式：显示边框 + 不可见碰撞体
            const edges = new THREE.EdgesGeometry(geometry);
            const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: this.app.blockColor, linewidth: 2 }));
            // 创建不可见的碰撞体用于射线检测
            const invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });
            cube = new THREE.Mesh(geometry, invisibleMaterial);
            cube.add(wireframe);
        } else if (this.app.renderMode === 'transparent') {
            // 透明模式：半透明实体
            material = new THREE.MeshLambertMaterial({ 
                color: this.app.blockColor, 
                transparent: true, 
                opacity: 0.5 
            });
            cube = new THREE.Mesh(geometry, material);
            const edges = new THREE.EdgesGeometry(geometry);
            const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: this.app.blockColor }));
            cube.add(wireframe);
        } else {
            // 实体模式：默认模式
            material = new THREE.MeshLambertMaterial({ color: this.app.blockColor });
            cube = new THREE.Mesh(geometry, material);
            const edges = new THREE.EdgesGeometry(geometry);
            const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            cube.add(wireframe);
        }
        
        cube.position.set(worldPos.x, worldPos.y, worldPos.z);
        cube.userData = { gridPos: {x, y, z} };
        
        this.app.blocks.add(cube);
    }

    // 完整创建流程
    createBlock(x, y, z) {
        // 双重检查：数据层和视图层都不存在才创建
        if (this.app.workspace[x][y][z]) return;
        const existingBlock = this.app.blocks.children.find(child => 
            child.userData.gridPos && 
            child.userData.gridPos.x === x &&
            child.userData.gridPos.y === y &&
            child.userData.gridPos.z === z
        );
        if (existingBlock) return;
        
        this.app.historyManager.saveState();   // 保存历史状态（回退重做）
        this.app.workspace[x][y][z] = true;  // 更新数据状态（数据层）
        this.createBlockDirect(x, y, z);  // 创建3D对象 （视图层）
        this.app.sceneManager.updateAllScenes(); // 更新所有场景（渲染层）
        this.app.levelManager.onBlockChange(); // 通知关卡系统（应用层）
    }

    addBlockAtXZ(x, z) {
        if (this.app.gravityMode) {
            this.createBlock(x, 0, z);
        } else {
            // 无重力模式：第0层不能编辑，其他层级UI层级-1为实际高度
            if (this.app.currentLayer > 0) {
                this.addBlockAtLayer(x, this.app.currentLayer - 1, z);
            }
        }
    }

    addBlockAtLayer(x, y, z) {
        this.createBlock(x, y, z);
    }

    removeBlockAtLayer(x, y, z) {
        // 强制删除：无论数据层状态如何，都清理该位置的所有方块
        this.app.historyManager.saveState();
        this.app.workspace[x][y][z] = false;
        
        // 删除所有相同位置的方块（防止重复方块）
        const blocksToRemove = this.app.blocks.children.filter(child => 
            child.userData.gridPos && 
            child.userData.gridPos.x === x &&
            child.userData.gridPos.y === y &&
            child.userData.gridPos.z === z
        );
        
        blocksToRemove.forEach(block => {
            this.app.blocks.remove(block);
        });
        
        if (blocksToRemove.length > 0) {
            this.app.sceneManager.updateAllScenes();
            this.app.levelManager.onBlockChange();
        }
    }

    // 在现有方块上添加
    addBlockAbove(x, y, z) {
        const newY = y + 1;
        if (newY >= this.app.workspaceSize || this.app.workspace[x][newY][z]) return;
        this.createBlock(x, newY, z);
    }

    // 检查是否为顶层方块
    isTopBlock(x, y, z) {
        for (let checkY = y + 1; checkY < this.app.workspaceSize; checkY++) {
            if (this.app.workspace[x][checkY][z]) {
                return false;
            }
        }
        return true;
    }

    // 删除顶层方块
    removeTopBlock(x, z) {
        let topY = -1;
        for (let y = this.app.workspaceSize - 1; y >= 0; y--) {
            if (this.app.workspace[x][y][z]) {
                topY = y;
                break;
            }
        }
        
        if (topY >= 0) {
            this.app.historyManager.saveState();
            this.app.workspace[x][topY][z] = false;  //  更新数据状态
            const blockToRemove = this.app.blocks.children.find(child => 
                child.userData.gridPos && 
                child.userData.gridPos.x === x &&
                child.userData.gridPos.y === topY &&
                child.userData.gridPos.z === z
            );
            
            if (blockToRemove) {
                this.app.blocks.remove(blockToRemove);  // block层
                this.app.sceneManager.updateAllScenes();  // 更新视图
                this.app.levelManager.onBlockChange();
            }
        }
    }

    // 清空工作空间
    clearWorkspace() {
        this.app.historyManager.saveState();
        this.app.workspace = this.app.createWorkspaceArray(this.app.workspaceSize);
        this.app.blocks.clear();
        this.app.sceneManager.updateAllScenes();
    }



    updateAllBlocksRender() {
        const blocks = [...this.app.blocks.children];
        blocks.forEach(block => {
            const gridPos = block.userData.gridPos;
            this.app.blocks.remove(block);
            this.createBlockDirect(gridPos.x, gridPos.y, gridPos.z);
        });
        this.app.sceneManager.updateAllScenes();
    }

    updateAllBlocksColor() {
        this.updateAllBlocksRender();
    }
}