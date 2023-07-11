import { Camera } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { TreeAgent } from "./TreeAgent";
import { Tree } from "./Tree";
import { TreeUtils } from "./TreeUtils";
import { Vector3 } from "laya/maths/Vector3";
import { TreeResource } from "./TreeResource";
import { TreeRender } from "./TreeRender";
import { TreeResManager } from "./TreeResManager";
import { TreeGroup } from "./TreeGroup";
import { Laya } from "Laya";
import { TreeLibrary } from "./TreeLibrary";
import { TreeGroupLibrary } from "./TreeGroupLibrary";
import { TreeShaderInit } from "./material/tree/TreeShaderInit";
import { TreeMaterial } from "./material/tree/TreeMaterial";
import { ImposterShaderInit } from "./material/imposter/ImposterShaderInit";
import { ImposterMaterial } from "./material/imposter/ImposterMaterial";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { TreePhysics } from "./TreePhysics";
import { Functions } from "../utils/Functions";
import { MathEx } from "../utils/MathEx";
import { TreeInstanceManager } from "./TreeInstanceManager";
import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
import { Vector2 } from "laya/maths/Vector2";
import { Ray } from "laya/d3/math/Ray";
import { BoundsUtils } from "../utils/BoundsUtils";

type UseTreeParam = {
    havePot?: boolean;
    grow?: number;
    pos?: Vector3;
    rot?: Vector3;
    scale?: number;
}

class LateAddTree {
    id: number;
    cfg: string;
    utp: UseTreeParam;
    code: number;
    timer: number;

    constructor(id: number, cfg: string, utp: UseTreeParam, code: number) {
        this.id = id;
        this.cfg = cfg;
        this.utp = utp;
        this.code = code;
        this.timer = Laya.timer.currTimer;
    }

    load(ts: TreeSystem) {
        if (Laya.timer.currTimer - this.timer < 200)
            return false;
        this.timer = Laya.timer.currTimer;
        return ts.addTree(this.id, this.cfg, this.utp, this.code, false);
    }
}

class LateAddGroup {
    id: number;
    cfg: string;
    tg: TreeGroup;
    utp: UseTreeParam;
    timer: number;

    constructor(id: number, cfg: string | TreeGroup, utp: UseTreeParam) {
        this.id = id;
        if (cfg instanceof TreeGroup)
            this.tg = cfg;
        else this.cfg = cfg;
        this.utp = utp;
        this.timer = Laya.timer.currTimer;
    }

    load(ts: TreeSystem) {
        if (Laya.timer.currTimer - this.timer < 200)
            return false;
        this.timer = Laya.timer.currTimer;
        if (this.tg)
            return ts.addGroupByTg(this.id, this.tg, this.utp, false);
        return ts.addGroup(this.id, this.cfg, this.utp, false);
    }
}

/**
 * 植物管理系统
 */
export class TreeSystem {
    private _scene: Scene3D; //场景
    private _camera: Camera; //相机
    private _render: TreeRender; //树木渲染器
    private _agent: Map<number, TreeAgent> = new Map(); //单元植物表
    private _group: Map<number, TreeGroup> = new Map(); //组合植物表

    tal: TreeLibrary; //单元植物库
    tgl: TreeGroupLibrary; //组合植物库
    trm: TreeResManager; //植物渲染资源管理器（组织Instance渲染）
    phy: TreePhysics; //物理系统接口

    season: number; //季节系数（0~3，0：春，1：夏，2：秋，3：冬）
    hideAll: boolean = false; //是否隐藏所有树木

    private _lateAddTree: LateAddTree[] = []; //延迟加载单元植物
    private _lateAddGroup: LateAddGroup[] = []; //延迟加载组合植物

    private static _idCount: number = 0; //植物计数器（用于生成唯一id）

    static texRef: Map<string, number> = new Map(); //全局范围植物贴图引用计数，用于单独管理植物贴图

    private _out: any = []; //输出组
    private _ray: Ray = new Ray(new Vector3(), new Vector3()); //射线
    private _line: PixelLineSprite3D; //显示包围盒用
    private _mousePoint: Vector2 = new Vector2(); //鼠标位置

    constructor(scene: Scene3D, camera: Camera) {
        TreeUtils.__init__();
        TreeShaderInit.__init__();
        TreeInstanceManager.__init__();
        ImposterShaderInit.__init__();
        TreeMaterial.__init__();
        ImposterMaterial.__init__();
        this._scene = scene;
        this._camera = camera;
        this.tal = new TreeLibrary;
        this.tgl = new TreeGroupLibrary;
        this.trm = new TreeResManager(camera);
        this._render = new TreeRender(camera);

        this._line = scene.addChild(new PixelLineSprite3D(10000));
    }

    /**
     * 获取下一个唯一编号
     */
    static nextId() { return this._idCount++; }

    /**
     * 每帧调用
     */
    everyFrame() {
        const pos = this._camera.transform.position;
        this._agent.forEach(ta => ta.everyFrame(pos));
        this._group.forEach(tg => tg.everyFrame(pos));
        this._render.updateRenderData(); //更新可视范围内渲染数据
        this.trm.everyFrame();
        this._line.clear();

        //添加到渲染队列
        if (!this.hideAll) {
            const frustum = this._camera.boundFrustum;
            this._agent.forEach(ta => {
                if (!ta.isCull(frustum)) {
                    ta.addVisibleTreeCamera();
                    ta.addVisibleTreeShadow();
                }
                //ta.addVisibleTreeShadow();
            });
            this._group.forEach(tg => {
                if (!tg.isCull(frustum)) {
                    tg.addVisibleTreeCamera();
                    tg.addVisibleTreeShadow();
                }
                //tg.addVisibleTreeShadow();
            });
        }

        //处理延迟加载
        let addTreeCount = 0;
        if (this._lateAddTree.length > 0) {
            for (let i = 0; i < this._lateAddTree.length; i++) {
                if (this._lateAddTree[i].load(this)) {
                    this._lateAddTree.splice(i--, 1);
                    addTreeCount++;
                    if (addTreeCount >= 10) return;
                }
            }
        }
        if (this._lateAddGroup.length > 0) {
            for (let i = 0; i < this._lateAddGroup.length; i++) {
                if (this._lateAddGroup[i].load(this)) {
                    this._lateAddGroup.splice(i--, 1);
                    addTreeCount += 3;
                    if (addTreeCount >= 10) return;
                }
            }
        }
    }

    /**
     * 更新可视树木，由BVC系统调用
     * @param tas 通过裁剪的树木代理
     */
    updateVisibleTreeCamera(tas: TreeAgent[]) {
        for (let i = tas.length - 1; i > -1; i--)
            tas[i].addVisibleTreeCamera();
    }

    /**
     * 更新可视树木，由BVC系统调用
     * @param tas 通过裁剪的树木代理
     */
    updateVisibleTreeShadow(tas: TreeAgent[]) {
        for (let i = tas.length - 1; i > -1; i--)
            tas[i].addVisibleTreeShadow();
    }

    /**
     * 更新可视树木，由BVC系统调用
     * @param tas 通过裁剪的树木代理
     */
    updateVisibleTreeGroupCamera(tgs: TreeGroup[]) {
        for (let i = tgs.length - 1; i > -1; i--)
            tgs[i].addVisibleTreeCamera();
    }

    /**
     * 更新可视树木，由BVC系统调用
     * @param tas 通过裁剪的树木代理
     */
    updateVisibleTreeGroupShadow(tgs: TreeGroup[]) {
        for (let i = tgs.length - 1; i > -1; i--)
            tgs[i].addVisibleTreeShadow();
    }

    /**
     * 添加组合植物
     * @param id 
     * @param cfg 
     * @param utp 
     * @param late 
     */
    addGroup(id: number, cfg: string, utp: UseTreeParam, late: boolean = true) {
        const _next = () => {
            let ready = true; //检查资源是否准备好
            tg.buildAgent(); //建立树木代理
            tg.tas.forEach(ta => {
                const tr = this.trm.trs.get(ta.cfg);
                if (!tr) {
                    ready = false;
                    if (late)
                        this.trm.addTree(ta.cfg);
                }
            });
            if (ready) { //资源已经准备好，加载树木
                const s3d = tg.root;
                if (utp && utp.pos) {
                    s3d.transform.localPositionX = utp.pos.x;
                    s3d.transform.localPositionY = utp.pos.y;
                    s3d.transform.localPositionZ = utp.pos.z;
                }
                if (utp && utp.rot) {
                    s3d.transform.localRotationEulerX = utp.rot.x;
                    s3d.transform.localRotationEulerY = utp.rot.y;
                    s3d.transform.localRotationEulerZ = utp.rot.z;
                }
                if (utp && utp.scale) {
                    s3d.transform.localScaleX = utp.scale;
                    s3d.transform.localScaleY = utp.scale;
                    s3d.transform.localScaleZ = utp.scale;
                }
                tg.tas.forEach(ta => {
                    const tr = this.trm.trs.get(ta.cfg);
                    this._agentAddTree(ta, tr, 1);
                });
                tg.updateBoundBox(); //更新包围盒
                this._group.set(id, tg);
                this._scene.addChild(tg);
                if (this.phy) {
                    tg.tas.forEach(ta => {
                        if (ta.tree.tr.pickMesh)
                            this.phy.add(ta.plantId, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
                    });
                }
            } else if (late) { //资源还没有准备好，加入延迟加载队列
                this._lateAddGroup.push(new LateAddGroup(id, cfg, utp));
                tg.destroy();
            }
        };

        if (id < 0) //生成一个id
            id = TreeSystem.nextId();
        const tg = new TreeGroup(id, this.tal);
        tg.loadConfig(cfg, _next);
        return true;
    }

    /**
     * 添加组合植物
     * @param id 
     * @param tg 
     * @param utp 
     * @param late 
     */
    addGroupByTg(id: number, tg: TreeGroup, utp: UseTreeParam, late: boolean = true) {
        if (!tg || tg.param.res.length == 0) return false; //信息错误
        if (id < 0) //生成一个id
            id = TreeSystem.nextId();
        let ready = true; //检查资源是否准备好
        tg.buildAgent(); //建立树木代理
        tg.tas.forEach(ta => {
            const tr = this.trm.trs.get(ta.cfg);
            if (!tr) {
                ready = false;
                if (late)
                    this.trm.addTree(ta.cfg);
            }
        });
        if (ready) { //资源已经准备好，加载树木
            const s3d = tg.root;
            if (utp && utp.pos) {
                s3d.transform.localPositionX = utp.pos.x;
                s3d.transform.localPositionY = utp.pos.y;
                s3d.transform.localPositionZ = utp.pos.z;
            }
            if (utp && utp.rot) {
                s3d.transform.localRotationEulerX = utp.rot.x;
                s3d.transform.localRotationEulerY = utp.rot.y;
                s3d.transform.localRotationEulerZ = utp.rot.z;
            }
            if (utp && utp.scale) {
                s3d.transform.localScaleX = utp.scale;
                s3d.transform.localScaleY = utp.scale;
                s3d.transform.localScaleZ = utp.scale;
            }
            tg.tas.forEach(ta => {
                const tr = this.trm.trs.get(ta.cfg);
                this._agentAddTree(ta, tr, 1);
            });
            tg.updateBoundBox(); //更新包围盒
            this._group.set(id, tg);
            this._scene.addChild(tg);
            if (this.phy) {
                tg.tas.forEach(ta => {
                    if (ta.tree.tr.pickMesh)
                        this.phy.add(ta.plantId, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
                });
            }
            return true;
        } else if (late) //资源还没有准备好，加入延迟加载队列
            this._lateAddGroup.push(new LateAddGroup(id, tg, utp));
        return false;
    }

    /**
     * 添加树木
     * @param id 树木实例编号
     * @param cfg 树木配置文件
     * @param utp 树木参数
     * @param code 树木形状编号（决定树形状）
     * @param late 是否加入延迟加载队列
     */
    addTree(id: number, cfg: string, utp: UseTreeParam, code: number = 0, late: boolean = true) {
        if (id < 0) //生成一个id
            id = TreeSystem.nextId();
        if (!this._agent.has(id)) {
            const tr = this.trm.trs.get(cfg);
            if (tr) {
                const ta = new TreeAgent(id, cfg, code);
                ta.luminance = tr.cfg.param.luminance;
                ta.saturation = tr.cfg.param.saturation;
                this._agent.set(id, ta);
                this._agentAddTree(ta, tr, utp.grow != undefined ? utp.grow : 1);
                if (utp && utp.pos) ta.setPosition(utp.pos.x, utp.pos.y, utp.pos.z);
                if (utp && utp.rot) ta.setRotation(utp.rot.x, utp.rot.y, utp.rot.z);
                if (utp && utp.scale) ta.setScale(utp.scale);
                this._scene.addChild(ta);
                if (this.phy && ta.tree.tr.pickMesh)
                    this.phy.add(id, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
                return true;
            } else if (late) {
                this.trm.addTree(cfg);
                this._lateAddTree.push(new LateAddTree(id, cfg, utp, code));
            }
            return false;
        }
        return true;
    }

    /**
     * 通过代理添加树木
     * @param ta 树木代理
     * @param tr 树木资源
     * @param grow 生长系数
     */
    private _agentAddTree(ta: TreeAgent, tr: TreeResource, grow: number) {
        if (ta) {
            if (!ta.tree) {
                const tree = new Tree(ta.plantId, ta.code, grow, ta.showPot ? 0 : 1, tr, this._render);
                tree.luminance = ta.luminance;
                tree.saturation = ta.saturation;
                tree.hue = ta.hue;
                tree.createTree();
                ta.setTree(tree);
                ta.updateTransform();
                ta.updateBoundBox();
            }
        }
    }

    /**
     * 通过代理删除树木
     * @param ta 树木代理
     */
    private _agentDelTree(ta: TreeAgent) {
        if (ta) {
            if (ta.tree)
                ta.tree.destroy();
            ta.tree = null;
        }
    }

    /**
     * 隐藏植物
     * @param id 植物唯一编码
     * @param hide 是否隐藏
     */
    hide(id: number, hide: boolean) {
        const ta = this._agent.get(id);
        if (ta) {
            ta.setHide(hide);
            return true;
        }
        const tg = this._group.get(id);
        if (tg) {
            tg.setHide(hide);
            return true;
        }
        if (this.phy)
            this.phy.hide(id, hide);
        return false;
    }

    /**
     * 删除植物
     * @param id 植物唯一编码
     */
    remove(id: number) {
        const ta = this._agent.get(id);
        if (ta) {
            this._agent.delete(id);
            this._agentDelTree(ta);
            this._scene.removeChild(ta);
            if (this.phy)
                this.phy.remove(id);
            ta.destroy();
            console.log("removeTree id =", id);
            return true;
        }
        const tg = this._group.get(id);
        if (tg) {
            this._group.delete(id);
            tg.tas.forEach(ta => {
                this._agentDelTree(ta);
                this._scene.removeChild(ta);
                if (this.phy)
                    this.phy.remove(ta.plantId);
                ta.destroy();
            });
            this._scene.removeChild(tg);
            console.log("removeGroup id =", id);
            tg.destroy();
            return true;
        }
        return false;
    }

    /**
     * 清除植物
     */
    clear() {
        this._agent.forEach(ta => {
            this._agentDelTree(ta);
            this._scene.removeChild(ta);
            ta.destroy();
        });
        this._agent.clear();

        this._group.forEach(tg => {
            tg.tas.forEach(ta => {
                this._agentDelTree(ta);
                this._scene.removeChild(ta);
                ta.destroy();
            });
            this._scene.removeChild(tg);
            tg.destroy();
        });
        this._group.clear();

        if (this.phy)
            this.phy.clear();
    }

    /**
     * 获取植物
     * @param id 植物唯一编码
     */
    get(id: number) {
        const ta = this._agent.get(id);
        if (ta) return ta;
        return this._group.get(id);
    }

    /**
     * 获取包围盒
     * @param id 植物唯一编码
     */
    getBoundBox(id: number) {
        const t = this.get(id);
        return t ? t.getBoundBox() : null;
    }

    /**
     * 指定编号的单元植物是否在指定编号的组合植物内
     * @param treeId 
     * @param groupId 
     */
    treeInGroup(treeId: number, groupId: number) {
        const tg = this._group.get(groupId);
        if (tg) return tg.haveTree(treeId);
        return false;
    }

    /**
     * 设置植物位置
     * @param id 植物唯一编码
     * @param x 位置坐标x
     * @param y 位置坐标y
     * @param z 位置坐标z
     */
    setPosition(id: number, x: number, y: number, z: number) {
        const ta = this._agent.get(id);
        if (ta) {
            ta.setPosition(x, y, z);
            if (this.phy && ta.tree.tr.pickMesh)
                this.phy.update(id, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
            return true;
        }
        const tg = this._group.get(id);
        if (tg) {
            tg.setPosition(x, y, z);
            if (this.phy) {
                tg.tas.forEach(ta => {
                    if (ta.tree.tr.pickMesh)
                        this.phy.update(ta.plantId, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
                });
            }
            return true;
        }
        return false;
    }

    /**
     * 设置植物旋转
     * @param id 植物唯一编码
     * @param x 旋转角度x
     * @param y 旋转角度y
     * @param z 旋转角度z
     */
    setRotation(id: number, x: number, y: number, z: number) {
        const ta = this._agent.get(id);
        if (ta) {
            ta.setRotation(x, y, z);
            if (this.phy && ta.tree.tr.pickMesh)
                this.phy.update(id, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
            return true;
        }
        const tg = this._group.get(id);
        if (tg) {
            tg.setRotation(x, y, z);
            if (this.phy) {
                tg.tas.forEach(ta => {
                    if (ta.tree.tr.pickMesh)
                        this.phy.update(ta.plantId, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
                });
            }
            return true;
        }
        return false;
    }

    /**
     * 获取植物放缩
     * @param id 植物唯一编码
     */
    getScale(id: number) {
        const ta = this._agent.get(id);
        if (ta) return ta.transform.localScaleX;
        const tg = this._group.get(id);
        if (tg) return tg.transform.localScaleX;
        return 1;
    }

    /**
     * 设置植物放缩
     * @param id 植物唯一编码
     * @param s 放缩比例
     */
    setScale(id: number, s: number) {
        const ta = this._agent.get(id);
        if (ta) {
            ta.setScale(s);
            if (this.phy && ta.tree.tr.pickMesh)
                this.phy.update(id, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
            return true;
        }
        const tg = this._group.get(id);
        if (tg) {
            tg.setScale(s);
            if (this.phy) {
                tg.tas.forEach(ta => {
                    if (ta.tree.tr.pickMesh)
                        this.phy.update(ta.plantId, ta.getBoundBox(), ta.tree.tr.pickMesh, ta.transform.worldMatrix);
                });
            }
            return true;
        }
        return false;
    }

    /**
     * 设置植物生长值
     * @param grow 
     */
    setGrow(grow: number) {
        this._agent.forEach(ta => ta.setGrow(grow));
        this._group.forEach(tg => tg.setGrow(grow));
    }

    /**
     * 保存场景文件
     * @param file 
     */
    saveScene(file: string) {
        //类型统计
        const singleMap: Map<string, TreeAgent[]> = new Map();
        this._agent.forEach(ta => {
            const s = singleMap.get(ta.cfg);
            if (s) s.push(ta);
            else singleMap.set(ta.cfg, [ta]);
        });

        const groupMap: Map<string, TreeGroup[]> = new Map();
        this._group.forEach(tg => {
            const s = groupMap.get(tg.cfg);
            if (s) s.push(tg);
            else groupMap.set(tg.cfg, [tg]);
        });

        const _round = (v: number) => { return (v * 1000 | 0) / 1000; };

        const param = { treeSingle: [], treeGroup: [] };
        singleMap.forEach(tas => { //单元植物组
            const utps = [];
            for (let i = 0; i < tas.length; i++) {
                const t = tas[i].transform;
                const utp = {
                    //havePot: true,
                    //grow: tas[i].grow,
                    pos: { x: _round(t.localPositionX), y: _round(t.localPositionY), z: _round(t.localPositionZ) },
                    rot: { x: _round(t.localRotationEulerX), y: _round(t.localRotationEulerY), z: _round(t.localRotationEulerZ) },
                    scale: t.localScaleX,
                    //code: tas[i].code,
                };
                if (t.localScaleX != 1)
                    utp["code"] = t.localScaleX;
                utps.push(utp);
            }
            const name = this.tal.getNameFromCfg(tas[0].cfg);
            const type = this.tal.getTypeFromName(name);
            const sn = this.tal.getKindFromCfg(tas[0].cfg);
            param.treeSingle.push({ name, type, sn, utps });
        });
        groupMap.forEach(tgs => { //组合植物
            const utps = [];
            for (let i = 0; i < tgs.length; i++) {
                const t = tgs[i].root.transform;
                const utp = {
                    //havePot: true,
                    //grow: tgs[i].grow,
                    pos: { x: t.localPositionX, y: t.localPositionY, z: t.localPositionZ },
                    rot: { x: t.localRotationEulerX, y: t.localRotationEulerY, z: t.localRotationEulerZ },
                    scale: t.localScaleX,
                };
                if (t.localScaleX != 1)
                    utp["code"] = t.localScaleX;
                utps.push(utp);
            }
            const name = this.tgl.getNameFromCfg(tgs[0].cfg);
            const type = this.tgl.getTypeFromName(name);
            const sn = this.tgl.getKindFromCfg(tgs[0].cfg)
            param.treeGroup.push({ name, type, sn, utps });
        });
        Functions.saveDataToJsonFile(param, file);
    }

    /**
     * 加载场景文件
     * @param file 
     */
    loadScene(file: string) {
        Laya.loader.load({ url: file, type: Loader.JSON },
            Handler.create(this, (tr: any) => {
                if (tr) {
                    if (tr.data.treeSingle) {
                        const tss = tr.data.treeSingle;
                        for (let i = 0, len = tss.length; i < len; i++) {
                            const ts = tss[i];
                            const cfg = this.tal.getTreeCfgFileByType(ts.type, ts.sn);
                            for (let j = 0, len = ts.utps.length; j < len; j++) {
                                const id = TreeSystem.nextId();
                                this.addTree(id, cfg, ts.utps[j]);
                            }
                        }
                    }
                    if (tr.data.treeGroup) {
                        const tgs = tr.data.treeGroup;
                        for (let i = 0, len = tgs.length; i < len; i++) {
                            const tg = tgs[i];
                            const cfg = this.tgl.getGroupCfgFileByType(tg.type, tg.sn);
                            for (let j = 0, len = tg.utps.length; j < len; j++) {
                                const id = TreeSystem.nextId();
                                this.addGroup(id, cfg, tg.utps[j]);
                            }
                        }
                    }
                }
            }));
    }

    /**
     * 设置季节系数
     * @param season 
     */
    setSeason(season: number) {
        this.season = MathEx.clamp(season, 0, 3);
        this._agent.forEach(ta => ta.setSeason(this.season));
        this._group.forEach(tg => tg.setSeason(this.season));
    }

    /**
     * 鼠标点选树木单元
     * @param camera 
     */
    mousePickTree(camera: Camera) {
        this._mousePoint.x = Laya.stage.mouseX;
        this._mousePoint.y = Laya.stage.mouseY;
        const out = this._out;
        out.length = 0;
        camera.viewportPointToRay(this._mousePoint, this._ray);
        const num = this._getTreeAgentByRay(this._ray, out);

        for (let i = 0; i < num; i++) {
            if (out[i].rayPick(this._ray))
                return out[i];
        }
        for (let i = 0; i < num; i++) {
            if (!out[i].havePickMesh())
                return out[i];
        }
        return null;
    }

    /**
     * 鼠标点选树木组合
     * @param camera 
     */
    mousePickGroup(camera: Camera) {
        this._mousePoint.x = Laya.stage.mouseX;
        this._mousePoint.y = Laya.stage.mouseY;
        const out = this._out;
        out.length = 0;
        camera.viewportPointToRay(this._mousePoint, this._ray);
        const num = this._getTreeGroupByRay(this._ray, out);

        for (let i = 0; i < num; i++) {
            if (out[i].rayPick(this._ray))
                return out[i];
        }
        for (let i = 0; i < num; i++) {
            if (!out[i].havePickMesh())
                return out[i];
        }
        return null;
    }

    /**
     * 通过射线查找树木代理
     * @param ray 射线
     * @param out 输出树木代理组
     * @returns 
     */
    private _getTreeAgentByRay(ray: Ray, out: any[]) {
        this._agent.forEach(ta => {
            const bb = ta.getBoundBox();
            const dist = BoundsUtils.rayIntersectBox(ray,
                bb.min.x, bb.min.y, bb.min.z,
                bb.max.x, bb.max.y, bb.max.z);
            if (dist != -1) { //@ts-ignore
                ta.pickDist = dist;
                out.push(ta);
            }
        });
        out.sort((a, b) => { return a.pickDist - b.pickDist; });
        return out.length;
    }

    /**
     * 通过射线查找树木组合
     * @param ray 射线
     * @param out 输出树木组合组
     * @returns 
     */
    private _getTreeGroupByRay(ray: Ray, out: any[]) {
        this._group.forEach(tg => {
            const bb = tg.getBoundBox();
            const dist = BoundsUtils.rayIntersectBox(ray,
                bb.min.x, bb.min.y, bb.min.z,
                bb.max.x, bb.max.y, bb.max.z);
            if (dist != -1) { //@ts-ignore
                tg.pickDist = dist;
                out.push(tg);
            }
        });
        out.sort((a, b) => { return a.pickDist - b.pickDist; });
        return out.length;
    }

    /**
     * 销毁
     */
    destroy() {
        this.clear();
        this._render.destroy();
    }
}