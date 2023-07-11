import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Tree } from "./Tree";
import { TreeAgent } from "./TreeAgent";
import { TreeConfig, TreeRandomGenParam } from "./TreeConfig";
import { TreeRender } from "./TreeRender";
import { TreeResource } from "./TreeResource";
import { TreeTexManager } from "./TreeTexManager";
import { MathEx } from "../utils/MathEx";
import { Functions } from "../utils/Functions";
import { Sprite3D } from "laya/d3/core/Sprite3D";

/**
 * 树木编辑类
 */
export class TreeEdit {
    tr: TreeResource;
    ttm: TreeTexManager;
    private _ta: TreeAgent;
    // private _line: PixelLineSprite3D;
    private _render: TreeRender;
    private _needSnap: boolean = true;
    public _needUpdate: boolean = false;
    private _hide: boolean = false;
    private _updateTimer: number = 0;
    tree : Tree;

    private _season: number = 0; //季节系数

    constructor() {
        // this._line = scene.addChild(new PixelLineSprite3D(100));
        this._ta = new TreeAgent(0, "", 0);
        this.ttm = new TreeTexManager();
        this.tr = new TreeResource(0, "", new TreeConfig, this.ttm, this._needSnap);
        // this._render = new TreetRender(camera);
        // var sp = scene.addChild(new Sprite3D);
        this._createTree();
        // for(var i = 0; i < this.tree._t3ds.length; i++)
        // {
        //     scene.addChild(scene);
        // }
    }

    get UpdateState()
    {
        return this._needUpdate;
    }

    /**
     * 需要更新
     */
    updateTree() {
        this._needUpdate = true;
        this.tr.cfg.calcBranchAndLeafNum();
        this.tr.cfg.calcFaceNum();

    }

    /**
     * 需要刷新
     */
    refreshTree() {
        console.log("refreshTree！！！");
        this.tr.refresh();
        this._refreshTree();
    }

    /**
     * 更新参数
     */
    updateParam() {
        this.tr.material.setWind(this.tr.cfg.wind);
        this.tr.material.season = this._season;
    }

    /**
     * 创建树木
     */
    public _createTree() {
        const cfg = this.tr.cfg;
        this.tree = new Tree(0, 0, cfg.grow, 0, this.tr, this._render);
        this.tree.createTree();
        // this.tree.addVisibleTreeCamera();
        // //@ts-ignore
        // this.tree._render.updateRenderData();
        if (this._ta.tree)
            this._ta.tree.destroy();
        this._ta.setTree(this.tree);
        this._ta.setDrop(this.tr.cfg.param.drop);
        this._ta.luminance = cfg.param.luminance;
        this._ta.saturation = cfg.param.saturation;
        // this._line.clear();
        // if (cfg.showBound)
        //     Functions.drawBound(this._line, this.tr.bbox[this.tree.code], Color.GREEN);
    }

    /**
     * 刷新树木
     */
    private _refreshTree() {
        const cfg = this.tr.cfg;
        const tree = this._ta.tree;
        tree.grow = cfg.grow;
        this._ta.setDrop(this.tr.cfg.param.drop);
        this._ta.luminance = cfg.param.luminance;
        this._ta.saturation = cfg.param.saturation;
        // this._line.clear();
        // if (cfg.showBound)
            // Functions.drawBound(this._line, this.tr.bbox[tree.code], Color.GREEN);
    }

    /**
     * 每帧调用
     * @param cameraPos 相机位置
     */
    everyFrame(cameraPos: Vector3) {
        this._updateTimer += Laya.timer.delta;
        if (this._updateTimer > 30) {
            this._updateTimer = 0;
            if (this._needUpdate) {
                this._needUpdate = false;
                this.tr.update();
                this._createTree();
            }
        }
        // this.ttm.everyFrame();
        // this._ta.everyFrame(cameraPos);
        
        // if (!this._hide) {
        //     this._render.addVisibleTreeCamera(this._ta.tree);
        //     this._render.updateRenderData();
        // }
    }

    /**
     * 初始化配置
     */
    initConfig() {
        this.tr.initConfig();
    }

    /**
     * 随机配置
     */
    randConfig() {
        this.tr.randConfig();
    }

    /**
     * 进化配置
     * @param percent
     */
    evolveConfig(percent: number) {
        this.tr.evolveConfig(percent);
    }

    /**
     * 下一个配置
     * @param percent 
     */
    nextConfig(percent: number) {
        this.tr.nextConfig(percent);
    }

    /**
     * 根据控制参数随机生成配置
     * @param trgp 
     */
    genConfig(trgp: TreeRandomGenParam) {
        this.tr.genConfig(trgp);
    }

    /**
     * 保存配置（JSON文件）
     * @param file 
     */
    saveConfig(file: string) {
        this.tr.saveConfig(file);
    }

    /**
     * 加载配置（JSON文件）
     * @param cfg 
     * @param next 
     * @param copy 是否拷贝参数，否则替换参数对象
     */
    loadConfig(cfg: string | TreeConfig, next: Function, copy: boolean = true) {
        this.tr.loadConfig(cfg, next, copy);
    }

    /**
     * 设置季节系数
     * @param season 
     */
    setSeason(season: number) {
        this._season = MathEx.clamp(season, 0, 3);
        this._ta.setSeason(this._season);
    }

    /**
     * 调整高矮
     * @param rate 
     */
    adjHeight(rate: number) {
        this.tr.adjHeight(rate);
    }

    /**
     * 调整粗细
     * @param rate 
     */
    adjWide(rate: number) {
        this.tr.adjWide(rate);
    }

    /**
     * 调整弯曲
     * @param rate 
     */
    adjCurve(rate: number) {
        this.tr.adjCurve(rate);
    }

    /**
     * 调整树枝
     * @param rate 
     */
    adjBranch(rate: number) {
        this.tr.adjBranch(rate);
    }

    /**
     * 调整树叶
     * @param rate 
     */
    adjLeaf(rate: number) {
        this.tr.adjLeaf(rate);
    }

    /**
     * 调整亮度
     * @param rate 
     */
    adjLuminance(rate: number) {
        this.tr.adjLuminance(rate);
    }

    /**
     * 调整色度
     * @param rate 
     */
    adjSaturation(rate: number) {
        this.tr.adjSaturation(rate);
    }

    /**
     * 调整随机数种子
     */
    adjSeed() {
        this.tr.adjSeed();
    }

    /**
     * 是否隐藏
     * @param hide 
     */
    hide(hide: boolean) {
        this._hide = hide;
    }

    /**
     * 销毁
     */
    destroy() {
        this.tr.destroy();
        this._ta.destroy();
        // this._line.destroy();
        this._render.destroy();
    }
}