import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { TreeConfig } from "./TreeConfig";
import { TreeResource } from "./TreeResource";
import { TreeTexManager } from "./TreeTexManager";

/**
 * 植物资源管理器
 */
export class TreeResManager {
    camera: Camera;
    ttm: TreeTexManager; //树木贴图资源管理器（生成管理树木贴图）
    trs: Map<string, TreeResource> = new Map();
    loading: Set<string> = new Set(); //正在加载的资源

    private static _resIdCount: number = 0;

    constructor(camera: Camera) {
        this.camera = camera;
        this.ttm = new TreeTexManager();
    }

    /**
     * 获取下一个唯一树木资源编号
     */
    static nextResId() { return this._resIdCount++; };

    /**
     * 每帧调用
     */
    everyFrame() {
        this.ttm.everyFrame();
    }

    /**
     * 添加树木资源
     * @param cfg 
     * @returns 
     */
    addTree(cfg: string) {
        if (this.trs.has(cfg)) {
            console.warn("该树木资源已经存在!");
            return true;
        }
        if (this.loading.has(cfg)) {
            console.warn("该树木资源正在加载!");
            return true;
        }
        this.loading.add(cfg);
        Laya.loader.load({ url: cfg, type: Loader.JSON },
            Handler.create(this, (tr: any) => {
                if (tr) {
                    const tc = new TreeConfig();
                    tc.initParam();
                    tc.copyParam(tr.data);
                    tc.calcBranchAndLeafNum();
                    tc.calcFaceNum();
                    const tres = new TreeResource(TreeResManager.nextResId(), "", tc, this.ttm);
                    this.trs.set(cfg, tres);
                    this.loading.delete(cfg);
                }
            }));
        return true;
    }

    /**
     * 更新树木资源
     * @param cfg 
     * @returns 
     */
    updateTree(cfg: string) {
        const old = this.trs.get(cfg);
        if (old) {
            Laya.loader.load({ url: cfg, type: Loader.JSON },
                Handler.create(this, (tr: any) => {
                    old.destroy();
                    const tc = new TreeConfig();
                    tc.setParam(tr.data);
                    tc.calcBranchAndLeafNum();
                    tc.calcFaceNum();
                    const tres = new TreeResource(TreeResManager.nextResId(), "", tc, this.ttm);
                    this.trs.set(cfg, tres);
                }));
            return true;
        }
        return false;
    }

    /**
     * 删除树木资源
     * @param cfg  
     * @returns 
     */
    delTree(cfg: string) {
        const tr = this.trs.get(cfg);
        if (tr) {
            tr.destroy();
            this.trs.delete(cfg);
            return true;
        }
        return false;
    }

    /**
     * 通过type查找树木资源
     * @param cfg  
     * @returns 
     */
    getTreeResource(cfg: string) {
        return this.trs.get(cfg);
    }

    /**
     * 获取树木资源的数量
     * @returns 
     */
    getTreeResourceNum() {
        return this.trs.size;
    }

    /**
     * 销毁
     */
    destroy() {
        this.trs.forEach(tr => tr.destroy());
        this.trs.clear();
        this.loading.clear();
        this.ttm.destroy();
    }
}