/**
 * 方块管理器 - 处理方块创建、删除和坐标转换
 */
class BlockManager {
    constructor(app) {
        this.app = app;
    }

    gridToWorld(gridPos) {
        const half = this.app.workspaceSize / 2;
        return {
            x: gridPos.x - half + 0.5,
            y: gridPos.y - half + 0.5,
            z: gridPos.z - half + 0.5
        };
    }

    createBlockDirect(x, y, z) {
        const worldPos = this.gridToWorld({x, y, z});
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        const cube = new THREE.Mesh(geometry, material);
        
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        
        cube.position.set(worldPos.x, worldPos.y, worldPos.z);
        cube.add(wireframe);
        cube.userData = { gridPos: {x, y, z} };
        
        this.app.blocks.add(cube);
    }

    createBlock(x, y, z) {
        this.app.historyManager.saveState();
        this.app.workspace[x][y][z] = true;
        this.createBlockDirect(x, y, z);
        this.app.sceneManager.updateAllScenes();
        this.app.levelManager.onBlockChange();
    }

    addBlockAtXZ(x, z) {
        let blockCount = 0;
        for (let y = 0; y < this.app.workspaceSize; y++) {
            if (this.app.workspace[x][y][z]) blockCount++;
        }
        if (blockCount >= this.app.workspaceSize) return;
        this.createBlock(x, blockCount, z);
    }

    addBlockAbove(x, y, z) {
        const newY = y + 1;
        if (newY >= this.app.workspaceSize || this.app.workspace[x][newY][z]) return;
        this.createBlock(x, newY, z);
    }

    isTopBlock(x, y, z) {
        for (let checkY = y + 1; checkY < this.app.workspaceSize; checkY++) {
            if (this.app.workspace[x][checkY][z]) {
                return false;
            }
        }
        return true;
    }

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
            this.app.workspace[x][topY][z] = false;
            const blockToRemove = this.app.blocks.children.find(child => 
                child.userData.gridPos && 
                child.userData.gridPos.x === x &&
                child.userData.gridPos.y === topY &&
                child.userData.gridPos.z === z
            );
            
            if (blockToRemove) {
                this.app.blocks.remove(blockToRemove);
                this.app.sceneManager.updateAllScenes();
                this.app.levelManager.onBlockChange();
            }
        }
    }

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