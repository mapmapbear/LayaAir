import { HalfFloatUtils } from "laya/utils/HalfFloatUtils";
import { Quaternion } from "laya/maths/Quaternion";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { BoundBox } from "laya/d3/math/BoundBox";
import { Vector3 } from "laya/maths/Vector3";
import { TreeRandom } from "./TreeRandom";
import { TreeResource } from "./TreeResource";
import { TreeSprite3D } from "./TreeSprite3D";
import { TreeUtils } from "./TreeUtils";
import { MathEx } from "../utils/MathEx";

/**
 * 树木参数生成器
 */
export class TreeParamMaker {
    private _sn: number = 0; //统一序号
    private _tr: TreeResource; //树木资源
    private _rand: TreeRandom; //随机数发生器
    private _trunk: TreeSprite3D; //树木主干
    private _branch: TreeSprite3D[][] = []; //树枝（共四层）
    private _leaf: TreeSprite3D[] = []; //树叶
    private _frond: TreeSprite3D[] = []; //蕨叶
    private _squama: TreeSprite3D[] = []; //鳞叶
    private _flower: TreeSprite3D[] = []; //花朵

    private _wb: number = 0; //风效起始值
    private _we: number = 0; //风效终止值
    private _wm: number = 2; //最大风效值

    //临时变量，减少内存重复分配
    private _tempCorn: Vector3[] = [];
    private _tempVec1: Vector3 = new Vector3();
    private _tempVec2: Vector3 = new Vector3();
    private _tempVec3: Vector3 = new Vector3();
    private _tempMat1: Matrix4x4 = new Matrix4x4();
    private _tempMat2: Matrix4x4 = new Matrix4x4();
    private _tempQuat: Quaternion = new Quaternion();

    constructor(tr: TreeResource) {
        this._tr = tr;
        this._rand = new TreeRandom();
        for (let i = 0; i < 4; i++) //四层树枝
            this._branch[i] = [];
        for (let i = 0; i < 8; i++)
            this._tempCorn[i] = new Vector3();
    }

    /**
     * 制作树木
     * @param data 
     * @param bbox 
     * @param code 
     */
    make(data: Uint16Array, bbox: BoundBox, code: number) {
        this._createTree();
        this._renderData(data, bbox, code);
        this.clear();
    }

    /**
     * 计算风效系数（用于GPU控制风效）
     * @param level 树枝层级
     * @param swing 主干摆动系数
     * @param soft 树枝整体柔软度
     */
    private _calcWindBeginAndEnd(level: number, swing: number, soft: number = 1) {
        this._wb = 0;
        this._we = 0;
        const wm = this._wm;
        switch (level) {
            case 0:
                this._wb = 0;
                this._we = Math.min(wm, swing * soft);
                break;
            case 1:
                this._wb = Math.min(wm, swing * soft);
                this._we = Math.min(wm, (swing + 0.1) * soft);
                break;
            case 2:
                this._wb = Math.min(wm, (swing + 0.1) * soft);
                this._we = Math.min(wm, (swing + 0.3) * soft);
                break;
            case 3:
                this._wb = Math.min(wm, (swing + 0.3) * soft);
                this._we = Math.min(wm, (swing + 0.6) * soft);
                break;
            case 4:
                this._wb = Math.min(wm, (swing + 0.6) * soft);
                this._we = Math.min(wm, (swing + 0.8) * soft);
                break;
            case 5:
                this._wb = Math.min(wm, (swing + 0.8) * soft);
                this._we = Math.min(wm, (swing + 0.8) * soft);
                break;
        }
    }

    /**
     * 生成树木
     */
    private _createTree() {
        const cfg = this._tr.cfg;
        const param = cfg.param.branch;
        const soft = cfg.param.soft != undefined ? cfg.param.soft : 1;
        const swing = cfg.param.trunk.swing != undefined ? cfg.param.trunk.swing : 0.2;
        const branch = [[], [], [], []]; //树枝

        //生成树木主干
        this._calcWindBeginAndEnd(0, swing, soft);
        this._makeTrunk(null, 1, 0, this._sn++, this._wb, this._we, 1);

        //生成第一层树枝
        this._tr.rand.setSeed(param[0].seed);
        this._createBranch(this._trunk, branch[0]);

        //生成第二层树枝
        this._tr.rand.setSeed(param[1].seed);
        for (let i = 0, len = branch[0].length; i < len; i++)
            this._createBranch(branch[0][i], branch[1]);

        //生成第三层树枝
        this._tr.rand.setSeed(param[2].seed);
        for (let i = 0, len = branch[1].length; i < len; i++)
            this._createBranch(branch[1][i], branch[2]);

        //生成第四层树枝
        this._tr.rand.setSeed(param[3].seed);
        for (let i = 0, len = branch[2].length; i < len; i++)
            this._createBranch(branch[2][i], branch[3]);

        //生成各层蕨叶
        for (let i = 0; i < 4; i++) {
            if (cfg.frondNum[i] > 0) {
                this._tr.rand.setSeed(cfg.param.frond.seed + i);
                if (i == 0)
                    this._createFrond(this._trunk);
                else {
                    for (let j = 0, len = branch[i - 1].length; j < len; j++)
                        this._createFrond(branch[i - 1][j]);
                }
            }
        }

        //生成各层鳞叶
        for (let i = 0; i < 4; i++) {
            if (cfg.squamaNum[i] > 0) {
                this._tr.rand.setSeed(cfg.param.squama.seed + i);
                if (i == 0)
                    this._createSquama(this._trunk);
                else {
                    for (let j = 0, len = branch[i - 1].length; j < len; j++)
                        this._createSquama(branch[i - 1][j]);
                }
            }
        }

        //生成各层树叶
        for (let i = 0; i < 4; i++)
            if (cfg.leafNum[i] > 0)
                for (let j = 0, len = branch[i].length; j < len; j++)
                    this._createLeaf(branch[i][j]);

        //生成各层花朵
        for (let i = 0; i < 4; i++)
            if (cfg.flowerNum[i] > 0)
                for (let j = 0, len = branch[i].length; j < len; j++)
                    this._createFlower(branch[i][j]);
    }

    /**
     * 生成树枝
     * @param parent 父节点
     * @param child 子节点
     * @param level 层次
     */
    private _createBranch(parent: TreeSprite3D, child: TreeSprite3D[]) {
        const cfg = this._tr.cfg;
        const rand = this._tr.rand;
        const level = parent.level + 1;
        const pl = this._tr.sizeMap.get(parent.sn);
        let rx = 0, ry = 0, ct = 0, ctTop = 0.998, ra = 10, co = 0, wb = 0, curve = Vector3.ZERO;
        const paramChild = cfg.param.branch[level - 1];
        const paramParent = level == 1 ? cfg.param.trunk : cfg.param.branch[level - 2];
        const top = cfg.getCurve(paramParent.curve, ctTop, pl).clone();
        const soft = cfg.param.soft != undefined ? cfg.param.soft : 1;
        const swing = cfg.param.trunk.swing != undefined ? cfg.param.trunk.swing : 0.2;

        this._calcWindBeginAndEnd(level, swing, soft);
        if (parent.level == 0 && cfg.param.trunk.bush) { //灌木
            const range = cfg.param.height * cfg.param.trunk.length;
            if (paramChild.sphere) { //圆球状排列
                const num = paramChild.sideNum + paramChild.topNum;
                const rr = TreeUtils.genUniformCoordsOnSphere(num);
                for (let i = 0; i < num; i++) {
                    rx = rr[i].lon;
                    ry = rr[i].lat;
                    const px = Math.sin(ry) * range;
                    const pz = Math.cos(ry) * range;
                    const branch = this._makeTrunk(parent, 2, level, this._sn++, wb, this._we, parent.wp,
                        px, 0, pz, rx, ry, 0, paramChild.direction);
                    branch.isRoot = true;
                    child.push(branch);
                }
            } else {
                for (let i = 0, len = paramChild.sideNum; i < len; i++) {
                    rx = rand.random(paramChild.angleSide - ra, paramChild.angleSide + ra);
                    ry += 180 + rand.random(-90, 90);
                    const px = rand.random(-range, range);
                    const pz = rand.random(-range, range);
                    const branch = this._makeTrunk(parent, 2, level, this._sn++, wb, this._we, parent.wp,
                        px, 0, pz, rx, ry, 0, paramChild.direction);
                    branch.isRoot = true;
                    child.push(branch);
                }
                for (let i = 0, len = paramChild.topNum; i < len; i++) {
                    rx = paramChild.topNum == 1 ? 0 : rand.random(paramChild.angleTop - ra, paramChild.angleTop + ra);
                    ry += 180 + rand.random(-90, 90);
                    const px = rand.random(-range, range);
                    const pz = rand.random(-range, range);
                    const branch = this._makeTrunk(parent, 2, level, this._sn++, wb, this._we, parent.wp,
                        px, 0, pz, rx, ry, 0, paramChild.direction);
                    branch.isRoot = true;
                    child.push(branch);
                }
            }
        } else {
            if (paramChild.sphere) { //圆球状排列
                const num = paramChild.sideNum + paramChild.topNum;
                const rr = TreeUtils.genUniformCoordsOnSphere(num);
                for (let i = 0; i < num; i++) {
                    rx = rr[i].lon;
                    ry = rr[i].lat;
                    console.log("rx = %f, ry = %f", rx, ry);
                    child.push(this._makeTrunk(parent, 2, level, this._sn++, this._wb, this._we, parent.wp,
                        top.x, ctTop * pl, top.y, rx, ry, 0, paramChild.direction));
                }
            } else {
                for (let i = 0, len = paramChild.sideNum; i < len; i++) {
                    rx = rand.random(paramChild.angleSide - ra, paramChild.angleSide + ra);
                    ry += 180 + rand.random(-90, 90);
                    co = (i / paramChild.sideGrp | 0) * paramChild.sideGrp;
                    ct = cfg.getBranchPos(co, level);
                    wb = parent.we * ct + parent.wb * (1 - ct);
                    curve = cfg.getCurve(paramParent.curve, ct, pl);
                    child.push(this._makeTrunk(parent, 2, level, this._sn++, wb, this._we, parent.wp,
                        curve.x, ct * pl, curve.y, rx, ry, 0, paramChild.direction));
                }
                for (let i = 0, len = paramChild.topNum; i < len; i++) {
                    rx = paramChild.topNum == 1 ? 0 : rand.random(paramChild.angleTop - ra, paramChild.angleTop + ra);
                    ry += 180 + rand.random(-90, 90);
                    child.push(this._makeTrunk(parent, 2, level, this._sn++, this._wb, this._we, parent.wp,
                        top.x, ctTop * pl, top.y, rx, ry, 0, paramChild.direction));
                }
            }
        }
    }

    /**
     * 生成蕨叶
     * @param parent 父节点
     */
    private _createFrond(parent: TreeSprite3D) {
        const cfg = this._tr.cfg;
        const rand = this._tr.rand;
        const level = parent.level;
        const param = cfg.param.frond;
        const topNum = param.topNum;
        const sideNum = param.sideNum;
        const soft = cfg.param.soft != undefined ? cfg.param.soft : 1;
        const swing = cfg.param.trunk.swing != undefined ? cfg.param.trunk.swing : 0.2;
        const paramParent = level == 0 ? cfg.param.trunk : cfg.param.branch[level - 1];
        const pl = this._tr.sizeMap.get(parent.sn);
        let rx = 0, ry = 0, ct = 0, ra = param.angleRand, co = 0, wb = 0, curve = Vector3.ZERO;

        this._calcWindBeginAndEnd(level, swing, soft);
        this._we = Math.min(this._wm, (swing + 0.8) * soft * param.soft);
        if (parent.level == 0 && cfg.param.trunk.bush) {
            const range = cfg.param.height * cfg.param.trunk.length;
            if (param.sphere) {
                ct = 1;
                const num = sideNum + topNum;
                const rr = TreeUtils.genUniformCoordsOnSphere(num);
                for (let i = 0; i < num; i++) {
                    rx = rr[i].lon;
                    ry = rr[i].lat;
                    const px = Math.sin(ry) * range;
                    const pz = Math.cos(ry) * range;
                    wb = parent.we * ct + parent.wb * (1 - ct);
                    curve = cfg.getCurve(paramParent.curve, ct, pl);
                    this._makeFrond(parent, level, this._sn++, wb, this._we, parent.wp,
                        px, 0, pz, rx, ry, 0);
                }
            } else {
                for (let i = 0; i < sideNum; i++) {
                    rx = rand.random(param.angleSide - ra, param.angleSide + ra);
                    ry += 180 + rand.random(-90, 90);
                    const px = rand.random(-range, range);
                    const pz = rand.random(-range, range);
                    this._makeFrond(parent, level, this._sn++, wb, this._we, parent.wp,
                        px, 0, pz, rx, ry, 0);
                }
                for (let i = 0; i < topNum; i++) {
                    rx = rand.random(param.angleTop - ra, param.angleTop + ra);
                    ry += 180 + rand.random(-90, 90);
                    const px = rand.random(-range, range);
                    const pz = rand.random(-range, range);
                    this._makeFrond(parent, level, this._sn++, wb, this._we, parent.wp,
                        px, 0, pz, rx, ry, 0);
                }
            }
        }
        else {
            if (param.sphere) {
                ct = 1;
                const num = sideNum + topNum;
                const rr = TreeUtils.genUniformCoordsOnSphere(num);
                for (let i = 0; i < num; i++) {
                    rx = rr[i].lon;
                    ry = rr[i].lat;
                    wb = parent.we * ct + parent.wb * (1 - ct);
                    curve = cfg.getCurve(paramParent.curve, ct, pl);
                    this._makeFrond(parent, level, this._sn++, wb, this._we, parent.wp,
                        curve.x, ct * pl, curve.y, rx, ry, 0);
                }
            } else {
                for (let i = 0; i < sideNum; i++) {
                    rx = rand.random(param.angleSide - ra, param.angleSide + ra);
                    ry += 180 + rand.random(-90, 90);
                    co = (i / param.sideGrp | 0) * param.sideGrp;
                    ct = cfg.getFrondPos(co);
                    wb = parent.we * ct + parent.wb * (1 - ct);
                    curve = cfg.getCurve(paramParent.curve, ct, pl);
                    this._makeFrond(parent, level, this._sn++, wb, this._we, parent.wp,
                        curve.x, ct * pl, curve.y, rx, ry, 0);
                }
                for (let i = 0; i < topNum; i++) {
                    rx = rand.random(param.angleTop - ra, param.angleTop + ra);
                    ry += 180 + rand.random(-90, 90);
                    ct = 0.98 + rand.random(-0.03, 0.03);
                    wb = parent.we * ct + parent.wb * (1 - ct);
                    curve = cfg.getCurve(paramParent.curve, ct, pl);
                    this._makeFrond(parent, level, this._sn++, wb, this._we, parent.wp,
                        curve.x, ct * pl, curve.y, rx, ry, 0);
                }
            }
        }
    }

    /**
     * 生成鳞叶
     * @param parent 父节点
     */
    private _createSquama(parent: TreeSprite3D) {
        const cfg = this._tr.cfg;
        const rand = this._tr.rand;
        const level = parent.level;
        const param = cfg.param.squama;
        const topNum = param.topNum;
        const sideNum = param.sideNum;
        const soft = cfg.param.soft != undefined ? cfg.param.soft : 1;
        const swing = cfg.param.trunk.swing != undefined ? cfg.param.trunk.swing : 0.2;
        const paramParent = level == 0 ? cfg.param.trunk : cfg.param.branch[level - 1];
        const pl = this._tr.sizeMap.get(parent.sn);
        let rx = 0, ry = 0, rz = 0, ct = 0, ra = param.angleRand, co = 0, wb = 0, curve = Vector3.ZERO;

        this._calcWindBeginAndEnd(level, swing, soft);

        if (param.sphere) { //圆球状排列
            ct = 1;
            const num = sideNum + topNum;
            const rr = TreeUtils.genUniformCoordsOnSphere(num);
            for (let i = 0; i < num; i++) {
                rx = rr[i].lon;
                ry = rr[i].lat;
                rz = num == 1 ? 0 : rand.random(0, 360);
                wb = parent.we * ct + parent.wb * (1 - ct);
                curve = cfg.getCurve(paramParent.curve, ct, pl);
                this._makeSquama(parent, level, this._sn++, wb, this._we, parent.wp,
                    curve.x, ct * pl, curve.y, rx, ry, rz);
            }
        } else {
            for (let i = 0; i < sideNum; i++) {
                rx = rand.random(param.angleSide - ra, param.angleSide + ra);
                ry += 180 + rand.random(-90, 90);
                co = (i / param.sideGrp | 0) * param.sideGrp;
                ct = cfg.getSquamaPos(co);
                wb = parent.we * ct + parent.wb * (1 - ct);
                curve = cfg.getCurve(paramParent.curve, ct, pl);
                this._makeSquama(parent, level, this._sn++, wb, this._we, parent.wp,
                    curve.x, ct * pl, curve.y, rx, ry, 0);
            }
            for (let i = 0; i < topNum; i++) {
                rx = rand.random(param.angleTop - ra, param.angleTop + ra);
                ry += 180 + rand.random(-90, 90);
                ct = 0.98 + rand.random(-0.03, 0.03);
                wb = parent.we * ct + parent.wb * (1 - ct);
                curve = cfg.getCurve(paramParent.curve, ct, pl);
                this._makeSquama(parent, level, this._sn++, wb, this._we, parent.wp,
                    curve.x, ct * pl, curve.y, rx, ry, 0);
            }
        }
    }

    /**
     * 生成树叶
     * @param parent 父节点
     */
    private _createLeaf(parent: TreeSprite3D) {
        const cfg = this._tr.cfg;
        const rand = this._tr.rand;
        const level = parent.level;
        const pl = this._tr.sizeMap.get(parent.sn);
        const param = cfg.param.leaf;
        const topNum = param.topNum;
        const sideNum = param.sideNum;
        const posRand = param.posRand;
        const angle = param.angle;
        const ar = param.angleRand;
        const grp = param.group;
        const step = 1 / sideNum;
        const paramParent = level == 0 ? cfg.param.trunk : cfg.param.branch[level - 1];
        let rx = 0, ry = 0, rz = 0, ct = 0, co = 0, wb = 0, curve = Vector3.ZERO;

        if (param.sphere) { //圆球状排列
            ct = 1;
            const num = sideNum + topNum;
            const rr = TreeUtils.genUniformCoordsOnSphere(num);
            for (let i = 0; i < num; i++) {
                rx = rr[i].lon;
                ry = rr[i].lat;
                rz = num == 1 ? 0 : rand.random(0, 360);
                wb = parent.we * ct + parent.wb * (1 - ct);
                curve = cfg.getCurve(paramParent.curve, ct, pl);
                this._makeLeaf(parent, level, this._sn++, wb, wb, parent.wp,
                    curve.x, ct * pl, curve.y, rx, ry, rz, param.direction);
            }
        } else {
            for (let i = 0; i < sideNum; i++) {
                rx = rand.random(290, 320);
                ry = rand.random(0, 360);
                co = (i / grp | 0) * grp;
                ct = rand.random(step * (co + 1 - posRand), step * (co + 1)) * 0.8 + 0.1;
                wb = parent.we * ct + parent.wb * (1 - ct);
                curve = cfg.getCurve(paramParent.curve, ct, pl);
                this._makeLeaf(parent, level, this._sn++, wb, wb, parent.wp,
                    curve.x, ct * pl, curve.y, rx, ry, 0, param.direction);
            }
            for (let i = 0; i < topNum; i++) {
                rx = rand.random(255, 285);
                ry = 90 + angle.x + rand.random(-ar, ar);
                curve = cfg.getCurve(paramParent.curve, 1, pl);
                this._makeLeaf(parent, level, this._sn++,
                    parent.we, parent.we, parent.wp, curve.x, pl, curve.y, rx, ry);
            }
        }
    }

    /**
     * 生成花朵
     * @param parent 树枝
     */
    private _createFlower(parent: TreeSprite3D) {
        const cfg = this._tr.cfg;
        const rand = this._tr.rand;
        const level = parent.level;
        const pl = this._tr.sizeMap.get(parent.sn);
        const param = cfg.param.flower;
        const topNum = param.topNum;
        const sideNum = param.sideNum;
        const posRand = param.posRand;
        const angle = param.angle;
        const ar = param.angleRand;
        const grp = param.group;
        const step = 1 / sideNum;
        const paramParent = level == 0 ? cfg.param.trunk : cfg.param.branch[level - 1];
        let rx = 0, ry = 0, rz = 0, ct = 0, co = 0, wb = 0, curve = Vector3.ZERO;

        if (param.sphere) { //圆球状排列
            ct = 1;
            const num = sideNum + topNum;
            const rr = TreeUtils.genUniformCoordsOnSphere(num);
            for (let i = 0; i < num; i++) {
                rx = rr[i].lon;
                ry = rr[i].lat;
                rz = num == 1 ? 0 : rand.random(0, 360);
                wb = parent.we * ct + parent.wb * (1 - ct);
                curve = cfg.getCurve(paramParent.curve, ct, pl);
                this._makeFlower(parent, level, this._sn++, wb, wb, parent.wp,
                    curve.x, ct * pl, curve.y, rx, ry, 0, param.direction);
            }
        } else {
            for (let i = 0; i < sideNum; i++) {
                rx = rand.random(290, 320);
                ry = rand.random(0, 360);
                co = (i / grp | 0) * grp;
                ct = rand.random(step * (co + 1 - posRand), step * (co + 1)) * 0.8 + 0.2;
                wb = parent.we * ct + parent.wb * (1 - ct);
                curve = cfg.getCurve(paramParent.curve, ct, pl);
                this._makeFlower(parent, level, this._sn++, wb, wb, parent.wp,
                    curve.x, ct * pl, curve.y, rx, ry, 0, param.direction);
            }
            for (let i = 0; i < topNum; i++) {
                rx = angle.x + rand.random(-ar, ar);
                ry = angle.y; rz = angle.z;
                curve = cfg.getCurve(paramParent.curve, 1, pl);
                this._makeFlower(parent, level, this._sn++,
                    parent.we, parent.we, parent.wp, curve.x, pl, curve.y, rx, ry, rz);
            }
        }
    }

    /**
     * 生成一个树枝
     * @param parent 
     * @param type 
     * @param level 
     * @param sn 
     * @param wb 
     * @param we 
     * @param wp 
     * @param px 
     * @param py 
     * @param pz 
     * @param rx 
     * @param ry 
     * @param rz 
     * @param direction 
     */
    private _makeTrunk(parent: TreeSprite3D, type: number, level: number, sn: number,
        wb: number = 0, we: number = 0, wp: number = 0,
        px: number = 0, py: number = 0, pz: number = 0,
        rx: number = 0, ry: number = 0, rz: number = 0,
        direction: number = 0) {
        const ts3d = new TreeSprite3D(sn);
        ts3d.wb = wb;
        ts3d.we = we < wb ? wb : we;
        ts3d.wp = wp;
        ts3d.type = type;
        ts3d.level = level;
        ts3d.direction = direction;
        ts3d.isRoot = true;
        ts3d.transform.localPositionX = px;
        ts3d.transform.localPositionY = py;
        ts3d.transform.localPositionZ = pz;
        ts3d.transform.localRotationEulerX = rx;
        ts3d.transform.localRotationEulerY = ry;
        ts3d.transform.localRotationEulerZ = rz;
        if (parent) {
            parent.addChild(ts3d);
            this._branch[level - 1].push(ts3d);
        } else this._trunk = ts3d;
        return ts3d;
    }

    /**
     * 生成一片树叶
     * @param parent 
     * @param level 
     * @param sn 
     * @param wb 
     * @param we 
     * @param wp 
     * @param px 
     * @param py 
     * @param pz 
     * @param rx 
     * @param ry 
     * @param rz 
     * @param direction 
     */
    private _makeLeaf(parent: TreeSprite3D, level: number, sn: number,
        wb: number = 0, we: number = 0, wp: number = 0,
        px: number = 0, py: number = 0, pz: number = 0,
        rx: number = 0, ry: number = 0, rz: number = 0,
        direction: number = 0) {
        if (parent) {
            const ts3d = new TreeSprite3D(sn);
            ts3d.wb = wb;
            ts3d.we = we < wb ? wb : we;
            ts3d.wp = wp;
            ts3d.type = 5;
            ts3d.level = level;
            ts3d.direction = direction;
            ts3d.transform.localPositionX = px;
            ts3d.transform.localPositionY = py;
            ts3d.transform.localPositionZ = pz;
            ts3d.transform.localRotationEulerX = rx;
            ts3d.transform.localRotationEulerY = ry;
            ts3d.transform.localRotationEulerZ = rz;
            parent.addChild(ts3d);
            this._leaf.push(ts3d);
            return ts3d;
        }
        return null;
    }

    /**
     * 生成一片蕨叶
     * @param parent 
     * @param level 
     * @param sn 
     * @param wb 
     * @param we 
     * @param wp 
     * @param px 
     * @param py 
     * @param pz 
     * @param rx 
     * @param ry 
     * @param rz 
     */
    private _makeFrond(parent: TreeSprite3D, level: number, sn: number,
        wb: number = 0, we: number = 0, wp: number = 0,
        px: number = 0, py: number = 0, pz: number = 0,
        rx: number = 0, ry: number = 0, rz: number = 0) {
        if (parent) {
            const ts3d = new TreeSprite3D(sn);
            ts3d.wb = wb;
            ts3d.we = we < wb ? wb : we;
            ts3d.wp = wp;
            ts3d.type = 3;
            ts3d.level = level;
            ts3d.transform.localPositionX = px;
            ts3d.transform.localPositionY = py;
            ts3d.transform.localPositionZ = pz;
            ts3d.transform.localRotationEulerX = rx;
            ts3d.transform.localRotationEulerY = ry;
            ts3d.transform.localRotationEulerZ = rz;
            parent.addChild(ts3d);
            this._frond.push(ts3d);
            return ts3d;
        }
        return null;
    }

    /**
     * 生成一片鳞叶
     * @param parent 
     * @param level 
     * @param sn 
     * @param wb 
     * @param we 
     * @param wp 
     * @param px 
     * @param py 
     * @param pz 
     * @param rx 
     * @param ry 
     * @param rz 
     */
    private _makeSquama(parent: TreeSprite3D, level: number, sn: number,
        wb: number = 0, we: number = 0, wp: number = 0,
        px: number = 0, py: number = 0, pz: number = 0,
        rx: number = 0, ry: number = 0, rz: number = 0) {
        if (parent) {
            const ts3d = new TreeSprite3D(sn);
            ts3d.wb = wb;
            ts3d.we = we < wb ? wb : we;
            ts3d.wp = wp;
            ts3d.type = 4;
            ts3d.level = level;
            ts3d.transform.localPositionX = px;
            ts3d.transform.localPositionY = py;
            ts3d.transform.localPositionZ = pz;
            ts3d.transform.localRotationEulerX = rx;
            ts3d.transform.localRotationEulerY = ry;
            ts3d.transform.localRotationEulerZ = rz;
            parent.addChild(ts3d);
            this._squama.push(ts3d);
            return ts3d;
        }
        return null;
    }

    /**
     * 生成一个花朵
     * @param parent 
     * @param level 
     * @param sn 
     * @param wb 
     * @param we 
     * @param wp 
     * @param px 
     * @param py 
     * @param pz 
     * @param rx 
     * @param ry 
     * @param rz 
     * @param direction 
     */
    private _makeFlower(parent: TreeSprite3D, level: number, sn: number,
        wb: number = 0, we: number = 0, wp: number = 0,
        px: number = 0, py: number = 0, pz: number = 0,
        rx: number = 0, ry: number = 0, rz: number = 0,
        direction: number = 0) {
        if (parent) {
            const ts3d = new TreeSprite3D(sn);
            ts3d.wb = wb;
            ts3d.we = we < wb ? wb : we;
            ts3d.wp = wp;
            ts3d.type = 6;
            ts3d.level = level;
            ts3d.direction = direction;
            ts3d.transform.localPositionX = px;
            ts3d.transform.localPositionY = py;
            ts3d.transform.localPositionZ = pz;
            ts3d.transform.localRotationEulerX = rx;
            ts3d.transform.localRotationEulerY = ry;
            ts3d.transform.localRotationEulerZ = rz;
            parent.addChild(ts3d);
            this._flower.push(ts3d);
            return ts3d;
        }
        return null;
    }

    /**
     * 渲染到数据
     * @param data 
     * @param bbox 
     * @param code 
     */
    private _renderData(data: Uint16Array, bbox: BoundBox, code: number) {
        const tr = this._tr;
        const cfg = tr.cfg;
        const rand = this._rand;
        const vec1 = this._tempVec1;
        const vec2 = this._tempVec2;
        const vec3 = this._tempVec3;
        const mat1 = this._tempMat1;
        const mat2 = this._tempMat2;
        const quat = this._tempQuat;
        const corners = this._tempCorn;
        const e1 = mat1.elements;
        bbox.min.x = bbox.min.y = bbox.min.z = Number.MAX_VALUE;
        bbox.max.x = bbox.max.y = bbox.max.z = -Number.MAX_VALUE;
        let ox = 0, oz = 0;
        let wb = 0, we = 0, wp = 0;
        let e = this._trunk.transform.worldMatrix.elements;
        this._trunk.transform.worldMatrix.decomposeYawPitchRoll(vec1);
        Quaternion.createFromYawPitchRoll(vec1.x, vec1.y, vec1.z, quat);
        rand.setSeed(1);

        const _getOXZ = (ts3d: TreeSprite3D) => {
            let parent = ts3d;
            while (!parent.isRoot && !parent.parent)
                parent = parent.parent as TreeSprite3D;
            const mat = parent.transform.worldMatrix;
            ox = mat.elements[12];
            oz = mat.elements[14];
        }
        const _toData = (sn: number, parent: number = 0) => {
            let index = cfg.dataLength * code + sn * cfg.dataStep;
            data[index++] = HalfFloatUtils.roundToFloat16Bits(e[12]); //位置
            data[index++] = HalfFloatUtils.roundToFloat16Bits(e[13]);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(e[14]);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(parent); //父节点编号
            data[index++] = HalfFloatUtils.roundToFloat16Bits(quat.x); //旋转
            data[index++] = HalfFloatUtils.roundToFloat16Bits(quat.y);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(quat.z);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(quat.w);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(wb); //风参
            data[index++] = HalfFloatUtils.roundToFloat16Bits(we);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(wp);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(0);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(ox); //原点
            data[index++] = HalfFloatUtils.roundToFloat16Bits(oz);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(0);
            data[index++] = HalfFloatUtils.roundToFloat16Bits(0);
        };
        const _toBBox = (bb: BoundBox, mat: Matrix4x4) => {
            if (bb) {
                bb.getCorners(corners);
                if (mat) {
                    for (let i = 0; i < 8; i++)
                        Vector3.transformCoordinate(corners[i], mat, corners[i]);
                }
                for (let i = 0; i < 8; i++) {
                    bbox.min.x = Math.min(bbox.min.x, corners[i].x);
                    bbox.min.y = Math.min(bbox.min.y, corners[i].y);
                    bbox.min.z = Math.min(bbox.min.z, corners[i].z);
                    bbox.max.x = Math.max(bbox.max.x, corners[i].x);
                    bbox.max.y = Math.max(bbox.max.y, corners[i].y);
                    bbox.max.z = Math.max(bbox.max.z, corners[i].z);
                }
            }
        };
        wb = this._trunk.wb;
        we = this._trunk.we;
        wp = this._trunk.wp;
        if (!cfg.param.trunk.hide) {
            _toData(0);
            _toBBox(tr.bbMap.get(0), null);
        }

        //树枝
        for (let i = 0, len = this._branch.length; i < len; i++) {
            const branchs = this._branch[i];
            for (let j = 0, len = branchs.length; j < len; j++) {
                const branch = branchs[j];
                const mat = branch.transform.worldMatrix;
                e = mat.elements;
                const px = e[12], py = e[13], pz = e[14];
                switch (branch.direction) {
                    case 1: //竖直向上
                        Matrix4x4.createRotationY(rand.random(0, Math.PI * 2), mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        branch.transform.worldMatrix = mat1;
                        break;
                    case 2: //竖直向下
                        Matrix4x4.createRotationYawPitchRoll(rand.random(0, Math.PI * 2), Math.PI, 0, mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        branch.transform.worldMatrix = mat1;
                        break;
                    case 3: //水平方向
                        Matrix4x4.createRotationYawPitchRoll(rand.random(0, Math.PI * 2), Math.PI * 0.5, 0, mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        branch.transform.worldMatrix = mat1;
                        break;
                }
                branch.transform.worldMatrix.decomposeYawPitchRoll(vec1);
                Quaternion.createFromYawPitchRoll(vec1.x, vec1.y, vec1.z, quat);
                wb = branch.wb;
                we = branch.we;
                wp = branch.wp;
                _getOXZ(branch); //@ts-ignore
                _toData(branch.sn, branch.parent.sn);
                _toBBox(tr.bbMap.get(branch.sn), branch.transform.worldMatrix);
            }
        }

        //树叶
        if (cfg.param.leaf) {
            const angle = cfg.param.leaf.angle;
            const ar = cfg.param.leaf.angleRand;
            for (let i = 0, len = this._leaf.length; i < len; i++) {
                const leaf = this._leaf[i];
                const mat = leaf.transform.worldMatrix;
                e = mat.elements;
                const px = e[12], py = e[13], pz = e[14];
                switch (leaf.direction) {
                    case 1: //竖直向上
                        Matrix4x4.createRotationYawPitchRoll(0, -Math.PI * 0.5, rand.random(0, Math.PI), mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        leaf.transform.worldMatrix = mat1;
                        break;
                    case 2: //竖直向下
                        Matrix4x4.createRotationYawPitchRoll(0, Math.PI * 0.5, rand.random(0, Math.PI), mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        leaf.transform.worldMatrix = mat1;
                        break;
                    case 3: //水平方向
                        const pe = (leaf.parent as TreeSprite3D).transform.worldMatrix.elements;
                        const x = (angle.x + rand.random(-ar, ar)) * MathEx.DEG2RAD;
                        const y = (angle.y + rand.random(-ar, ar)) * MathEx.DEG2RAD;
                        const z = (angle.z + rand.random(-ar, ar)) * MathEx.DEG2RAD;
                        const xx = i % 2 == 0 ? x + Math.PI : x;
                        Matrix4x4.createRotationYawPitchRoll(xx, y, z, mat2);
                        for (let j = 0; j < 16; j++)
                            e1[j] = pe[j];
                        e1[12] = 0, e1[13] = 0, e1[14] = 0;
                        Matrix4x4.multiply(mat1, mat2, mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        leaf.transform.worldMatrix = mat1;
                        break;
                }
                leaf.transform.worldMatrix.decomposeYawPitchRoll(vec1);
                Quaternion.createFromYawPitchRoll(vec1.x, vec1.y, vec1.z, quat);
                wb = leaf.wb;
                we = leaf.we;
                wp = leaf.wp;
                _getOXZ(leaf); //@ts-ignore
                _toData(leaf.sn, leaf.parent.sn);
                _toBBox(tr.bbMap.get(leaf.sn), leaf.transform.worldMatrix);
            }
        }

        //蕨叶
        if (cfg.param.frond) {
            for (let i = 0, len = this._frond.length; i < len; i++) {
                const frond = this._frond[i];
                const mat = frond.transform.worldMatrix;
                e = mat.elements;
                frond.transform.worldMatrix.decomposeTransRotScale(vec2, quat, vec3);
                frond.transform.worldMatrix.decomposeYawPitchRoll(vec1);
                if (cfg.param.frond.willow) { //柳条模式，下垂
                    vec1.z = 0;
                    vec1.y = Math.PI;
                }
                Quaternion.createFromYawPitchRoll(vec1.x, vec1.y, vec1.z, quat);
                Matrix4x4.createAffineTransformation(vec2, quat, vec3, mat1);
                wb = frond.wb;
                we = frond.we;
                wp = frond.wp;
                _getOXZ(frond); //@ts-ignore
                _toData(frond.sn, frond.parent.sn);
                _toBBox(tr.bbMap.get(frond.sn), mat1);
            }
        }

        //鳞叶
        if (cfg.param.squama) {
            for (let i = 0, len = this._squama.length; i < len; i++) {
                const squama = this._squama[i];
                const mat = squama.transform.worldMatrix;
                e = mat.elements;
                squama.transform.worldMatrix.decomposeYawPitchRoll(vec1);
                Quaternion.createFromYawPitchRoll(vec1.x, vec1.y, vec1.z, quat);
                wb = squama.wb;
                we = squama.we;
                wp = squama.wp;
                _getOXZ(squama); //@ts-ignore
                _toData(squama.sn, squama.parent.sn);
                _toBBox(tr.bbMap.get(squama.sn), mat);
            }
        }

        //花朵
        if (cfg.param.flower) {
            const angle = cfg.param.flower.angle;
            const ar = cfg.param.flower.angleRand;
            for (let i = 0, len = this._flower.length; i < len; i++) {
                const flower = this._flower[i];
                const mat = flower.transform.worldMatrix;
                e = mat.elements;
                const px = e[12], py = e[13], pz = e[14];
                switch (flower.direction) {
                    case 1: //竖直向上
                        Matrix4x4.createRotationYawPitchRoll(0, 0, 0, mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        flower.transform.worldMatrix = mat1;
                        break;
                    case 2: //竖直向下
                        Matrix4x4.createRotationYawPitchRoll(0, 0, Math.PI, mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        flower.transform.worldMatrix = mat1;
                        break;
                    case 3: //水平方向
                        const x = (angle.x + rand.random(-ar, ar)) * MathEx.DEG2RAD;
                        const y = (angle.y + rand.random(-ar, ar)) * MathEx.DEG2RAD;
                        const z = (angle.z + rand.random(-ar, ar)) * MathEx.DEG2RAD;
                        const zz = i % 2 == 0 ? z + Math.PI : z;
                        Matrix4x4.createRotationYawPitchRoll(x, y, zz, mat1);
                        e1[12] = px, e1[13] = py, e1[14] = pz;
                        flower.transform.worldMatrix = mat1;
                        break;
                }
                flower.transform.worldMatrix.decomposeYawPitchRoll(vec1);
                Quaternion.createFromYawPitchRoll(vec1.x, vec1.y, vec1.z, quat);
                wb = flower.wb;
                we = flower.we;
                wp = flower.wp;
                _getOXZ(flower); //@ts-ignore
                _toData(flower.sn, flower.parent.sn);
                _toBBox(tr.bbMap.get(flower.sn), flower.transform.worldMatrix);
            }
        }
    }

    /**
     * 清除
     */
    clear() {
        this._trunk = null;
        for (let i = 0; i < 4; i++)
            this._branch[i].length = 0;
        this._flower.length = 0;
        this._squama.length = 0;
        this._frond.length = 0;
        this._leaf.length = 0;
        this._sn = 0;
    }
}