import { Laya } from "Laya";
import { Vector2 } from "laya/maths/Vector2";
import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { TreeSystem } from "./TreeSystem";
import { TreeLibrary } from "./TreeLibrary";
import { MathEx } from "../utils/MathEx";

/**
 * 植物区域
 */
export class TreeField {
    id: number = 0; //区域id
    addLeft: number = 0; //添加植物余量
    addTimer: number = 0; //添加植物计时器
    addCount: number = 0; //添加植物计数器
    treeTypes: number[]; //植物类型列表
    treeIds: number[]; //单元植物id列表
    groupIds: number[]; //组合植物id列表
    posArray: Vector3[]; //位置列表
    squareField: Vector4; //植物矩形区域（x1, z1, x2, z2）
    circleField: Vector3; //植物圆形区域（cx, cz, r）
    neat: boolean = false; //是否整齐
    ts: TreeSystem; //植物系统
    queryHeight: Function; //查找高度的函数（用于支持地形）

    constructor(id: number, ts: TreeSystem) {
        this.id = id;
        this.ts = ts;
    }

    /**
     * 添加矩形区域植物
     * @param num 
     * @param types 
     * @param x1 
     * @param z1 
     * @param x2 
     * @param z2 
     */
    squareFieldTree(num: number, types: number[], x1: number, z1: number, x2: number, z2: number) {
        if (this.squareField || this.circleField) return; //植物已经添加
        this.addLeft = num;
        this.addTimer = 0;
        this.addCount = 0;
        this.squareField = new Vector4(x1, z1, x2, z2);
        this.posArray = MathEx.kMeansSquare(num, x1, x2, 0, 0, z1, z2);
        this.treeTypes = types;
        this.treeIds = [];
        this.groupIds = [];
    }

    /**
     * 添加圆形区域植物
     * @param num 
     * @param types 
     * @param cx 
     * @param cz 
     * @param r 
     */
    circleFieldTree(num: number, types: number[], cx: number, cz: number, r: number) {
        if (this.squareField || this.circleField) return; //植物已经添加
        this.addLeft = num;
        this.addTimer = 0;
        this.addCount = 0;
        this.circleField = new Vector3(cx, cz, r);
        this.posArray = MathEx.kMeansCircleY(num, cx, 0, cz, r);
        this.treeTypes = types;
        this.treeIds = [];
        this.groupIds = [];
    }

    /**
     * 每帧执行
     */
    everyFrame() {
        if (this.addLeft > 0) {
            this.addTimer += Laya.timer.delta;
            if (this.addTimer > 10) {
                this.addTimer = 0;
                for (let i = 0; i < 100; i++) {
                    let type = MathEx.random(0, this.treeTypes.length) | 0;
                    type = this.treeTypes[type]
                    if (type < TreeLibrary.TYPE_MAX) {
                        const cfg = this.ts.tal.getTreeCfgFileByType(type);
                        const id = TreeSystem.nextId();
                        this._addTree(id, cfg);
                        this.treeIds.push(id);
                    } else {
                        const cfg = this.ts.tgl.getGroupCfgFileByType(type);
                        const id = TreeSystem.nextId();
                        this._addGroup(id, cfg);
                        this.groupIds.push(id);
                    }
                    this.addLeft--;
                    this.addCount++;
                    if (this.addLeft <= 0)
                        break;
                }
            }
        }
    }

    /**
     * 本区域内是否包含指定的植物id
     * @param id 
     */
    haveTree(id: number) {
        if (this.treeIds.indexOf(id) != -1)
            return true;
        if (this.groupIds.indexOf(id) != -1)
            return true;
        for (let i = 0, len = this.groupIds.length; i < len; i++)
            if (this.ts.treeInGroup(id, this.groupIds[i]))
                return true;
        return false;
    }

    /**
     * 添加单元植物（随机位置）
     * @param type 植物种类
     */
    private _addTree(id: number, cfg: string) {
        const x = this.posArray[this.addCount].x;
        const z = this.posArray[this.addCount].z;
        const y = this.queryHeight ? this.queryHeight(x, z) : 0;
        const utp = {
            pos: new Vector3(x, y, z),
            rot: new Vector3(0, MathEx.random(0, 360), 0),
            grow: 1,
        }
        this.ts.addTree(id, cfg, utp, 0);
        return id;
    }

    /**
     * 添加组合植物（随机位置）
     * @param type 植物种类
     */
    private _addGroup(id: number, cfg: string) {
        const x = this.posArray[this.addCount].x;
        const z = this.posArray[this.addCount].z;
        const y = this.queryHeight ? this.queryHeight(x, z) : 0;
        const utp = {
            pos: new Vector3(x, y, z),
            rot: new Vector3(0, MathEx.random(0, 360), 0),
            grow: 1,
        }
        this.ts.addGroup(id, cfg, utp);
        return id;
    }
}

/**
 * 区域植物管理器
 */
export class TreeFieldManager {
    ts: TreeSystem;
    tfs: Map<number, TreeField> = new Map();
    tpos: Vector2[] = [];
    idCount: number = 0;
    queryHeight: Function; //查找高度的函数（用于支持地形）

    constructor(ts: TreeSystem) {
        this.ts = ts;
    }

    /**
     * 每帧调用
     */
    everyFrame() {
        this.tfs.forEach(tf => tf.everyFrame());
    }

    /**
     * 添加矩形区域植物
     * @param num 
     * @param types  
     * @param x1 
     * @param z1 
     * @param x2 
     * @param z2 
     * @param neat 
     */
    addSquareFieldTree(num: number, types: number[], x1: number, z1: number, x2: number, z2: number, neat: boolean = false) {
        const tf = new TreeField(this.idCount++, this.ts);
        tf.neat = neat;
        tf.queryHeight = this.queryHeight;
        tf.squareFieldTree(num, types, x1, z1, x2, z2);
        this.tfs.set(tf.id, tf);
        return tf.id;
    }

    /**
     * 添加圆形区域植物
     * @param num 
     * @param types  
     * @param cx 
     * @param cz 
     * @param r 
     * @param neat 
     */
    addCircleFieldTree(num: number, types: number[], cx: number, cz: number, r: number, neat: boolean = false) {
        const tf = new TreeField(this.idCount++, this.ts);
        tf.neat = neat;
        tf.queryHeight = this.queryHeight;
        tf.circleFieldTree(num, types, cx, cz, r);
        this.tfs.set(tf.id, tf);
        return tf.id;
    }

    /**
     * 移除植物区域
     * @param id 
     */
    removeTreeField(id: number) {
        const tf = this.tfs.get(id);
        if (tf) {
            if (tf.treeIds)
                for (let i = 0; i < tf.treeIds.length; i++)
                    this.ts.remove(tf.treeIds[i]);
            if (tf.groupIds)
                for (let i = 0; i < tf.groupIds.length; i++)
                    this.ts.remove(tf.groupIds[i]);
            this.tfs.delete(id);
        }
    }

    /**
     * 通过植物id查找区域
     * @param id 
     */
    getFieldById(id: number) {
        let tfo: TreeField = null;
        this.tfs.forEach(tf => {
            if (tf.haveTree(id))
                tfo = tf;
        });
        return tfo;
    }

    /**
     * 获取一批植物位置分布，保持均匀间隔
     * @param range 范围
     * @param num 数量
     */
    getTreePosArray(range: number, num: number) {
        return MathEx.kMeansSquare(num, -range, range, 0, 0, -range, range);
    }
}