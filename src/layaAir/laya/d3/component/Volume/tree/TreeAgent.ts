import { Laya } from "Laya";
import { BaseRender } from "laya/d3/core/render/BaseRender";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Vector3 } from "laya/maths/Vector3";
import { Tree } from "./Tree";
import { Ray } from "laya/d3/math/Ray";
import { MathEx } from "../utils/MathEx";
import { BoundBox } from "laya/d3/math/BoundBox";
import { BoundFrustum } from "laya/d3/math/BoundFrustum";

/**
 * 树木代理渲染组件
 */
class TreeAgentRender extends BaseRender {
    bbOrg: BoundBox = new BoundBox(new Vector3(-5, 0, -5), new Vector3(5, 10, 5)); //原始包围盒（物体空间）
    bbOut: BoundBox = new BoundBox(new Vector3(-5, 0, -5), new Vector3(5, 10, 5)); //变换包围盒（世界空间）
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
 * 树木代理
 */
export class TreeAgent extends Sprite3D {
    plantId: number; //树木实例编码
    cfg: string; //树木配置文件
    code: number; //树木形状编号
    lod: number; //Lod等级
    dist: number; //距离系数（0~1）
    distReal: number; //真实距离系数（-1~1）
    showPot: boolean; //是否显示花盆（如果有）
    picked: boolean; //是否被选中
    grow: number; //生长系数
    hue: number; //色相系数
    luminance: number; //亮度系数
    saturation: number; //色度系数
    tree: Tree; //树木渲染对象
    private _view: Vector3 = new Vector3(); //视线矢量
    private _isFar: boolean = false; //是否距离超限
    private _isHide: boolean = false; //是否手动隐藏
    private _render: TreeAgentRender; //渲染组件（用于裁剪）
    private _season: number; //季节系数

    indoor: boolean = false; //是否是室内模式
    lodDist: number = 20; //lod最远距离（该距离范围内，树木有细节变化）
    visDist: number = 40; //最远可视距离（超过该距离，树木完全消失）

    constructor(plantId: number, cfg: string, code: number) {
        super("TreeAgent");
        this.plantId = plantId;
        this.cfg = cfg;
        this.code = code;
        this.dist = 1;
        this.distReal = 1;
        this.grow = 1;
        this.luminance = 1;
        this.saturation = 1;
        this.hue = 0;
        this.showPot = true;
        this.picked = false;
        this._render = this.addComponent(TreeAgentRender);
    }

    /**
     * 处理距离系数
     */
    private _processDist() {
        const td1 = Laya.timer.delta * 0.0005;
        const td2 = td1 * 2.5;
        if (this.distReal > 0.85) {
            if (this.dist < 1 - td1)
                this.dist += td1;
            else if (this.dist > 1 + td1)
                this.dist -= td1;
            else this.dist = 1;
        } else if (this.distReal > 0.65) {
            if (this.dist < 0.8 - td1)
                this.dist += td1;
            else if (this.dist > 0.8 + td1)
                this.dist -= td1;
            else this.dist = 0.8;
        } else if (this.distReal > 0.25) {
            if (this.dist < 0.5 - td2)
                this.dist += td2;
            else if (this.dist > 0.5 + td2)
                this.dist -= td2;
            else this.dist = 0.5;
        } else {
            if (this.dist < 0.1 - td2)
                this.dist += td2;
            else if (this.dist > 0.1 + td2)
                this.dist -= td2;
            else this.dist = 0.1;
        }
    }

    /**
     * 每帧调用
     * @param cameraPos 相机位置
     */
    everyFrame(cameraPos: Vector3) {
        if (this.tree) {
            const cfg = this.tree.tr.cfg;
            const pos = this.transform.position;
            const bb = this.tree.tr.bbox[0];
            const hr = (bb.max.y - bb.min.y) / 5;
            const ldn = cfg.param.lodNum;
            const ldm = (this.indoor ? this.lodDist : cfg.param.lodDist) * MathEx.clamp(hr, 0.1, 2.0);
            const vdm = this.indoor ? this.visDist : cfg.param.visDist;
            Vector3.subtract(pos, cameraPos, this._view);
            Vector3.normalize(this._view, this._view);
            const vy = Math.abs(this._view.y); //垂直视角系数
            const dist = Math.max(0, Vector3.distance(pos, cameraPos) - 10);
            this.distReal = MathEx.clamp(1 - dist / ldm, -1, 1);
            this._processDist();
            this.tree.dist = this.dist;

            if (dist > vdm)
                this._isFar = true; //隐藏
            else {
                this._isFar = false; //显示
                if (this.distReal < 0) {
                    if (vy < 0.95) //垂直视角不大（防止Billboard露馅）
                        this.tree.setLod(ldn - 1);
                    else this.tree.setLod(Math.max(0, ldn - 2));
                }
                else if (this.distReal < 0.65)
                    this.tree.setLod(Math.min(ldn - 2, 2)); //低细节
                else if (this.distReal < 0.85)
                    this.tree.setLod(Math.min(ldn - 2, 1)); //中细节
                else this.tree.setLod(0); //高细节

                this.tree.hue = this.hue;
                this.tree.saturation = this.saturation;
                this.tree.luminance = this.luminance;
                this.tree.tr.material.season = this._season;
                if (this.picked)
                    this.tree.flash = Math.abs(Math.sin(Laya.timer.currTimer * 0.002) * 4);
                else this.tree.flash = 0;
            }
        }
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
        this.picked = picked;
    }

    /**
     * 添加到可视树木队列（相机裁剪）
     */
    addVisibleTreeCamera() {
        if (this.tree && !this._isHide && !this._isFar)
            this.tree.addVisibleTreeCamera();
    }

    /**
     * 添加到可视树木队列（阴影裁剪）
     */
    addVisibleTreeShadow() {
        if (this.tree && !this._isHide && !this._isFar)
            this.tree.addVisibleTreeShadow();
    }

    /**
     * 获取包围盒
     * @returns 
     */
    getBoundBox() {
        return this._render.getBoundBox();
    }

    /**
     * 设置包围盒
     * @param xmin 
     * @param ymin 
     * @param zmin 
     * @param xmax 
     * @param ymax 
     * @param zmax 
     */
    setBoundBox(xmin: number, ymin: number, zmin: number, xmax: number, ymax: number, zmax: number) {
        this._render.setBoundBox(xmin, ymin, zmin, xmax, ymax, zmax);
    }

    /**
     * 更新包围盒
     */
    updateBoundBox() {
        if (this.tree) {
            if (this.tree.tr.bbox.length > this.tree.code) {
                const bb = this.tree.tr.bbox[this.tree.code];
                this._render.setBoundBox(bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z);
                this.tree.tr.material.treeHeight = bb.max.y - bb.min.y;
            }
        }
    }

    /**
     * 更新变换矩阵
     */
    updateTransform() {
        if (this.tree)
            this.tree.setWorldMatrix(this.transform.worldMatrix);
    }

    /**
     * 设置隐藏
     * @param hide 是否隐藏
     */
    setHide(hide: boolean) {
        this._isHide = hide;
    }

    /**
     * 设置植物对象
     * @param tree 
     */
    setTree(tree: Tree) {
        this.tree = tree;
        if (this.tree)
            this.tree.setScale(this.transform.localScaleX);
    }

    /**
     * 设置位置
     * @param x 位置坐标x
     * @param y 位置坐标y
     * @param z 位置坐标z
     */
    setPosition(x: number, y: number, z: number) {
        this.transform.localPositionX = x;
        this.transform.localPositionY = y;
        this.transform.localPositionZ = z;
    }

    /**
     * 设置方向
     * @param x 旋转角度x
     * @param y 旋转角度y
     * @param z 旋转角度z
     */
    setRotation(x: number, y: number, z: number) {
        this.transform.localRotationEulerX = x;
        this.transform.localRotationEulerY = y;
        this.transform.localRotationEulerZ = z;
    }

    /**
     * 设置放缩
     * @param s 放缩比例
     */
    setScale(s: number) {
        this.transform.localScaleX = s;
        this.transform.localScaleY = s;
        this.transform.localScaleZ = s;
        if (this.tree)
            this.tree.setScale(s);
    }

    /**
     * 设置生长系数
     * @param grow 
     */
    setGrow(grow: number) {
        if (this.tree)
            this.tree.grow = grow;
    }

    /**
     * 设置重力系数
     * @param drop 
     */
    setDrop(drop: number) {
        if (this.tree)
            this.tree.drop = drop;
    }

    /**
     * 设置季节系数
     * @param season 
     */
    setSeason(season: number) {
        this._season = season;
        const hue = this.tree?.tr?.cfg?.param.hue;
        if (hue)
            this.hue = MathEx.seasonCurve(season, hue.spring, hue.summer, hue.autumn, hue.winter);
    }

    /**
     * 是否和射线有交点
     * @param ray 
     */
    rayPick(ray: Ray) {
        if (this.tree)
            return this.tree.rayPick(ray, this.transform.worldMatrix);
        return false;
    }

    /**
     * 是否具有拾取网格（树干网格）
     * @returns 
     */
    havePickMesh() {
        if (this.tree)
            return this.tree.havePickMesh();
        return false;
    }

    /**
     * 销毁
     */
    destroy() {
        super.destroy();
        if (this.tree)
            this.tree.destroy();
        this.tree = null;
    }
}