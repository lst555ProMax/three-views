/**
 * 相机管理器 - 处理相机创建、控制和动画
 */
class CameraManager {
    constructor(app) {
        this.app = app;
        this.lookAtTarget = new THREE.Vector3(0, 0, 0); // 动态视觉中心
    }

    setupCameras() {
        const views = ['perspective', 'front', 'side', 'top'];
        
        views.forEach(viewName => {
            const container = document.getElementById(`${viewName}-view`);
            const width = container.clientWidth;
            const height = container.clientHeight;

            if (viewName === 'perspective') {
                this.app.cameras[viewName] = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
                const distance = this.app.workspaceSize;
                this.app.cameras[viewName].position.set(distance, distance, distance);
            } else {
                const viewSize = this.app.workspaceSize / 2; 
                this.app.cameras[viewName] = new THREE.OrthographicCamera(-viewSize, viewSize, viewSize, -viewSize, 0.1, 1000);
                this.setCameraPosition(viewName);
                const direction = this.app.orthographicViews[viewName];
                const upVectors = {
                    front: [0, 1, 0], back: [0, 1, 0],
                    right: [0, 1, 0], left: [0, 1, 0],
                    top: [0, 0, -1], bottom: [0, 0, 1]
                };
                this.app.cameras[viewName].up.set(...upVectors[direction]);
            }
            this.app.cameras[viewName].lookAt(this.lookAtTarget);
        });
    }

    setCameraPosition(viewName) {
        const distance = this.app.workspaceSize;
        const direction = this.app.orthographicViews[viewName];
        const positions = {
            front: [0, 0, distance], back: [0, 0, -distance],
            right: [distance, 0, 0], left: [-distance, 0, 0],
            top: [0, distance, 0], bottom: [0, -distance, 0]
        };
        this.app.cameras[viewName].position.set(...positions[direction]);
    }

    updateOrthographicView(viewName, direction) {
        const distance = this.app.workspaceSize;
        const positions = {
            front: [0, 0, distance], back: [0, 0, -distance],
            right: [distance, 0, 0], left: [-distance, 0, 0],
            top: [0, distance, 0], bottom: [0, -distance, 0]
        };
        const upVectors = {
            front: [0, 1, 0], back: [0, 1, 0],
            right: [0, 1, 0], left: [0, 1, 0],
            top: [0, 0, -1], bottom: [0, 0, 1]
        };
        
        this.app.cameras[viewName].position.set(...positions[direction]);
        this.app.cameras[viewName].up.set(...upVectors[direction]);
        this.app.cameras[viewName].lookAt(this.lookAtTarget);
    }

    rotateCamera(deltaX, deltaY) {
        const camera = this.app.cameras.perspective;
        const spherical = new THREE.Spherical();
        const offset = new THREE.Vector3();
        
        // 计算相机相对于视觉中心的偏移量
        offset.copy(camera.position).sub(this.lookAtTarget);
        spherical.setFromVector3(offset);
        
        spherical.theta -= deltaX;
        spherical.phi += deltaY;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        offset.setFromSpherical(spherical);
        camera.position.copy(this.lookAtTarget).add(offset);
        camera.lookAt(this.lookAtTarget);
    }

    zoomCamera(delta) {
        const camera = this.app.cameras.perspective;
        // 计算相机到视觉中心的距离
        const offset = new THREE.Vector3().copy(camera.position).sub(this.lookAtTarget);
        const distance = offset.length();
        const newDistance = Math.max(3, Math.min(20, distance + delta * distance));
        
        // 保持方向，只改变距离
        const direction = offset.normalize();
        camera.position.copy(this.lookAtTarget).add(direction.multiplyScalar(newDistance));
        camera.lookAt(this.lookAtTarget);
    }

    moveCamera(direction) {
        const camera = this.app.cameras.perspective;
        const moveSpeed = 0.5;
        
        // 设置移动边界（基于工作空间大小）
        const boundary = this.app.workspaceSize * 1.5;
        
        // 获取相机的前、右、上方向向量
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        
        camera.getWorldDirection(forward);
        right.crossVectors(forward, up).normalize();
        
        const moveVector = new THREE.Vector3();
        
        switch(direction) {
            case 'forward':
                moveVector.copy(forward).multiplyScalar(moveSpeed);
                break;
            case 'backward':
                moveVector.copy(forward).multiplyScalar(-moveSpeed);
                break;
            case 'left':
                moveVector.copy(right).multiplyScalar(-moveSpeed);
                break;
            case 'right':
                moveVector.copy(right).multiplyScalar(moveSpeed);
                break;
            case 'up':
                moveVector.set(0, moveSpeed, 0);
                break;
            case 'down':
                moveVector.set(0, -moveSpeed, 0);
                break;
        }
        
        // 计算新位置
        const newCameraPos = new THREE.Vector3().copy(camera.position).add(moveVector);
        const newLookAtTarget = new THREE.Vector3().copy(this.lookAtTarget).add(moveVector);
        
        // 检查边界限制
        if (Math.abs(newLookAtTarget.x) <= boundary && 
            Math.abs(newLookAtTarget.y) <= boundary && 
            Math.abs(newLookAtTarget.z) <= boundary) {
            
            camera.position.copy(newCameraPos);
            this.lookAtTarget.copy(newLookAtTarget);
            camera.lookAt(this.lookAtTarget);
        }
    }

    rotateAroundCenter(direction) {
        const camera = this.app.cameras.perspective;
        const rotateSpeed = 0.1;
        
        // 以当前视觉中心为中心旋转相机
        const offset = new THREE.Vector3();
        offset.copy(camera.position).sub(this.lookAtTarget);
        
        // 绕Y轴旋转
        const angle = direction === 'clockwise' ? -rotateSpeed : rotateSpeed;
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        
        camera.position.copy(this.lookAtTarget).add(offset);
        camera.lookAt(this.lookAtTarget);
    }

    setViewDirection(direction) {
        const camera = this.app.cameras.perspective;
        const distance = this.app.workspaceSize * 1.6;
        const corner_side = distance / Math.sqrt(3);
        
        const positions = {
            top: [0, distance, 0], bottom: [0, -distance, 0], front: [0, 0, distance], back: [0, 0, -distance],
            left: [-distance, 0, 0], right: [distance, 0, 0],
            corner1: [corner_side, corner_side, corner_side], corner2: [-corner_side, corner_side, corner_side], corner3: [corner_side, -corner_side, corner_side], corner4: [-corner_side, -corner_side, corner_side],
            corner5: [corner_side, corner_side, -corner_side], corner6: [-corner_side, corner_side, -corner_side], corner7: [corner_side, -corner_side, -corner_side], corner8: [-corner_side, -corner_side, -corner_side]
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
        
        // 更新视觉中心为原点（预设视图都是看向原点）
        this.lookAtTarget.set(0, 0, 0);
        
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