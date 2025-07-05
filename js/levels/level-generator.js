/**
 * 关卡生成器 - 负责生成随机模型和目标视图
 */
class LevelGenerator {
    constructor(app) {
        this.app = app;
    }

    generateRandomModel() {
        const size = this.app.workspaceSize;
        
        if (this.app.gravityMode) {
            return this.generateGravityModel(size);
        } else {
            return this.generateNoGravityModel(size);
        }
    }

    generateGravityModel(size) {
        const model = [];
        for (let x = 0; x < size; x++) {
            model[x] = [];
            for (let z = 0; z < size; z++) {
                let height = 0;
                const rand = Math.random();
                if (rand < 0.25) {
                    height = 0;
                } else {
                    // 指数分布：缓慢下降，低高度概率更大
                    const exponential = -Math.log(Math.random()) * 0.99;
                    height = Math.min(size, Math.floor(exponential) + 1);
                }
                model[x][z] = height;
            }
        }
        return model;
    }

    generateNoGravityModel(size) {
        const model = [];
        const probability = 1 / size;
        for (let x = 0; x < size; x++) {
            model[x] = [];
            for (let y = 0; y < size; y++) {
                model[x][y] = [];
                for (let z = 0; z < size; z++) {
                    model[x][y][z] = Math.random() < probability;
                }
            }
        }
        return model;
    }

    generateTargetViews(targetModel) {
        // 使用renderer的统一方法
        return this.app.levelManager.renderer.generateProjection('target', 'boolean');
    }
}