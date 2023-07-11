import { Tree } from "./Tree";
import { ITreeInstanceData } from "./TreeInstanceManager";

export interface IAddRenderDataTree {
    addVisibleTreeCamera(tree: Tree): void; //添加到可视树木队列（相机裁剪）
    addVisibleTreeShadow(tree: Tree): void; //添加到可视树木队列（阴影裁剪）
    addRenderDataCamera(data: ITreeInstanceData): void; //添加树木渲染数据（相机裁剪）
    addRenderDataShadow(data: ITreeInstanceData): void; //添加树木渲染数据（阴影裁剪）
}