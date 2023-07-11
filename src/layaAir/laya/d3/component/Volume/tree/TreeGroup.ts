import { Laya } from "Laya";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { TreeAgent } from "./TreeAgent";
import { TreeLibrary } from "./TreeLibrary";
import { TreeRandom } from "./TreeRandom";
import { TreeSystem } from "./TreeSystem";
import { BaseRender } from "laya/d3/core/render/BaseRender";
import { Vector3 } from "laya/maths/Vector3";
import { Ray } from "laya/d3/math/Ray";
import { MathEx } from "../utils/MathEx";
import { Functions } from "../utils/Functions";
import { BoundBox } from "laya/d3/math/BoundBox";
import { BoundFrustum } from "laya/d3/math/BoundFrustum";

/**
 * 树木代理渲染组件
 */
class TreeGroupRender extends BaseRender {
    bbOrg: BoundBox = new BoundBox(new Vector3(0, 0, 0), new Vector3(10, 10, 10)); //原始包围盒（物体空间）
    bbOut: BoundBox = new BoundBox(new Vector3(0, 0, 0), new Vector3(10, 10, 10)); //变换包围盒（世界空间）
    getBoundBox() {
        return this.bbOut;
    }
    setBoundBox(xmin: number, ymin: number, zmin: number, xmax: number, ymax: number, zmax: number) {
        this.bbOrg.min.x = xmin;
        this.bbOrg.min.y = ymin;
        this.bbOrg.min.z = zmin;
        this.bbOrg.max.x = xmax;
        this.bbOrg.max.y = ymax;
        this.bbOrg.max.z = zmax;
        this._calculateBoundingBox();
    }
    protected _calculateBoundingBox() {
        this.boundsChange = false;
        const wm = (<Sprite3D>this.owner).transform.worldMatrix; //@ts-ignore
        MathEx.transformBoundBox(this.bbOrg, wm, this.bbOut);
        this.bounds.setMin(this.bbOut.min);
        this.bounds.setMax(this.bbOut.max);
    }
}

/**
 * 树木组合景观
 */
export class TreeGroup extends Sprite3D {
    param = {
        res: [
            { type: 3000, kind: 1, code: 0, xnum: 8, znum: 3, xint: 0.4, zint: 0.4, xrand: 0.1, zrand: 0.1, rrand: 360 }, //野草

            { type: 3100, kind: 0, code: 0, xnum: 3, znum: 1, xint: 1.2, zint: 0.6, xrand: 0.2, zrand: 0.2, rrand: 360 }, //野花
            { type: 3100, kind: 1, code: 0, xnum: 2, znum: 1, xint: 1.2, zint: 0.6, xrand: 0.2, zrand: 0.2, rrand: 360 },
            { type: 3100, kind: 2, code: 0, xnum: 2, znum: 2, xint: 1.2, zint: 0.6, xrand: 0.2, zrand: 0.2, rrand: 360 },
            { type: 3100, kind: 3, code: 0, xnum: 5, znum: 1, xint: 0.5, zint: 0.5, xrand: 0.2, zrand: 0.2, rrand: 360 },

            { type: 1010, kind: 0, code: 0 }, //龟背竹
            { type: 1020, kind: 0, code: 0 }, //天堂鸟
            { type: 1020, kind: 1, code: 0 },

            { type: 610, kind: 0, code: 0 }, //椰子树
            { type: 610, kind: 1, code: 0 },

            { type: 2000, kind: 0, code: 0, xint: 0, zint: 0 }, //荷花
            { type: 2000, kind: 1, code: 0, xint: 0, zint: 0 },

            { type: 2100, kind: 0, code: 0, showPot: true }, //玫瑰
            { type: 2200, kind: 2, code: 0 }, //百合花
            { type: 1020, kind: 2, code: 0 }, //天堂鸟
            { type: 1030, kind: 2, code: 0 }, //散尾葵
            { type: 1040, kind: 1, code: 0 }, //富贵竹
            { type: 1010, kind: 2, code: 0 }, //龟背竹
            { type: 1010, kind: 3, code: 0 }, //龟背竹
            { type: 1060, kind: 2, code: 0 }, //银皇后
        ],
        pos: [
            { x: 0, y: 0, z: 0 },

            { x: 0, y: 0, z: 0 },
            { x: 0.5, y: 0, z: 0 },
            { x: 0.8, y: 0, z: 0 },
            { x: 0.3, y: 0, z: 0.8 },

            { x: 0, y: 0, z: 0.3 },
            { x: 1.2, y: 0, z: 0.4 },
            { x: 2.1, y: 0, z: 0.5 },

            { x: 0.4, y: 0, z: 0.3 },
            { x: 2.6, y: 0, z: 0.3 },

            { x: 3.1, y: 0, z: 0.5 },
            { x: 3.1, y: 0, z: 0.5 },

            { x: 4, y: 0, z: 0.5 },
            { x: 4.5, y: 0, z: 0.5 },
            { x: 5, y: 0, z: 0.5 },
            { x: 5.5, y: 0, z: 0.5 },
            { x: 6, y: 0, z: 0.5 },
            { x: 6.5, y: 0, z: 0.5 },
            { x: 7, y: 0, z: 0.5 },
            { x: 7.5, y: 0, z: 0.5 },
        ],
        rot: [0,
            0, 0, 0, 0,
            180, 0, 0,
            0, 90,
            180, 0,
            0, 0, 0, 0, 0, 0, 0, 0],
        scale: [1.25,
            0.5, 0.5, 0.5, 0.45,
            1, 1, 1,
            0.35, 0.4,
            1, 1,
            1, 1, 1, 1, 1, 1, 1, 1],
    }

    plantId: number; //组合实例编码
    cfg: string; //树木配置文件
    private _tl: TreeLibrary;
    private _ready: boolean = true;
    private _rand: TreeRandom = new TreeRandom();
    private _render: TreeGroupRender; //渲染组件（用于裁剪）

    tas: Map<number, TreeAgent> = new Map();
    grow: number;
    root: Sprite3D; //根节点
    queryHeight: Function; //查找高度的函数（用于支持地形）

    indoor: boolean = false; //室内模式

    constructor(plantId: number, treeLib: TreeLibrary) {
        super("TreeGroup");
        this.plantId = plantId;
        this._tl = treeLib;
        this.grow = 1;
        this.root = new Sprite3D();
        this._render = this.addComponent(TreeGroupRender);
    }

    /**
     * 每帧调用
     * @param cameraPos 相机位置
     */
    everyFrame(cameraPos: Vector3) {
        this.tas.forEach(ta => ta.everyFrame(cameraPos));
    }

    /**
     * 数据JSON保存
     */
    toJson() {
        const json = JSON.stringify(this.param);
        return json;
    }

    /**
     * 解析JSON数据
     * @param json 
     */
    parseJson(json: string) {
        this.param = JSON.parse(json);
    }

    /**
     * 保存数据文件
     * @param file 
     */
    saveConfig(file: string) {
        Functions.saveDataToJsonFile(this.param, file);
    }

    /**
     * 加载数据文件
     * @param file 
     * @param next 
     */
    loadConfig(file: string, next?: Function) {
        this._ready = false;
        this.cfg = file;
        const tr = Laya.loader.getRes(file);
        if (tr) {
            this.param = tr.data;
            this._ready = true;
            if (next) next();
        } else {
            Laya.loader.load({ url: file, type: Loader.JSON },
                Handler.create(this, (tr: any) => {
                    if (tr) {
                        this.param = tr.data;
                        this._ready = true;
                        if (next) next();
                    }
                }));
        }
    }

    /**
     * 获取包围盒
     * @returns 
     */
    getBoundBox() {
        const bb = new BoundBox(new Vector3(), new Vector3());
        this._render.bounds.getBoundBox(bb);
        return bb;
    }

    /**
     * 更新包围盒
     */
    updateBoundBox() {
        let minx = Number.MAX_VALUE;
        let miny = Number.MAX_VALUE;
        let minz = Number.MAX_VALUE;
        let maxx = -Number.MAX_VALUE;
        let maxy = -Number.MAX_VALUE;
        let maxz = -Number.MAX_VALUE;
        this.tas.forEach(ta => {
            const bb = ta.getBoundBox();
            minx = Math.min(minx, bb.min.x);
            miny = Math.min(miny, bb.min.y);
            minz = Math.min(minz, bb.min.z);
            maxx = Math.max(maxx, bb.max.x);
            maxy = Math.max(maxy, bb.max.y);
            maxz = Math.max(maxz, bb.max.z);
        });
        this._render.setBoundBox(minx, miny, minz, maxx, maxy, maxz);
    }

    /**
     * 建立树木代理
     */
    buildAgent() {
        if (!this._ready) return;
        if (this.param.res.length == this.tas.size) return;
        this._rand.setSeed(1);
        for (let i = 0, len = this.param.res.length; i < len; i++) {
            const res = this.param.res[i];
            const pos = this.param.pos[i];
            const rot = this.param.rot[i];
            const scale = this.param.scale[i];
            const xnum = res.xnum == undefined ? 1 : res.xnum;
            const znum = res.znum == undefined ? 1 : res.znum;
            const xint = res.xint == undefined ? 1 : res.xint;
            const zint = res.zint == undefined ? 1 : res.zint;
            const xrand = res.xrand == undefined ? 0 : res.xrand;
            const zrand = res.zrand == undefined ? 0 : res.zrand;
            const rrand = res.rrand == undefined ? 0 : res.rrand;
            const cfg = this._tl.getTreeCfgFileByType(res.type, res.kind);
            for (let j = 0; j < xnum; j++) {
                for (let k = 0; k < znum; k++) {
                    const id = TreeSystem.nextId();
                    const ta = new TreeAgent(id, cfg, res.code);
                    ta.indoor = this.indoor;
                    ta.showPot = res.showPot != undefined ? res.showPot : true;
                    const rx = this._rand.random(-xrand, xrand);
                    const rz = this._rand.random(-zrand, zrand);
                    const rr = this._rand.random(0, rrand);
                    const x = pos.x + j * xint + rx;
                    const z = pos.z + k * zint + rz;
                    if (this.queryHeight)
                        pos.y = this.queryHeight(x, z);
                    ta.setPosition(x, pos.y, z);
                    ta.setRotation(0, rot + rr, 0);
                    ta.setScale(scale);
                    this.tas.set(id, ta);
                    this.root.addChild(ta);
                }
            }
        }
    }

    /**
     * 设置隐藏
     * @param hide 是否隐藏
     */
    setHide(hide: boolean) {
        this.tas.forEach(ta => ta.setHide(hide));
    }

    /**
     * 设置位置
     * @param x 位置坐标x
     * @param y 位置坐标y
     * @param z 位置坐标z
     */
    setPosition(x: number, y: number, z: number) {
        this.root.transform.localPositionX = x;
        this.root.transform.localPositionY = y;
        this.root.transform.localPositionZ = z;
        this.updateBoundBox();
    }

    /**
     * 设置方向
     * @param x 旋转角度x
     * @param y 旋转角度y
     * @param z 旋转角度z
     */
    setRotation(x: number, y: number, z: number) {
        this.root.transform.localRotationEulerX = x;
        this.root.transform.localRotationEulerY = y;
        this.root.transform.localRotationEulerZ = z;
        this.updateBoundBox();
    }

    /**
     * 设置放缩
     * @param s 放缩比例
     */
    setScale(s: number) {
        this.root.transform.localScaleX = s;
        this.root.transform.localScaleY = s;
        this.root.transform.localScaleZ = s;
        this.tas.forEach(ta => ta.setScale(s));
        this.updateBoundBox();
    }

    /**
     * 设置生长系数
     * @param grow 
     */
    setGrow(grow: number) {
        this.tas.forEach(ta => ta.setGrow(grow));
    }

    /**
     * 设置季节系数
     * @param season 
     */
    setSeason(season: number) {
        this.tas.forEach(ta => ta.setSeason(season));
    }

    /**
     * 是否被视锥裁剪
     * @param frustum 
     */
    isCull(frustum: BoundFrustum) {
        return !frustum.intersects(this._render.getBoundBox());
    }

    /**
     * 设置选中
     * @param picked 
     */
    setPicked(picked: boolean) {
        this.tas.forEach(ta => ta.setPicked(picked));
    }

    /**
     * 添加到可视树木队列
     */
    addVisibleTreeCamera() {
        this.tas.forEach(ta => ta.addVisibleTreeCamera());
    }

    /**
     * 添加到可视树木队列
     */
    addVisibleTreeShadow() {
        this.tas.forEach(ta => ta.addVisibleTreeShadow());
    }

    /**
     * 是否和射线有交点
     * @param ray 
     */
    rayPick(ray: Ray) {
        let ret = false;
        this.tas.forEach(ta => ret ||= ta.rayPick(ray));
        return ret;
    }

    /**
     * 是否具有拾取网格
     * @returns 
     */
    havePickMesh() {
        let ret = false;
        this.tas.forEach(ta => ret ||= ta.havePickMesh());
        return ret;
    }

    /**
     * 是否具有指定的植物
     * @param id 
     */
    haveTree(id: number) {
        let have = false;
        this.tas.forEach(tas => {
            if (tas.id == id)
                have = true;
        });
        return have;
    }

    /**
     * 销毁
     */
    destroy() {
        this.tas.clear();
        this.root.destroy();
    }
}