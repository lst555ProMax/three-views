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
        
        // 创建方块几何体和材质
        const geometry = new THREE.BoxGeometry(1, 1, 1); // 几何体
        const material = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });  // 材质
        const cube = new THREE.Mesh(geometry, material);
        
        // 创建边框线
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        
        // 设置位置和属性
        cube.position.set(worldPos.x, worldPos.y, worldPos.z);
        cube.add(wireframe);
        cube.userData = { gridPos: {x, y, z} };
        
        this.app.blocks.add(cube);
    }

    // 完整创建流程
    createBlock(x, y, z) {
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
            this.addBlockAtLayer(x, this.app.currentLayer, z);
        }
    }

    addBlockAtLayer(x, y, z) {
        if (this.app.workspace[x][y][z]) return;
        this.createBlock(x, y, z);
    }

    removeBlockAtLayer(x, y, z) {
        if (!this.app.workspace[x][y][z]) return;
        
        this.app.historyManager.saveState();
        this.app.workspace[x][y][z] = false;
        
        const blockToRemove = this.app.blocks.children.find(child => 
            child.userData.gridPos && 
            child.userData.gridPos.x === x &&
            child.userData.gridPos.y === y &&
            child.userData.gridPos.z === z
        );
        
        if (blockToRemove) {
            this.app.blocks.remove(blockToRemove);
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

    createWorkspaceArray(size) {
        return new Array(size).fill().map(() => new Array(size).fill().map(() => new Array(size).fill(false)));
    }
}