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
        
        const half = this.app.workspaceSize / 2;  // 工作空间的一半
        const gridCount = this.app.workspaceSize + 1;  // 网格线数量
        
        // 底面网格
        for (let x = 0; x < gridCount; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - half, -half, -half),
                new THREE.Vector3(x - half, -half, half)
            ]);
            this.app.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        for (let z = 0; z < gridCount; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-half, -half, z - half),
                new THREE.Vector3(half, -half, z - half)
            ]);
            this.app.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        
        // 左面网格
        for (let y = 0; y < gridCount; y++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-half, y - half, -half),
                new THREE.Vector3(-half, y - half, half)
            ]);
            this.app.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        for (let z = 0; z < gridCount; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-half, -half, z - half),
                new THREE.Vector3(-half, half, z - half)
            ]);
            this.app.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        
        // 后面网格
        for (let x = 0; x < gridCount; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - half, -half, -half),
                new THREE.Vector3(x - half, half, -half)
            ]);
            this.app.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
        for (let y = 0; y < gridCount; y++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-half, y - half, -half),
                new THREE.Vector3(half, y - half, -half)
            ]);
            this.app.gridLines.add(new THREE.Line(geometry, lineMaterial));
        }
    }

    createPlaceholders() {
        this.app.placeholders = new THREE.Group();
        
        const planeGeometry = new THREE.PlaneGeometry(this.app.workspaceSize, this.app.workspaceSize);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0,  //  完全透明
            visible: false,
            side: THREE.DoubleSide  //  双面检测，从上下都能点击
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;  //  旋转90°，从垂直变为水平
        plane.position.set(0, -this.app.workspaceSize / 2, 0);  //  放在三维立体底部
        plane.userData = { isGroundPlane: true };  // ?标记为地面平面
        
        this.app.placeholders.add(plane);
    }

    createAxisHelper() {
        this.app.axisHelper = new THREE.Group();
        
        const half = this.app.workspaceSize / 2;
        const arrowPos = half + 0.5;
        
        // X轴 - 红色
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-half, -half, -half),
            new THREE.Vector3(arrowPos, -half, -half)
        ]);
        const xLine = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }));
        this.app.axisHelper.add(xLine);
        
        const xArrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const xArrow = new THREE.Mesh(xArrowGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        xArrow.position.set(arrowPos, -half, -half);
        xArrow.rotateZ(-Math.PI / 2);
        this.app.axisHelper.add(xArrow);
        
        // Y轴 - 绿色
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-half, -half, -half),
            new THREE.Vector3(-half, arrowPos, -half)
        ]);
        const yLine = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }));
        this.app.axisHelper.add(yLine);
        
        const yArrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const yArrow = new THREE.Mesh(yArrowGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        yArrow.position.set(-half, arrowPos, -half);
        this.app.axisHelper.add(yArrow);
        
        // Z轴 - 蓝色
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-half, -half, -half),
            new THREE.Vector3(-half, -half, arrowPos)
        ]);
        const zLine = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 }));
        this.app.axisHelper.add(zLine);
        
        const zArrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const zArrow = new THREE.Mesh(zArrowGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff }));
        zArrow.position.set(-half, -half, arrowPos);
        zArrow.rotateX(Math.PI / 2);
        this.app.axisHelper.add(zArrow);
        
        this.createAxisLabels();
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