// import { Laya } from "Laya";
// import { Camera } from "laya/d3/core/Camera";
// import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
// import { Scene3D } from "laya/d3/core/scene/Scene3D";
// import { Color } from "laya/maths/Color";
// import { Vector3 } from "laya/maths/Vector3";
// import { Utils3D } from "laya/d3/utils/Utils3D";
// import { Button } from "laya/ui/Button";
// import { Tree } from "./Tree";
// import { TreeAgent } from "./TreeAgent";
// import { TreeConfig } from "./TreeConfig";
// import { TreeRender } from "./TreeRender";
// import { TreeResource } from "./TreeResource";
// import { TreeSystem } from "./TreeSystem";
// import { TreeTexManager } from "./TreeTexManager";
// import { MathEx } from "../utils/MathEx";

// type TreeOp = {
//     desc: string,
//     op: Function,
//     num?: number,
//     inter?: number,
//     update?: boolean,
// };

// /**
//  * 树木编辑录像类
//  */
// export class TreeVideo {
//     ts: TreeSystem;
//     tr: TreeResource;
//     ttm: TreeTexManager;
//     private _ta: TreeAgent;
//     private _line: PixelLineSprite3D;
//     private _render: TreeRender;
//     private _needSnap: boolean = true;
//     private _needUpdate: boolean = false;
//     private _updateTimer: number = 0;

//     private _season: number = 0; //季节系数

//     private _ops: TreeOp[] = [];
//     private _opInter: number = 100;
//     private _opTimer: number = 0;
//     private _opSpeed: number = 1;
//     private _opPoint: number = -2;
//     private _info: Button;
//     private _camera: Camera;
//     private _forward: Vector3 = new Vector3();

//     private _grow: number = 0;

//     constructor(scene: Scene3D, camera: Camera) {
//         this._camera = camera;
//         this._camera.transform.getForward(this._forward);

//         this._line = scene.addChild(new PixelLineSprite3D(100));
//         this._ta = new TreeAgent(0, "", 0);
//         this.ttm = new TreeTexManager();
//         this.tr = new TreeResource(0, "", new TreeConfig, this.ttm, this._needSnap);
//         this._render = new TreeRender(camera);
//         this._createTree();

//         this._info = new Button();
//         this._info.pos(900, 1100);
//         this._info.size(700, 30);
//         this._info.labelBold = true;
//         this._info.labelSize = 30;
//         this._info.labelColors = "#ffffff";
//         this._info.label = "";
//         Laya.stage.addChild(this._info);
//     }

//     private _createOp_editTree() {
//         const cfg = this.tr.cfg;
//         const param = cfg.param;
//         cfg.wind.x = 0;
//         cfg.showFlower = true;

//         this._ops = [
//             { desc: "树木主干长度", op: () => { param.trunk.length += 0.05; }, num: 20, inter: 20 },
//             { desc: "树木主干粗细", op: () => { param.trunk.radius += 0.001; }, num: 20, inter: 20 },
//             { desc: "树木主干粗细", op: () => { param.trunk.radiusBegin += 0.025; }, num: 20, inter: 20 },
//             { desc: "树木主干弯曲", op: () => { param.trunk.curve[1].x += 0.01; }, num: 2, inter: 20 },
//             { desc: "树木主干弯曲", op: () => { param.trunk.curve[2].x += 0.01; }, num: 4, inter: 20 },
//             { desc: "树木主干弯曲", op: () => { param.trunk.curve[3].x += 0.01; param.trunk.curve[3].z += 0.01; }, num: 8, inter: 20 },
//             { desc: "树木主干弯曲", op: () => { param.trunk.curve[5].x += 0.004; param.trunk.curve[5].z += 0.004; }, num: 6, inter: 20 },
//             { desc: "添加第一层周边树枝", op: () => { param.branch[0].sideNum++; }, num: 8 },
//             { desc: "添加第一层顶部树枝", op: () => { param.branch[0].topNum++; }, num: 2 },
//             { desc: "调整第一层树枝粗细", op: () => { param.branch[0].radius -= 0.0005; }, num: 10, inter: 20 },
//             { desc: "调整第一层树枝位置", op: () => { param.branch[0].posEnd += 0.015; }, num: 10, inter: 20 },
//             { desc: "调整第一层树枝位置", op: () => { param.branch[0].posBegin -= 0.015; }, num: 10, inter: 20 },
//             { desc: "调整第一层树枝组合", op: () => { param.branch[0].sideGrp++; }, num: 3 },
//             { desc: "调整第一层树枝角度", op: () => { param.branch[0].angleSide -= 1; }, num: 20, inter: 20 },
//             { desc: "调整第一层树枝角度", op: () => { param.branch[0].angleTop -= 1; }, num: 20, inter: 20 },
//             { desc: "调整第一层树枝长度", op: () => { param.branch[0].length += 0.01; }, num: 10, inter: 20 },
//             { desc: "调整第一层树枝长度", op: () => { param.branch[0].lenBegin += 0.02; }, num: 15, inter: 20 },
//             { desc: "调整第一层树枝弯曲", op: () => { param.branch[0].curve[5].x += 0.01; }, num: 10, inter: 20 },
//             { desc: "调整第一层树枝弯曲", op: () => { param.branch[0].curve[4].x += 0.01; }, num: 10, inter: 20 },
//             { desc: "添加第二层周边树枝", op: () => { param.branch[1].sideNum = 2; } },
//             { desc: "添加第二层顶部树枝", op: () => { param.branch[1].topNum = 2; } },
//             { desc: "添加第三层周边树枝", op: () => { param.branch[2].sideNum = 2; } },
//             { desc: "添加第三层顶部树枝", op: () => { param.branch[2].topNum = 2; } },
//             { desc: "添加第四层周边树枝", op: () => { param.branch[3].sideNum = 1; } },
//             { desc: "添加第四层顶部树枝", op: () => { param.branch[3].topNum = 2; } },
//             { desc: "重力影响", op: () => { param.drop -= 0.1; }, num: 10, inter: 20 },
//             { desc: "树枝弯曲", op: () => { param.branch[0].curve[5].x -= 0.02; }, num: 15, inter: 20 },
//             { desc: "添加树叶", op: () => { param.leaf.topNum = 1; param.leaf.sideNum = 5; } },
//             { desc: "调整树叶尺寸", op: () => { param.leaf.length += 0.0015; param.leaf.width += 0.0012; }, num: 50, inter: 20 },
//             { desc: "添加花朵", op: () => { param.flower.topNum = 1; param.flower.sideNum = 1; } },
//             { desc: "调整花朵尺寸", op: () => { param.flower.radius += 0.0006; param.flower.width += 0.0012; }, num: 25, inter: 20 },
//             { desc: "树木生长演示", op: () => { cfg.grow -= 0.0075; }, num: 100, inter: 10 },
//             { desc: "树木生长演示", op: () => { cfg.grow += 0.0075; }, num: 100, inter: 10 },
//             { desc: "逐渐增强的风力", op: () => { cfg.wind.x += 0.05; }, num: 100, inter: 20, update: false },
//             { desc: "逐渐增强的风力", op: () => { }, inter: 2000, update: false },
//             // { desc: "LOD演示(拉远)", op: () => { this._camera.transform.localPositionZ += 0.1; }, num: 600, inter: 10, update: false },
//             // { desc: "LOD演示(拉近)", op: () => { this._camera.transform.localPositionZ -= 0.1; }, num: 600, inter: 10, update: false },
//             // { desc: "不同树木展示1", op: () => { this.loadConfig("res/layaverse/tree/tree01/01.json", null); }, inter: 2000 },
//             // { desc: "不同树木展示2", op: () => { this.loadConfig("res/layaverse/tree/tree01/02.json", null); }, inter: 2000 },
//             // { desc: "不同树木展示3", op: () => { this.loadConfig("res/layaverse/tree/tree01/03.json", null); }, inter: 2000 },
//             // { desc: "不同树木展示4", op: () => { this.loadConfig("res/layaverse/tree/tree01/04.json", null); }, inter: 2000 },
//             // { desc: "不同树木展示5", op: () => { this.loadConfig("res/layaverse/tree/tree01/05.json", null); }, inter: 2000 },
//             // { desc: "千树森林展示", op: () => { }, inter: 2000, update: false },
//         ];
//     }

//     private _createOp() {
//         this._grow = 0;
//         this._ops = [
//             // {
//             //     desc: "", op: () => {
//             //         this._grow += 0.005;
//             //         this.ts.setGrow(this._grow);
//             //     }, num: 200, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //         this._camera.transform.localPositionX += this._forward.x * 0.1;
//             //         this._camera.transform.localPositionY += this._forward.y * 0.1;
//             //         this._camera.transform.localPositionZ += this._forward.z * 0.1;
//             //     }, num: 200, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //     }, num: 100, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //         this._camera.transform.localPositionX += this._forward.x * 0.1;
//             //         this._camera.transform.localPositionY += this._forward.y * 0.1;
//             //         this._camera.transform.localPositionZ += this._forward.z * 0.1;
//             //     }, num: 250, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //     }, num: 100, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //         this._camera.transform.localPositionX += this._forward.x * 0.1;
//             //         this._camera.transform.localPositionY += this._forward.y * 0.1;
//             //         this._camera.transform.localPositionZ += this._forward.z * 0.1;
//             //     }, num: 270, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //     }, num: 100, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //         this._camera.transform.localPositionX += this._forward.x * 0.1;
//             //         this._camera.transform.localPositionY += this._forward.y * 0.1;
//             //         this._camera.transform.localPositionZ += this._forward.z * 0.1;
//             //     }, num: 120, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //     }, num: 100, inter: 10, update: false
//             // },
//             // {
//             //     desc: "", op: () => {
//             //         this._camera.transform.localPositionX -= this._forward.x * 0.1;
//             //         this._camera.transform.localPositionY -= this._forward.y * 0.1;
//             //         this._camera.transform.localPositionZ -= this._forward.z * 0.1;
//             //     }, num: 850, inter: 10, update: false
//             // },
//         ];
//     }

//     /**
//      * 开始播放
//      */
//     start() {
//         this._createOp_editTree();
//         this._opPoint = -1;
//     }

//     /**
//      * 更新树木
//      */
//     updateTree() {
//         this._needUpdate = true;
//         this.tr.cfg.calcBranchAndLeafNum();
//         this.tr.cfg.calcFaceNum();
//     }

//     /**
//      * 需要刷新
//      */
//     refreshTree() {
//         this.tr.refresh();
//         this._refreshTree();
//     }

//     /**
//      * 更新参数
//      */
//     updateParam() {
//         this.tr.material.setWind(this.tr.cfg.wind);
//         this.tr.material.season = this._season;
//     }

//     /**
//      * 创建树木
//      */
//     private _createTree() {
//         const cfg = this.tr.cfg;
//         const tree = new Tree(0, 0, cfg.grow, 0, this.tr, this._render);
//         tree.createTree();
//         if (this._ta.tree)
//             this._ta.tree.destroy();
//         this._ta.setTree(tree);
//         this._ta.setDrop(this.tr.cfg.param.drop);
//         this._ta.luminance = cfg.param.luminance;
//         this._ta.saturation = cfg.param.saturation;
//         this._line.clear();
//         if (cfg.showBound) //@ts-ignore
//             Utils3D._drawBound(this._line, this.tr.bbox[tree.code], Color.GREEN);
//     }

//     /**
//      * 刷新树木
//      */
//     private _refreshTree() {
//         const cfg = this.tr.cfg;
//         const tree = this._ta.tree;
//         tree.grow = cfg.grow;
//         this._ta.setDrop(this.tr.cfg.param.drop);
//         this._ta.luminance = cfg.param.luminance;
//         this._ta.saturation = cfg.param.saturation;
//         this._line.clear();
//         if (cfg.showBound) //@ts-ignore
//             Utils3D._drawBound(this._line, this.tr.bbox[tree.code], Color.GREEN);
//     }

//     /**
//      * 每帧调用
//      * @param cameraPos 相机位置
//      */
//     everyFrame(cameraPos: Vector3) {
//         this._updateTimer += Laya.timer.delta;
//         if (this._updateTimer > 30) {
//             this._updateTimer = 0;
//             if (this._needUpdate) {
//                 this._needUpdate = false;
//                 this.tr.update();
//                 this._createTree();
//             }
//         }
//         this._ta.everyFrame(cameraPos);
//         this._render.addVisibleTreeCamera(this._ta.tree);
//         this._render.updateRenderData();

//         if (this._opPoint != -2) {
//             this._opTimer += Laya.timer.delta * this._opSpeed;
//             if (this._opTimer > this._opInter) {
//                 this._opTimer = 0;
//                 this._opPoint++;

//                 if (this._opPoint < this._ops.length) {
//                     const op = this._ops[this._opPoint];
//                     op.op();
//                     this._info.label = op.desc;
//                     if (op.inter != undefined)
//                         this._opInter = op.inter;
//                     else this._opInter = 500;
//                     if (op.num != undefined) {
//                         op.num--;
//                         if (op.num > 0)
//                             this._opPoint--;
//                         else this._opInter = 500;
//                     }
//                     if (op.update == undefined)
//                         this.updateTree();
//                     else this.updateParam();
//                 }
//             }
//         }
//     }

//     /**
//      * 初始化配置
//      */
//     initConfig() {
//         this.tr.initConfig();
//         const param = this.tr.cfg.param;
//         param.trunk.length = 0.1;
//         param.trunk.radius = 0.02;
//         param.trunk.stacks = 10;
//         for (let i = 0; i < 4; i++) {
//             param.branch[i].topNum = 0;
//             param.branch[i].sideNum = 0;
//         }
//         param.leaf.topNum = 0;
//         param.leaf.sideNum = 0;
//         param.flower.topNum = 0;
//         param.flower.sideNum = 0;
//     }

//     /**
//      * 保存配置（JSON文件）
//      * @param file 
//      */
//     saveConfig(file: string) {
//         this.tr.saveConfig(file);
//     }

//     /**
//      * 加载配置（JSON文件）
//      * @param cfg 
//      * @param next 
//      * @param copy 是否拷贝参数，否则替换参数对象
//      */
//     loadConfig(cfg: string, next: Function, copy: boolean = false) {
//         this.tr.loadConfig(cfg, next, copy);
//     }

//     /**
//      * 设置季节系数
//      * @param season 
//      */
//     setSeason(season: number) {
//         this._season = MathEx.clamp(season, 0, 3);
//         this._ta.setSeason(this._season);
//     }

//     /**
//      * 销毁
//      */
//     destroy() {
//         this.tr.destroy();
//         this._ta.destroy();
//         this._line.destroy();
//         this._render.destroy();
//     }
// }