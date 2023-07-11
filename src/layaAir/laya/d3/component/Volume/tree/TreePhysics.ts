import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { BoundBox } from "laya/d3/math/BoundBox";
import { Color } from "laya/maths/Color";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Functions } from "../utils/Functions";

/**
 * 植物系统和物理系统接口
 */
export class TreePhysics {
    /**
     * 添加植物
     * @param id 
     * @param bb 
     * @param mesh 
     * @param transform 
     */
    add(id: number, bb: BoundBox, mesh: Mesh, transform: Matrix4x4) {
        console.log("TreePhysics add: ", id, bb, mesh, transform);
    }

    /**
     * 更新植物
     * @param id 
     * @param bb 
     * @param mesh 
     * @param transform 
     */
    update(id: number, bb: BoundBox, mesh: Mesh, transform: Matrix4x4) {
        console.log("TreePhysics update: ", id, bb, mesh, transform);
    }

    /**
     * 隐藏植物
     * @param id 
     * @param hide 
     */
    hide(id: number, hide: boolean) {
        console.log("TreePhysics hide: ", id, hide);
    }

    /**
     * 移除植物
     * @param id 
     */
    remove(id: number) {
        console.log("TreePhysics remove: ", id);
    }

    /**
     * 清除植物
     */
    clear() {
        console.log("TreePhysics clear");
    }
}

/**
 * 植物系统和物理系统接口测试
 */
export class TreePhysicsTest extends TreePhysics {
    scene: Scene3D;
    root: Sprite3D;
    line: PixelLineSprite3D;
    boxs: Map<number, BoundBox> = new Map();
    s3ds: Map<number, MeshSprite3D> = new Map();

    private _tempPos: Vector3 = new Vector3();
    private _tempRot: Quaternion = new Quaternion();
    private _tempScale: Vector3 = new Vector3();

    constructor(scene: Scene3D) {
        super();
        this.scene = scene;
        this.root = new Sprite3D();
        this.scene.addChild(this.root);
        this.line = this.scene.addChild(new PixelLineSprite3D(10000, "TreePhysicsTest"));
    }

    /**
     * 添加植物
     * @param id 
     * @param bb 
     * @param mesh 
     * @param transform 
     */
    add(id: number, bb: BoundBox, mesh: Mesh, transform: Matrix4x4) {
        console.log("TreePhysics add: ", id, bb, mesh, transform);
        if (bb) {
            this.boxs.set(id, bb);
            this.line.clear();
            this.boxs.forEach(box => Functions.drawBound(this.line, box, Color.MAGENTA));
        }
        if (mesh) {
            const ms3d = new MeshSprite3D(mesh);
            this.root.addChild(ms3d);
            this.s3ds.set(id, ms3d);
            if (transform) {
                transform.decomposeTransRotScale(this._tempPos, this._tempRot, this._tempScale);
                ms3d.transform.localPositionX = this._tempPos.x;
                ms3d.transform.localPositionY = this._tempPos.y;
                ms3d.transform.localPositionZ = this._tempPos.z;
                ms3d.transform.localRotationX = this._tempRot.x;
                ms3d.transform.localRotationY = this._tempRot.y;
                ms3d.transform.localRotationZ = this._tempRot.z;
                ms3d.transform.localRotationW = this._tempRot.w;
                ms3d.transform.localScaleX = this._tempScale.x;
                ms3d.transform.localScaleY = this._tempScale.y;
                ms3d.transform.localScaleZ = this._tempScale.z;
            }
        }
    }

    /**
     * 更新植物
     * @param id 
     * @param bb 
     * @param mesh 
     * @param transform 
     */
    update(id: number, bb: BoundBox, mesh: Mesh, transform: Matrix4x4) {
        console.log("TreePhysics update: ", id, bb, mesh, transform);
        if (bb) {
            const ob = this.boxs.get(id);
            if (ob) {
                ob.min.x = bb.min.x;
                ob.min.y = bb.min.y;
                ob.min.z = bb.min.z;
                ob.max.x = bb.max.x;
                ob.max.y = bb.max.y;
                ob.max.z = bb.max.z;
            }
            this.line.clear();
            this.boxs.forEach(box => Functions.drawBound(this.line, box, Color.MAGENTA));
        }
        if (mesh) {
            const om = this.s3ds.get(id);
            om.meshFilter.sharedMesh = mesh;
            if (transform) {
                transform.decomposeTransRotScale(this._tempPos, this._tempRot, this._tempScale);
                om.transform.localPositionX = this._tempPos.x;
                om.transform.localPositionY = this._tempPos.y;
                om.transform.localPositionZ = this._tempPos.z;
                om.transform.localRotationX = this._tempRot.x;
                om.transform.localRotationY = this._tempRot.y;
                om.transform.localRotationZ = this._tempRot.z;
                om.transform.localRotationW = this._tempRot.w;
                om.transform.localScaleX = this._tempScale.x;
                om.transform.localScaleY = this._tempScale.y;
                om.transform.localScaleZ = this._tempScale.z;
            }
        }
    }

    /**
     * 隐藏植物
     * @param id 
     * @param hide 
     */
    hide(id: number, hide: boolean) {
        console.log("TreePhysics hide: ", id, hide);
    }

    /**
     * 移除植物
     * @param id 
     */
    remove(id: number) {
        console.log("TreePhysics remove: ", id);
        this.boxs.delete(id);
        this.line.clear();
        this.boxs.forEach(box => Functions.drawBound(this.line, box, Color.MAGENTA));
        const s3d = this.s3ds.get(id);
        if (s3d) {
            this.s3ds.delete(id);
            this.root.removeChild(s3d);
            s3d.destroy();
        }
    }

    /**
     * 清除植物
     */
    clear() {
        console.log("TreePhysics clear");
        this.boxs.clear();
        this.line.clear();
        this.s3ds.forEach(s3d => {
            this.root.removeChild(s3d);
            s3d.destroy();
        });
        this.s3ds.clear();
    }
}