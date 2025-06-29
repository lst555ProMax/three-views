/**
 * 相机管理器 - 处理相机创建、控制和动画
 */
class CameraManager {
    constructor(app) {
        this.app = app;
    }

    setupCameras() {
        const views = ['perspective', 'front', 'side', 'top'];
        
        views.forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;

            if (viewName === 'perspective') {
                this.app.cameras[viewName] = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
                const distance = this.app.workspaceSize * 1.6;
                this.app.cameras[viewName].position.set(distance, distance, distance);
            } else {
                const viewSize = this.app.workspaceSize / 2 + 2;
                this.app.cameras[viewName] = new THREE.OrthographicCamera(-viewSize, viewSize, viewSize, -viewSize, 0.1, 1000);
                this.setCameraPosition(viewName);
            }
            this.app.cameras[viewName].lookAt(0, 0, 0);
        });
    }

    setCameraPosition(viewName) {
        const distance = this.app.workspaceSize * 1.6;
        const positions = {
            front: [0, 0, distance],
            side: [distance, 0, 0],
            top: [0, distance, 0]
        };
        this.app.cameras[viewName].position.set(...positions[viewName]);
    }

    rotateCamera(deltaX, deltaY) {
        const camera = this.app.cameras.perspective;
        const spherical = new THREE.Spherical();
        const offset = new THREE.Vector3();
        
        offset.copy(camera.position);
        spherical.setFromVector3(offset);
        
        spherical.theta -= deltaX;
        spherical.phi += deltaY;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        offset.setFromSpherical(spherical);
        camera.position.copy(offset);
        camera.lookAt(0, 0, 0);
    }

    zoomCamera(delta) {
        const camera = this.app.cameras.perspective;
        const distance = camera.position.length();
        const newDistance = Math.max(3, Math.min(20, distance + delta * distance));
        camera.position.normalize().multiplyScalar(newDistance);
        camera.lookAt(0, 0, 0);
    }

    setViewDirection(direction) {
        const camera = this.app.cameras.perspective;
        
        const positions = {
            top: [0, 10, 0], bottom: [0, -10, 0], front: [0, 0, 10], back: [0, 0, -10],
            left: [-10, 0, 0], right: [10, 0, 0],
            corner1: [8, 8, 8], corner2: [-8, 8, 8], corner3: [8, -8, 8], corner4: [-8, -8, 8],
            corner5: [8, 8, -8], corner6: [-8, 8, -8], corner7: [8, -8, -8], corner8: [-8, -8, -8]
        };
        
        const upVectors = {
            top: [0, 0, -1], bottom: [0, 0, 1], front: [0, 1, 0], back: [0, 1, 0],
            left: [0, 1, 0], right: [0, 1, 0],
            corner1: [0, 1, 0], corner2: [0, 1, 0], corner3: [0, 1, 0], corner4: [0, 1, 0],
            corner5: [0, 1, 0], corner6: [0, 1, 0], corner7: [0, 1, 0], corner8: [0, 1, 0]
        };
        
        const startCamera = camera.clone();
        const endCamera = camera.clone();
        endCamera.position.set(...positions[direction]);
        endCamera.up.set(...upVectors[direction]);
        endCamera.lookAt(0, 0, 0);
        
        const startQuaternion = startCamera.quaternion.clone();
        const endQuaternion = endCamera.quaternion.clone();
        const startPosition = startCamera.position.clone();
        const endPosition = endCamera.position.clone();
        
        const duration = 1000;
        const startTime = Date.now();
        
        const animateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            if (progress >= 1) {
                camera.position.copy(endPosition);
                camera.quaternion.copy(endQuaternion);
            } else {
                camera.position.lerpVectors(startPosition, endPosition, easeProgress);
                camera.quaternion.slerpQuaternions(startQuaternion, endQuaternion, easeProgress);
                requestAnimationFrame(animateCamera);
            }
        };
        
        animateCamera();
    }

    onWindowResize() {
        Object.keys(this.app.renderers).forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            if (this.app.cameras[viewName].isPerspectiveCamera) {
                this.app.cameras[viewName].aspect = width / height;
            }
            this.app.cameras[viewName].updateProjectionMatrix();
            this.app.renderers[viewName].setSize(width, height);
        });
    }
}