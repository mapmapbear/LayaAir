// import { Laya } from "Laya";
// import { Vector3 } from "laya/maths/Vector3";
// import { TreeSystem } from "./TreeSystem";
// import { Ray } from "laya/d3/math/Ray";
// import { MathEx } from "../utils/MathEx";
// import { Terrain } from "../terrain/Terrain";

// export class TreeTestHelper {
//     addLeft: number = 0; //添加树木余额
//     delLeft: number = 0; //删除树木余额
//     addTimer: number = 0; //添加树木计时器
//     delTimer: number = 0; //删除树木计时器
//     ts: TreeSystem; //植物系统
//     terrain: Terrain; //地形系统
//     pickAddTree: boolean = false; //是否通过拾取放置树木
//     pickAddGroup: boolean = false; //是否通过拾取放置组合

//     private _tempVec31: Vector3 = new Vector3();

//     constructor(ts: TreeSystem, terrain: Terrain) {
//         this.ts = ts;
//         this.terrain = terrain;
//     }

//     /**
//      * 添加一批树木
//      * @param num 
//      */
//     addSomeTree(num: number) {
//         this.addLeft = num;
//         this.addTimer = 0;
//     }

//     /**
//      * 删除一批树木
//      * @param num 
//      */
//     delSomeTree(num: number) {
//         this.delLeft = num;
//         this.delTimer = 0;
//     }

//     /**
//      * 每帧执行
//      */
//     everyFrame() {
//         if (this.addLeft > 0) {
//             this.addTimer += Laya.timer.delta;
//             if (this.addTimer > 10) {
//                 this.addTimer = 0;
//                 const cfg = [];
//                 const n = this.ts.trm.trs.size;
//                 this.ts.trm.trs.forEach((v, k) => cfg.push(k));
//                 if (n > 0) {
//                     for (let i = 0; i < 100; i++) {
//                         this.addOneTree(cfg[i % n]);
//                         this.addLeft--;
//                         if (this.addLeft <= 0)
//                             break;
//                     }
//                 }
//             }
//         }
//         if (this.delLeft > 0) {
//             this.delTimer += Laya.timer.delta;
//             if (this.delTimer > 10) {
//                 this.delTimer = 0;
//                 this.delOneTree();
//                 this.delLeft--;
//             }
//         }
//     }

//     /**
//      * 添加单元植物（随机参数）
//      * @param cfg 
//      */
//     addOneTree(cfg: string) {
//         const id = TreeSystem.nextId();
//         const utp = {
//             pos: new Vector3(MathEx.random(-100, 100), 0, MathEx.random(-100, 100)),
//             rot: new Vector3(0, MathEx.random(0, 360), 0),
//             grow: MathEx.random(0.9, 1),
//         }
//         this.ts.addTree(id, cfg, utp);
//         return id;
//     }

//     /**
//      * 添加单元植物（指定参数）
//      * @param cfg  
//      * @param code 
//      * @param grow 
//      * @param pos 
//      * @param rot 
//      */
//     addOneTreeWithParam(cfg: string, code: number, grow: number, pos: Vector3, rot: Vector3) {
//         const id = TreeSystem.nextId();
//         const utp = { pos, rot, grow }
//         this.ts.addTree(id, cfg, utp, code);
//         return id;
//     }

//     /**
//      * 通过射线捕捉添加单元植物
//      * @param cfg 
//      * @param ray 
//      */
//     addOneTreeByRay(cfg: string, ray: Ray) {
//         if (this.terrain) {
//             const t = this.terrain;
//             const pos = this._tempVec31;
//             if (t.rayIntersect(ray, pos)) {
//                 const x = pos.x;
//                 const z = pos.z;
//                 pos.y -= 0.2;
//                 const slope = t.getSlopeData(x, z) * t.hRatio;
//                 if (slope < 0.95) {
//                     const id = TreeSystem.nextId();
//                     const utp = {
//                         pos,
//                         rot: new Vector3(0, MathEx.random(0, 360), 0),
//                         grow: MathEx.random(0.9, 1),
//                     }
//                     this.ts.addTree(id, cfg, utp);
//                     return id;
//                 } else console.log("坡度太大");
//             }
//         }
//         return 0;
//     }

//     /**
//      * 添加组合植物（随机参数）
//      * @param cfg 
//      */
//     addOneGroup(cfg: string) {
//         const id = TreeSystem.nextId();
//         const utp = {
//             pos: new Vector3(MathEx.random(-100, 100), 0, MathEx.random(-100, 100)),
//             rot: new Vector3(0, MathEx.random(0, 360), 0),
//             grow: MathEx.random(0.9, 1),
//         }
//         this.ts.addGroup(id, cfg, utp);
//         return id;
//     }

//     /**
//      * 添加组合植物（指定参数）
//      * @param cfg  
//      * @param code 
//      * @param grow 
//      * @param pos 
//      * @param rot 
//      */
//     addOneGroupWithParam(cfg: string, grow: number, pos: Vector3, rot: Vector3) {
//         const id = TreeSystem.nextId();
//         const utp = { pos, rot, grow }
//         this.ts.addGroup(id, cfg, utp);
//         return id;
//     }

//     /**
//      * 通过射线捕捉添加组合植物
//      * @param cfg 
//      * @param ray 
//      */
//     addOneGroupByRay(cfg: string, ray: Ray) {
//         if (this.terrain) {
//             const t = this.terrain;
//             const pos = this._tempVec31;
//             if (t.rayIntersect(ray, pos)) {
//                 const x = pos.x;
//                 const z = pos.z;
//                 pos.y -= 0.2;
//                 const slope = t.getSlopeData(x, z) * t.hRatio;
//                 if (slope < 0.95) {
//                     const id = TreeSystem.nextId();
//                     const utp = {
//                         pos,
//                         rot: new Vector3(0, MathEx.random(0, 360), 0),
//                     }
//                     this.ts.addGroup(id, cfg, utp);
//                     return 1;
//                 } else console.log("坡度太大");
//             }
//         }
//         return 0;
//     }

//     /**
//      * 隐藏一棵树木
//      * @param plantId 
//      * @param hide 
//      */
//     hideOneTree(plantId: number, hide: boolean) {
//         this.ts.hide(plantId, hide);
//     }

//     /**
//      * 删除单元植物
//      * @param plantId 
//      */
//     delOneTree(plantId: number = -1) {
//         return this.ts.remove(plantId);
//     }
// }