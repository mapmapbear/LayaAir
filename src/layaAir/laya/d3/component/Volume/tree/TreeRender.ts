import { Tree } from "./Tree";
import { Camera } from "laya/d3/core/Camera";
import { IAddRenderDataTree } from "./ITreeData";
import { ITreeInstanceData, TreeInstanceManager } from "./TreeInstanceManager";

/**
 * 树木渲染器
 */
export class TreeRender implements IAddRenderDataTree {
    private _visibleTreeCamera: Tree[] = []; //可见树木队列（相机裁剪）
    private _visibleTreeShadow: Tree[] = []; //可见树木队列（阴影裁剪）
    private _renderDataCamera: ITreeInstanceData[] = []; //树木渲染数据（相机裁剪）
    private _renderDataShadow: ITreeInstanceData[] = []; //树木渲染数据（阴影裁剪）
    private _instManager: TreeInstanceManager; //动态合批渲染器

    renderElement : any;
    constructor(camera: Camera) {
        this._instManager = new TreeInstanceManager(camera, 0, false);
    }

    /**
     * 添加可视的树木（相机裁剪）
     * @param tree 
     */
    addVisibleTreeCamera(tree: Tree) {
        this._visibleTreeCamera.push(tree);
    }

    /**
     * 添加可视的树木（阴影裁剪）
     * @param tree 
     */
    addVisibleTreeShadow(tree: Tree) {
        this._visibleTreeShadow.push(tree);
    }

    /**
     * 添加渲染数据（相机裁剪）
     * @param data 
     */
    addRenderDataCamera(data: ITreeInstanceData) {
        if (data.mesh)
            this._renderDataCamera.push(data);
    }

    /**
     * 添加渲染数据（阴影裁剪）
     * @param data 
     */
    addRenderDataShadow(data: ITreeInstanceData) {
        if (data.mesh)
            this._renderDataShadow.push(data);
    }

    /**
     * 更新渲染数据
     */
    updateRenderData() {
        // console.log("visLen: ", this._visibleTreeCamera.length);
        this._visibleTreeCamera.forEach(v => v.renderCamera());
        this._instManager.updateByRenderData(this._renderDataCamera, false);
        this._visibleTreeShadow.forEach(v => v.renderShadow());
        this._instManager.updateByRenderData(this._renderDataShadow, true);
        this._instManager.updateByRenderData(this._renderDataCamera, true);
        this._instManager.update();
        this.clear();
    }

    /**
     * 清理
     */
    clear() {
        this._visibleTreeCamera.length = 0;
        this._visibleTreeShadow.length = 0;
        this._renderDataCamera.length = 0;
        this._renderDataShadow.length = 0;
    }

    /**
     * 销毁
     */
    destroy() {
        this._instManager.destroy();
    }
}