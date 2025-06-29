/**
 * 历史管理器 - 处理撤回/重做功能
 */
class HistoryManager {
    constructor(app) {
        this.app = app;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;
    }

    saveState() {
        const state = this.app.workspace.map(x => x.map(y => [...y]));
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    restoreFromState(state) {
        this.app.workspace = state.map(x => x.map(y => [...y]));
        this.app.blocks.clear();
        
        for (let x = 0; x < this.app.workspaceSize; x++) {
            for (let y = 0; y < this.app.workspaceSize; y++) {
                for (let z = 0; z < this.app.workspaceSize; z++) {
                    if (this.app.workspace[x][y][z]) {
                        this.app.blockManager.createBlockDirect(x, y, z);
                    }
                }
            }
        }
        this.app.sceneManager.updateAllScenes();
        this.app.levelManager.onBlockChange();
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentState = this.app.workspace.map(x => x.map(y => [...y]));
        this.redoStack.push(currentState);
        
        const previousState = this.undoStack.pop();
        this.restoreFromState(previousState);
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentState = this.app.workspace.map(x => x.map(y => [...y]));
        this.undoStack.push(currentState);
        
        const nextState = this.redoStack.pop();
        this.restoreFromState(nextState);
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
}