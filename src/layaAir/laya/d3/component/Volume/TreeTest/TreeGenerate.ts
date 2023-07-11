import { Laya } from "Laya";
import { TreeConfig } from "../tree/TreeConfig";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { TreeUtils } from "../tree/TreeUtils";
import { BoundBox } from "laya/d3/math/BoundBox";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Vector3 } from "laya/maths/Vector3";
import { TreeRandom } from "../tree/TreeRandom";

export class TreeGenerate {
    cfg: TreeConfig;
    mesh: Mesh[] = []; //树木网格
    bbox: BoundBox[] = []; //每棵不同形状树的包围盒
    bbMap: Map<number, BoundBox> = new Map(); //sn对应的包围盒
    sizeMap: Map<number, number> = new Map(); //sn对应树枝长度
    rand: TreeRandom; //树木随机数发生器
    
    constructor()
    {
        this.cfg = null;
        this.rand = new TreeRandom();
    }
    /**
     * 加载配置（JSON文件）
     * @param cfg 
     * @param next 
     * @param copy 是否拷贝参数，否则替换参数对象
     */
    loadConfig(cfg: string | TreeConfig, next: Function, copy: boolean = false) {
        if (cfg instanceof TreeConfig) {
            if (!this.cfg)
                this.cfg = new TreeConfig();
            if (copy) {
                this.cfg.initParam();
                this.cfg.copyParam(cfg.param);
            }
            else this.cfg.setParam(cfg.param);
            if (!next) {
                this.cfg.calcBranchAndLeafNum();
                this.cfg.calcFaceNum();
            } else next();
        } else {
            Laya.loader.load({ url: cfg, type: Loader.JSON }, Handler.create(this, (tr: any) => {
                    if (tr) {
                        if (!this.cfg)
                            this.cfg = new TreeConfig();
                        if (copy) {
                            this.cfg.initParam();
                            this.cfg.copyParam(tr.data);
                        }
                        else this.cfg.setParam(tr.data);
                        if (!next) {
                            this.cfg.calcBranchAndLeafNum();
                            this.cfg.calcFaceNum();
                        } else next();
                    }
                }));
        }
    }

    createTree() {
        const cfg = this.cfg;
        // this.bbMap.clear();
        // this.sizeMap.clear();
        // this.material.lod = cfg.gpuLod;
        // this.material.wind = cfg.gpuWind;
        // this.material.setWind(cfg.wind);

        const _pickMesh = () => {
            const th = cfg.param.height;
            const vertices = [];
            const indices = [];

            //树干
            const param = cfg.param.trunk;
            const length = th * param.length;
            if (!param.hide && length > 0 && param.length > 0 && param.radius > 0) {
                const trunk = TreeUtils.createTrunkVI(cfg, 0, 1, 0, length, param.slices, param.stacks, 0, 1);
                vertices.push(trunk.vertices);
                indices.push(trunk.indices);
                return TreeUtils.mergeMeshSimple(vertices, indices);
            }
            return undefined;
        };

        const _makeTree = (lod: number) => {
            let sn = 0;
            let num = 0;
            let slices = 3;
            let stacks = 1;
            const th = cfg.param.height;
            const vertices = [];
            const indices = [];
            const lastLod = cfg.param.lodNum - 1;

            //树干
            const param = cfg.param.trunk;
            const length = th * param.length;
            const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
            if (!param.hide) {
                slices = lod > 0 ? Math.min(5, param.slices) : param.slices;
                stacks = lod > 0 ? param.stacks / 2 | 0 : param.stacks;
                const trunk = TreeUtils.createTrunkVI(cfg, sn++, 1, 0, length, slices, stacks, 0, 1, bbox);
                vertices.push(trunk.vertices);
                indices.push(trunk.indices);
            } else sn++;
            if (lod == 0) {
                this.bbMap.set(sn - 1, bbox);
                this.sizeMap.set(sn - 1, length);
            }

            //树枝
            if (cfg.showBranch && cfg.param.branch) {
                this.rand.setSeed(1);
                if (lod < lastLod) {
                    const param = cfg.param.branch[0];
                    slices = lod > 0 ? Math.min(3, param.slices) : param.slices;
                    stacks = lod > 0 ? param.stacks / 2 | 0 : param.stacks;
                    num = param.sideNum + param.topNum;
                    for (let i = 0, len = cfg.branchNum[0]; i < len; i++) {
                        const ct = param.sphere ? 0 : (num < 2 ? 0 : (i % num) / (num - 1));
                        const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                        const length = (param.sphere ? 1 : cfg.getBranchLen(i, ct, 1)) * th * param.length * sr;
                        const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
                        const branch = TreeUtils.createTrunkVI(cfg, sn++, sr, ct, length, slices, stacks, 1, 2, bbox);
                        vertices.push(branch.vertices);
                        indices.push(branch.indices);
                        if (lod == 0) {
                            this.bbMap.set(sn - 1, bbox);
                            this.sizeMap.set(sn - 1, length);
                        }
                    }
                } else sn += cfg.branchNum[0];

                if (lod < lastLod) {
                    const param = cfg.param.branch[1];
                    slices = lod > 0 ? Math.min(3, param.slices) : param.slices;
                    stacks = lod > 0 ? param.stacks / 2 | 0 : param.stacks;
                    num = param.sideNum + param.topNum;
                    for (let i = 0, len = cfg.branchNum[1]; i < len; i++) {
                        const ct = num < 2 ? 0 : (i % num) / (num - 1);
                        const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                        const length = cfg.getBranchLen(i, ct, 2) * th * param.length * sr;
                        const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
                        const branch = TreeUtils.createTrunkVI(cfg, sn++, sr, ct, length, slices, stacks, 2, 2, bbox);
                        vertices.push(branch.vertices);
                        indices.push(branch.indices);
                        if (lod == 0) {
                            this.bbMap.set(sn - 1, bbox);
                            this.sizeMap.set(sn - 1, length);
                        }
                    }
                } else sn += cfg.branchNum[1];

                if (lod < 2) {
                    const param = cfg.param.branch[2];
                    slices = lod > 0 ? Math.min(3, param.slices) : param.slices;
                    stacks = lod > 0 ? param.stacks / 2 | 0 : param.stacks;
                    num = param.sideNum + param.topNum;
                    for (let i = 0, len = cfg.branchNum[2]; i < len; i++) {
                        const ct = num < 2 ? 0 : (i % num) / (num - 1);
                        const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                        const length = cfg.getBranchLen(i, ct, 3) * th * param.length * sr;
                        const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
                        const branch = TreeUtils.createTrunkVI(cfg, sn++, sr, ct, length, slices, stacks, 3, 2, bbox);
                        vertices.push(branch.vertices);
                        indices.push(branch.indices);
                        if (lod == 0) {
                            this.bbMap.set(sn - 1, bbox);
                            this.sizeMap.set(sn - 1, length);
                        }
                    }
                } else sn += cfg.branchNum[2];

                if (lod < 1) {
                    const param = cfg.param.branch[3];
                    slices = lod > 0 ? Math.min(3, param.slices) : param.slices;
                    stacks = lod > 0 ? param.stacks / 2 | 0 : param.stacks;
                    num = param.sideNum + param.topNum;
                    for (let i = 0, len = cfg.branchNum[3]; i < len; i++) {
                        const ct = num < 2 ? 0 : (i % num) / (num - 1);
                        const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                        const length = cfg.getBranchLen(i, ct, 4) * th * param.length * sr;
                        const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
                        const branch = TreeUtils.createTrunkVI(cfg, sn++, sr, ct, length, param.slices, param.stacks, 4, 2, bbox);
                        vertices.push(branch.vertices);
                        indices.push(branch.indices);
                        if (lod == 0) {
                            this.bbMap.set(sn - 1, bbox);
                            this.sizeMap.set(sn - 1, length);
                        }
                    }
                } else sn += cfg.branchNum[3];
            } else sn += cfg.calcBranchCodeMax();

            //树叶
            if (cfg.showLeaf && cfg.param.leaf) {
                const param = cfg.param.leaf;
                num = param.topNum + param.sideNum;
                this.rand.setSeed(1);
                if (lod == 0) {
                    for (let j = 0; j < 4; j++) {
                        for (let i = 0, len = cfg.leafNum[j]; i < len; i++) {
                            const ct = num < 2 ? 0 : (i % num) / (num - 1);
                            const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                            const bbox = new BoundBox(new Vector3(), new Vector3());
                            const leaf = TreeUtils.createLeafVI(cfg, sn++, sr, ct, j + 1, param.swing, bbox);
                            vertices.push(leaf.vertices);
                            indices.push(leaf.indices);
                            this.bbMap.set(sn - 1, bbox);
                        }
                    }
                } else {
                    for (let j = 0; j < 4; j++) {
                        for (let i = 0, len = cfg.leafNum[j]; i < len; i += 3) {
                            const ct = num < 2 ? 0 : (i % num) / (num - 1);
                            const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                            const leaf = TreeUtils.createLeafVI(cfg, sn++, sr * 1.5, ct, j + 1, param.swing);
                            vertices.push(leaf.vertices);
                            indices.push(leaf.indices);
                            sn += 2;
                        }
                    }
                }
            } else sn += cfg.leafNum[0] + cfg.leafNum[1] + cfg.leafNum[2] + cfg.leafNum[3];

            //蕨叶
            if (cfg.showFrond && cfg.param.frond) {
                const param = cfg.param.frond;
                num = param.sideNum + param.topNum;
                this.rand.setSeed(1);
                for (let j = 0; j < 4; j++) {
                    for (let i = 0, len = cfg.frondNum[j]; i < len; i++) {
                        const ct = (i % num) / (num - 1);
                        const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                        const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
                        const frond = TreeUtils.createFrondVI(cfg, sn++, sr, ct, j + 1, param.swing, lod + 1, bbox);
                        vertices.push(frond.vertices);
                        indices.push(frond.indices);
                        if (lod == 0)
                            this.bbMap.set(sn - 1, bbox);
                    }
                }
            } else sn += cfg.frondNum[0] + cfg.frondNum[1] + cfg.frondNum[2] + cfg.frondNum[3];

            //鳞叶
            if (cfg.showSquama && cfg.param.squama) {
                const param = cfg.param.squama;
                num = param.sideNum + param.topNum;
                this.rand.setSeed(1);
                if (lod == 0) {
                    for (let j = 0; j < 4; j++) {
                        for (let i = 0, len = cfg.squamaNum[j]; i < len; i++) {
                            const ct = num < 2 ? 0 : (i % num) / (num - 1);
                            const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                            const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
                            const squama = TreeUtils.createSquamaVI(cfg, sn++, sr, ct, j + 1, param.swing, lod + 1, bbox);
                            vertices.push(squama.vertices);
                            indices.push(squama.indices);
                            this.bbMap.set(sn - 1, bbox);
                        }
                    }
                } else {
                    for (let j = 0; j < 4; j++) {
                        for (let i = 0, len = cfg.squamaNum[j]; i < len; i += 3) {
                            const ct = num < 2 ? 0 : (i % num) / (num - 1);
                            const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                            const bbox = lod == 0 ? new BoundBox(new Vector3(), new Vector3()) : null;
                            const squama = TreeUtils.createSquamaVI(cfg, sn++, sr, ct, j + 1, param.swing, lod + 1, bbox);
                            vertices.push(squama.vertices);
                            indices.push(squama.indices);
                            sn += 2;
                        }
                    }
                }
            } else sn += cfg.squamaNum[0] + cfg.squamaNum[1] + cfg.squamaNum[2] + cfg.squamaNum[3];

            //花朵
            if (cfg.showFlower && cfg.param.flower) {
                const param = cfg.param.flower;
                num = param.topNum + param.sideNum;
                this.rand.setSeed(1);
                if (lod == 0) {
                    for (let j = 0; j < 4; j++) {
                        for (let i = 0, len = cfg.flowerNum[j]; i < len; i++) {
                            const ct = num < 2 ? 0 : (i % num) / (num - 1);
                            const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                            const bbox = new BoundBox(new Vector3(), new Vector3());
                            const flower = cfg.param.flower.complex ?
                                TreeUtils.createLotusVI(cfg, sn++, sr, ct, j + 1, param.swing, bbox) :
                                TreeUtils.createFlowerVI(cfg, sn++, sr, ct, j + 1, param.swing, bbox);
                            vertices.push(flower.vertices);
                            indices.push(flower.indices);
                            this.bbMap.set(sn - 1, bbox);
                        }
                    }
                } else {
                    for (let j = 0; j < 4; j++) {
                        for (let i = 0, len = cfg.flowerNum[j]; i < len; i += 3) {
                            const ct = num < 2 ? 0 : (i % num) / (num - 1);
                            const sr = param.sizeRand ? this.rand.random(1 - param.sizeRand, 1 + param.sizeRand) : 1;
                            const flower = cfg.param.flower.complex ?
                                TreeUtils.createLotusVI(cfg, sn++, sr * 1.5, ct, j + 1, param.swing) :
                                TreeUtils.createFlowerVI(cfg, sn++, sr * 1.5, ct, j + 1, param.swing);
                            vertices.push(flower.vertices);
                            indices.push(flower.indices);
                            sn += 2;
                        }
                    }
                }
            } else sn += cfg.flowerNum[0] + cfg.flowerNum[1] + cfg.flowerNum[2] + cfg.flowerNum[3];
            var meshNode = TreeUtils.mergeMeshSimple(vertices, indices);
            console.log(meshNode);
            return meshNode;
        }

        const len = 1;
        for (let i = 0; i < len; i++) {
            if (this.mesh[i])
                this.mesh[i].destroy();
            this.mesh[i] = _makeTree(i);
        }

        // if (this.pickMesh)
        //     this.pickMesh.destroy();
        // this.pickMesh = _pickMesh();
        // this._loadTexture();
    }
}