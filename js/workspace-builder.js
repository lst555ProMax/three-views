/**
 * 工作空间构建器 - 创建网格线、坐标轴和占位符
 */
/*
! gridLines是网格线  placeholders是交互平面   axisHelper是坐标轴
 */
class WorkspaceBuilder {
    constructor(app) {
        this.app = app;
    }

    createGridLines() {
        this.app.gridLines = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xcccccc, 
            opacity: 0.4, 
            transparent: true 
        });
        
        const half = this.app.workspaceSize / 2;
        const gridCount = this.app.workspaceSize + 1;
        
        // 网格面配置：[planeName, fixedAxis, fixedValue, axis1, axis2]
        const gridConfigs = [
            ['bottom', 'y', -half, 'x', 'z'],  // 底面：Y固定在-half，X和Z变化
            ['left', 'x', -half, 'y', 'z'],    // 左面：X固定在-half，Y和Z变化
            ['back', 'z', -half, 'x', 'y']     // 后面：Z固定在-half，X和Y变化
        ];
        
        gridConfigs.forEach(([planeName, fixedAxis, fixedValue, axis1, axis2]) => {
            this.createGridPlane(lineMaterial, half, gridCount, fixedAxis, fixedValue, axis1, axis2);
        });
    }

    createGridPlane(material, half, gridCount, fixedAxis, fixedValue, axis1, axis2) {
        // 沿着axis1方向的线
        for (let i = 0; i < gridCount; i++) {
            const start = new THREE.Vector3();
            const end = new THREE.Vector3();
            
            start[fixedAxis] = fixedValue;
            end[fixedAxis] = fixedValue;
            start[axis1] = i - half;
            end[axis1] = i - half;
            start[axis2] = -half;
            end[axis2] = half;
            
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            this.app.gridLines.add(new THREE.Line(geometry, material));
        }
        
        // 沿着axis2方向的线
        for (let i = 0; i < gridCount; i++) {
            const start = new THREE.Vector3();
            const end = new THREE.Vector3();
            
            start[fixedAxis] = fixedValue;
            end[fixedAxis] = fixedValue;
            start[axis1] = -half;
            end[axis1] = half;
            start[axis2] = i - half;
            end[axis2] = i - half;
            
            const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            this.app.gridLines.add(new THREE.Line(geometry, material));
        }
    }

    createPlaceholders() {
        this.app.placeholders = new THREE.Group();
        this.updatePlaceholders();
    }

    updatePlaceholders() {
        this.app.placeholders.clear();
        
        if (this.app.gravityMode) {
            // 重力模式：只有底面平面
            const planeGeometry = new THREE.PlaneGeometry(this.app.workspaceSize, this.app.workspaceSize);
            const planeMaterial = new THREE.MeshBasicMaterial({ 
                transparent: true, 
                opacity: 0,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.position.set(0, -this.app.workspaceSize / 2, 0);
            plane.userData = { isGroundPlane: true, layer: 0 };
            this.app.placeholders.add(plane);
        } else {
            // 无重力模式：只为非0层创建平面
            if (this.app.currentLayer > 0) {
                const y = this.app.currentLayer - 1; // UI层级转为实际高度
                const planeGeometry = new THREE.PlaneGeometry(this.app.workspaceSize, this.app.workspaceSize);
                const planeMaterial = new THREE.MeshBasicMaterial({ 
                    transparent: true, 
                    opacity: 0.1,
                    color: 0x0066ff,
                    side: THREE.DoubleSide
                });
                
                const plane = new THREE.Mesh(planeGeometry, planeMaterial);
                plane.rotation.x = -Math.PI / 2;
                const worldY = y - this.app.workspaceSize / 2;
                plane.position.set(0, worldY, 0);
                plane.userData = { isGroundPlane: true, layer: y };
                
                // 为当前层平面添加网格线
                const gridGroup = this.createLayerGrid(worldY, 0x0066ff, 0.3);
                
                this.app.placeholders.add(plane);
                if (gridGroup) this.app.placeholders.add(gridGroup);
            }
        }
        
        this.app.sceneManager.updatePlaceholders();
    }

    createAxisHelper() {
        this.app.axisHelper = new THREE.Group();
        
        const half = this.app.workspaceSize / 2;
        const arrowPos = half + 0.5;
        
        // 轴配置：[axisName, color, endPos, rotation]
        const axisConfigs = [
            ['X', 0xff0000, [arrowPos, -half, -half], [0, 0, -Math.PI / 2]],
            ['Y', 0x00ff00, [-half, arrowPos, -half], [0, 0, 0]],
            ['Z', 0x0000ff, [-half, -half, arrowPos], [Math.PI / 2, 0, 0]]
        ];
        
        axisConfigs.forEach(([axisName, color, endPos, rotation]) => {
            this.createAxis(half, color, endPos, rotation);
        });
        
        this.createAxisLabels();
    }

    createAxis(half, color, endPos, rotation) {
        // 创建轴线
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-half, -half, -half),
            new THREE.Vector3(...endPos)
        ]);
        const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color, linewidth: 3 }));
        this.app.axisHelper.add(line);
        
        // 创建箭头
        const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const arrow = new THREE.Mesh(arrowGeometry, new THREE.MeshBasicMaterial({ color }));
        arrow.position.set(...endPos);
        if (rotation[0]) arrow.rotateX(rotation[0]);
        if (rotation[1]) arrow.rotateY(rotation[1]);
        if (rotation[2]) arrow.rotateZ(rotation[2]);
        this.app.axisHelper.add(arrow);
    }

    createLayerGrid(yPosition, color, opacity) {
        const gridGroup = new THREE.Group();
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color, 
            opacity, 
            transparent: true 
        });
        
        const half = this.app.workspaceSize / 2;
        const gridCount = this.app.workspaceSize + 1;
        
        // X方向的线
        for (let x = 0; x < gridCount; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - half, yPosition, -half),
                new THREE.Vector3(x - half, yPosition, half)
            ]);
            gridGroup.add(new THREE.Line(geometry, gridMaterial));
        }
        
        // Z方向的线
        for (let z = 0; z < gridCount; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-half, yPosition, z - half),
                new THREE.Vector3(half, yPosition, z - half)
            ]);
            gridGroup.add(new THREE.Line(geometry, gridMaterial));
        }
        
        return gridGroup;
    }

    createAxisLabels() {
        const half = this.app.workspaceSize / 2;
        const labelPos = half + 0.9;
        const labels = [
            { text: 'X', color: '#ff0000', position: [labelPos, -half, -half] },
            { text: 'Y', color: '#00ff00', position: [-half, labelPos, -half] },
            { text: 'Z', color: '#0000ff', position: [-half, -half, labelPos] }
        ];
        
        labels.forEach(({ text, color, position }) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 64;
            context.font = '48px Arial';
            context.fillStyle = color;
            context.textAlign = 'center';
            context.fillText(text, 32, 40);
            
            const texture = new THREE.CanvasTexture(canvas);  // * 转换为Three.js纹理
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));  // 创建精灵（始终面向相机的2D元素）
            sprite.position.set(...position);
            sprite.scale.set(0.5, 0.5, 1);
            this.app.axisHelper.add(sprite);
        });
    }

    buildAll() {
        this.createGridLines();  // 创建网格线
        this.createPlaceholders();  // 创建交互平面（底面）
        this.createAxisHelper();  // 创建坐标轴
    }
}