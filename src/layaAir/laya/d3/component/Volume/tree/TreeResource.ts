import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { BoundBox } from "laya/d3/math/BoundBox";
import { Vector3 } from "laya/maths/Vector3";
import { Color } from "laya/maths/Color";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Loader } from "laya/net/Loader";
import { FilterMode } from "laya/RenderEngine/RenderEnum/FilterMode";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { Texture2D } from "laya/resource/Texture2D";
import { Handler } from "laya/utils/Handler";
import { TreeConfig, TreeRandomGenParam } from "./TreeConfig";
import { TreeParamMaker } from "./TreeParamMaker";
import { TreeRandom } from "./TreeRandom";
import { TreeUtils } from "./TreeUtils";
import { TreeSnapshot } from "./TreeSnapshot";
import { TreeTexManager } from "./TreeTexManager";
import { BaseTexture } from "laya/resource/BaseTexture";
import { RenderTexture } from "laya/resource/RenderTexture";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { TreeMaterial } from "./material/tree/TreeMaterial";
import { ImposterMaterial } from "./material/imposter/ImposterMaterial";
import { Functions } from "../utils/Functions";
import { TreeTestRender } from "../TreeRender/TreeTestRender";

/**
 * 树木资源（管理一个树种）
 */
export class TreeResource {
    type: number; //树木类型
    name: string; //树木名称
    camera: Camera; //相机对象
    mesh: Mesh[] = []; //树木网格
    pickMesh: Mesh; //用于拾取的网格对象（树干）
    bbox: BoundBox[] = []; //每棵不同形状树的包围盒
    texture: Texture2D; //树木贴图
    material: TreeMaterial; //树木材质
    texImposter: BaseTexture; //替身贴图
    matImposter: ImposterMaterial; //替身材质
    bbMap: Map<number, BoundBox> = new Map(); //sn对应的包围盒
    sizeMap: Map<number, number> = new Map(); //sn对应树枝长度

    cfg: TreeConfig; //树木配置参数
    tpd: Uint16Array; //树木参数数据
    tpt: Texture2D; //树木参数贴图
    tpm: TreeParamMaker; //树木参数生成器
    tss: TreeSnapshot; //树木快照器
    ttm: TreeTexManager; //树木贴图管理器
    rand: TreeRandom; //树木随机数发生器
    snap: boolean = true; //需要建立快照

    constructor(type: number, name: string, cfg: TreeConfig, ttm: TreeTexManager, snap: boolean = true) {
        this.type = type;
        this.name = name;
        this.snap = snap;
        // this.camera = camera;
        this.rand = new TreeRandom();
        this.material = new TreeMaterial();
        this.matImposter = new ImposterMaterial();
        this.matImposter.specularColor = new Color(0, 0, 0);
        this.matImposter.albedoColor = new Color(1, 1, 1);
        this.cfg = cfg;
        this.ttm = ttm;
        this.update();
    }

    /**
     * 创建/更新数据
     */
    update() {
        this._createTree();
        const size = this.cfg.paramTexSize;
        if (!this.tpd)
            this.tpd = new Uint16Array(size * size * 4);
        if (!this.tpm)
            this.tpm = new TreeParamMaker(this);
        const num = this.cfg.param.treeNum;
        for (let i = 0; i < num; i++) {
            this.bbox[i] = new BoundBox(new Vector3(), new Vector3());
            this.tpm.make(this.tpd, this.bbox[i], i);
        }
        if (!this.tpt) {
            this.tpt = new Texture2D(size, size, TextureFormat.R16G16B16A16, false, false, false);
            this.tpt.setPixelsData(this.tpd, false, false);
            this.tpt.lock = true;
            this.tpt.filterMode = FilterMode.Point;
            this.tpt.anisoLevel = 1;
        } else this.tpt.setSubPixelsData(0, 0, size, size, this.tpd, 0, false, false, false);

        const last = this.cfg.param.lodNum - 1;
        if (this.mesh[last])
            this.mesh[last].destroy();
        this.mesh[last] = TreeUtils.createImposterMesh(this.bbox[0]);

        this.material.paramTexture = this.tpt;
        this.material.paramSize = this.cfg.paramTexSize;
        this.material.paramStride = this.cfg.dataLength / 4;
        this.material.treeHeight = this.bbox[0].max.y - this.bbox[0].min.y;

        if (this.snap) {
            if (!this.texImposter) {
                const size = this.material.treeHeight < 10 ? 256 : 512;
                this.texImposter = new RenderTexture(size, size,
                    RenderTargetFormat.R8G8B8A8, RenderTargetFormat.DEPTHSTENCIL_24_8, true, 1, false, true);
                this.matImposter.albedoTexture = this.texImposter;
            }
        }

        if (this.tss)
            this.tss.removeTask = true;
        if (this.snap)
            this.tss = new TreeSnapshot(this);
    }

    /**
     * 刷新数据
     */
    refresh() {
        this._refreshTree();
    }

    /**
     * 创建树木资源
     */
    private _createTree() {
        const cfg = this.cfg;
        // this.bbMap.clear();
        // this.sizeMap.clear();
        // this.material.lod = cfg.gpuLod;
        // this.material.wind = cfg.gpuWind;
        // this.material.setWind(cfg.wind);
        this.material.lod = false;
        this.material.wind = false;
        this.material.setWind(cfg.wind);


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

            return TreeUtils.mergeMeshSimple(vertices, indices);
        }

        const len = cfg.param.lodNum - 1;
        for (let i = 0; i < len; i++) {
            if (this.mesh[i])
                this.mesh[i].destroy();
            this.mesh[i] = _makeTree(i);
        }

        // if (this.pickMesh)
        //     this.pickMesh.destroy();
        // this.pickMesh = _pickMesh();
        this._loadTexture();
    }

    /**
     * 刷新树木资源
     */
    private _refreshTree() {
        const cfg = this.cfg;
        this.material.lod = cfg.gpuLod;
        this.material.wind = cfg.gpuWind;
        this.material.setWind(cfg.wind);
    }

    /**
     * 加载树木贴图
     */
    private _loadTexture() {
        const empty = "";
        const tex = this.cfg.param.texture;
        if (tex) {
            const t = this.ttm.getTexture(
                tex.bark ? tex.bark : empty,
                tex.stem ? tex.stem : empty,
                tex.leaf ? tex.leaf : empty,
                tex.squama ? tex.squama : empty,
                tex.flower ? tex.flower : empty);
            this.texture = t as any;
            this.material.albedoTexture = t;
        }
    }

    /**
     * 设置放缩系数
     * @param scale 
     */
    setScale(scale: number) {
        this.matImposter.scale = scale;
    }

    /**
     * 初始化配置
     */
    initConfig() {
        //this.cfg = new TreeConfig();
        this.cfg.initParam();
    }

    /**
     * 随机配置
     */
    randConfig() {
        this.cfg.randParam();
    }

    /**
     * 进化配置
     * @param percent
     */
    evolveConfig(percent: number) {
        this.cfg.evolveParam(percent);
    }

    /**
     * 下一个配置
     * @param percent 
     */
    nextConfig(percent: number) {
        this.cfg.nextParam(percent);
    }

    /**
     * 根据控制参数随机生成配置
     * @param trgp 
     */
    genConfig(trgp: TreeRandomGenParam) {
        this.cfg.genParam(trgp);
    }

    /**
     * 保存配置（JSON文件）
     * @param file 
     */
    saveConfig(file: string) {
        Functions.saveDataToJsonFile(this.cfg.param, file);
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
            Laya.loader.load({ url: cfg, type: Loader.JSON },
                Handler.create(this, (tr: any) => {
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

    /**
     * 调整高矮
     * @param rate 
     */
    adjHeight(rate: number) {
        this.cfg.adjHeight(rate);
    }

    /**
     * 调整粗细
     * @param rate 
     */
    adjWide(rate: number) {
        this.cfg.adjWide(rate);
    }

    /**
     * 调整弯曲
     * @param rate 
     */
    adjCurve(rate: number) {
        this.cfg.adjCurve(rate);
    }

    /**
     * 调整树枝
     * @param rate 
     */
    adjBranch(rate: number) {
        this.cfg.adjBranch(rate);
    }

    /**
     * 调整树叶
     * @param rate 
     */
    adjLeaf(rate: number) {
        this.cfg.adjLeaf(rate);
    }

    /**
     * 调整亮度
     * @param rate 
     */
    adjLuminance(rate: number) {
        this.cfg.adjLuminance(rate);
    }

    /**
     * 调整色度
     * @param rate 
     */
    adjSaturation(rate: number) {
        this.cfg.adjSaturation(rate);
    }

    /**
     * 调整随机数种子
     */
    adjSeed() {
        this.cfg.adjSeed();
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.tpt)
            this.tpt.destroy();
        this.mesh.forEach(m => m.destroy());
        this.mesh.length = 0;
        if (this.pickMesh)
            this.pickMesh.destroy();
        this.bbMap.clear();
        this.sizeMap.clear();
        if (this.texture)
            this.texture._removeReference();
        if (this.material)
            this.material.destroy();
        if (this.texImposter)
            this.texImposter.destroy();
        if (this.matImposter)
            this.matImposter.destroy();
    }
}