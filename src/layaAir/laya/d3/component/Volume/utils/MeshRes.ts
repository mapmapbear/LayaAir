import { Laya } from "Laya";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { Mesh } from "laya/d3/resource/models/Mesh";

/**
 * 网格资源
 */
export class MeshRes {
    url: string;
    mesh: Mesh;

    constructor(url?: string, mesh?: Mesh) {
        this.url = url;
        this.mesh = mesh;
    }

    /**
     * 获取资源
     * @param next
     * @returns 
     */
    getRes(next?: Function) {
        if (this.mesh)
            return this.mesh;
        if (this.url) {
            Laya.loader.load({ url: this.url, type: Loader.MESH }, Handler.create(this, (m: Mesh) => {
                this.mesh = m;
                next && next(this);
            }));
        }
        return null;
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.mesh)
            this.mesh.destroy();
        this.mesh = null;
        this.url = null;
    }
}