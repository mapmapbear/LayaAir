import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { DirectionLight } from "laya/d3/core/light/DirectionLight";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { AmbientMode } from "laya/d3/core/scene/AmbientMode";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { Tree } from "./Tree";
import { TreeAgent } from "./TreeAgent";
import { TreeRender } from "./TreeRender";
import { TreeResource } from "./TreeResource";

/**
 * 植物快照
 */
export class TreeSnapshot {
    private _scene: Scene3D;
    private _camera: Camera;
    private _ta: TreeAgent;
    private _tr: TreeResource;
    private _render: TreeRender;
    removeTask: boolean = false;

    constructor(tr: TreeResource) {
        this._tr = tr;

        //创建灯光
        const light = new DirectionLight();
        light.intensity = 0.85;
        let mat = light.transform.worldMatrix;
        mat.setForward(new Vector3(-1, -1, -1));

        //计算宽高比
        const bbox = this._tr.bbox[0];
        const ext = new Vector3();
        bbox.getExtent(ext);
        const aspect = ext.x / ext.y;

        //创建相机
        this._camera = new Camera(0, 0.1, 100);
        this._camera.name = "TreeSnapshotCamera";
        this._camera.clearColor = new Color(0, 0, 0, 0);
        this._camera.aspectRatio = aspect;
        this._camera.orthographic = true;
        this._camera.transform.localPositionZ = 10;

        //创建场景
        this._scene = new Scene3D();
        this._scene.name = "TreeSnapshotScene";
        this._scene.ambientColor = new Color(0.25, 0.25, 0.25);
        this._scene.ambientMode = AmbientMode.SolidColor;
        this._scene.addChild(light);
        this._scene.addChild(this._camera);

        //创建渲染器
        this._render = new TreeRender(this._camera);

        //创建树木
        this._ta = new TreeAgent(0, "", 0);
        const tree = new Tree(0, 0, 1, 0, this._tr, this._render);
        tree.createTree();
        this._ta.setTree(tree);
        this._ta.tree.lod = 0;
        this._ta.tree.dist = 0;
        this._ta.setDrop(this._tr.cfg.param.drop);
        Laya.timer.once(5000, this, this.snap);
    }

    /**
     * 执行快照
     */
    snap() {
        if (!this.removeTask) {
            this._render.addVisibleTreeCamera(this._ta.tree);
            this._render.updateRenderData();
            const bb = this._ta.tree.tr.bbox[0];
            const height = this._tr.material.treeHeight;
            this._camera.orthographicVerticalSize = height;
            this._camera.transform.localPositionX = (bb.min.x + bb.max.x) * 0.5;
            this._camera.transform.localPositionY = height * 0.5;
            this._tr.material.setWind(Vector4.ZERO);
            Laya.stage.addChild(this._scene);
            Camera.drawRenderTextureByScene(this._camera, this._scene, this._tr.texImposter as any);
            Laya.stage.removeChild(this._scene);
            this._tr.material.setWind(this._tr.cfg.wind);
        }
        this._camera.destroy();
        this._render.destroy();
        this._scene.destroy();
        this._ta.destroy();
    }
}