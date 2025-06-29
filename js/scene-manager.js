/**
 * 场景管理器 - 处理场景创建和渲染
 */
class SceneManager {
    constructor(app) {
        this.app = app;
    }

    setupScenes() {
        const views = ['perspective', 'front', 'side', 'top'];
        
        views.forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;

            this.app.scenes[viewName] = new THREE.Scene();
            this.app.scenes[viewName].background = new THREE.Color(0xf8f8f8);

            this.app.renderers[viewName] = new THREE.WebGLRenderer({ antialias: true });
            this.app.renderers[viewName].setSize(width, height);
            container.appendChild(this.app.renderers[viewName].domElement);

            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            this.app.scenes[viewName].add(ambientLight, directionalLight);
        });
    }

    addToAllScenes() {
        Object.keys(this.app.scenes).forEach(viewName => {
            this.app.scenes[viewName].add(this.app.gridLines.clone());
            this.app.scenes[viewName].add(this.app.placeholders.clone());
            this.app.scenes[viewName].add(this.app.blocks.clone());
            if (viewName === 'perspective') {
                this.app.scenes[viewName].add(this.app.axisHelper.clone());
            }
        });
    }

    updateAllScenes() {
        Object.keys(this.app.scenes).forEach(viewName => {
            const oldBlocks = this.app.scenes[viewName].children.filter(child => 
                child.type === 'Group' && child.children.some(c => c.userData && c.userData.gridPos && !c.userData.isPlaceholder)
            );
            oldBlocks.forEach(group => this.app.scenes[viewName].remove(group));
            this.app.scenes[viewName].add(this.app.blocks.clone());
        });
    }

    clearAllScenes() {
        Object.keys(this.app.scenes).forEach(viewName => {
            this.app.scenes[viewName].clear();
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            this.app.scenes[viewName].add(ambientLight, directionalLight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        Object.keys(this.app.renderers).forEach(viewName => {
            this.app.renderers[viewName].render(this.app.scenes[viewName], this.app.cameras[viewName]);
        });
    }
}