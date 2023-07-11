import { Mesh } from "laya/d3/resource/models/Mesh";
import { InstanceVertexDec, MeshInstanceBuffer } from "./MeshInstanceBuffer";

export interface InstanceRenderInfo {
    meshs?: Mesh[],
    buffers: MeshInstanceBuffer[],
    drawNum: number,
    // arrayData?:Float32Array,
    // maxDrawNum: number,
    updateTime: number,
    needUpdate?: boolean,
    subMeshIndex: number
}

/**
 * 数据管理相关类
 * 目前只适用于 worldMatrix更新
 * 支持直接使用float32Array + drawNums渲染
 * 优先使用 matrix 组织 float32上传
 */
export class DataAccess {
    // private _elementLength;
    // public get elementLength(){
    //     return this._elementLength;
    // }
    // private _defaultdrawNum;
    // private _step;
    _dataMap: Map<number, InstanceRenderInfo> = new Map();

    constructor() {
        // this._elementLength = elementLength;
        // this._step = step;
        // this._defaultdrawNum = this._step * this._elementLength;
    }

    initID(id: number, meshs: Mesh[], subMeshIndex = -1, vbdec: InstanceVertexDec, faker: Mesh = null) {
        let data = this.getData(id)
        if (!data) {
            let buffers = [];
            for (let i = 0, n = meshs.length; i < n; i++) {
                let mesh = meshs[i];
                // let cmd = cmds[i];
                let buf = new MeshInstanceBuffer(mesh, subMeshIndex, vbdec, faker);
                // cmd.addBuffer(buf);
                buffers.push(buf);
            }

            data = {
                subMeshIndex: subMeshIndex,
                meshs: meshs,
                drawNum: 0,
                buffers: buffers,
                updateTime: 0
            }
            this._dataMap.set(id, data);
        } else {
            //TODO clear
            this.clear(id);
        }
        return data;
    }

    /**
     * 按照float32提交
     * @param id 
     * @param array 
     * @param drawNum 
     * @returns 
     */
    append(id: number, array: Float32Array | Uint8Array | Uint16Array, drawNum: number): number[] {
        //todo
        let data = this.getData(id);
        if (!data) {
            console.log("access need init!");
            return null;
        }

        let n = data.buffers.length;
        // if (n != arrays.length) {
        //     console.log("输入需要符合init的描述")
        //     return -1;
        // }

        let outnum = [];

        let out: any = {};
        for (let i = 0; i < n; i++) {
            let vb = data.buffers[i];
            let num = vb.useVBBlock(out);
            out.data.set(array);
            out.index = num;
            outnum.push(num)
        }

        data.drawNum += drawNum;
        data.needUpdate = true;
        return outnum;
    }

    update(id: number, pos: number, float32: Float32Array| Uint8Array | Uint16Array) {
        let data = this.getData(id);
        if (!data) {
            console.log("access need init!");
            return null;
        }

        let n = data.buffers.length;
        for (let i = 0; i < n; i++) {
            let vb = data.buffers[i];
            vb.vbUpdate(pos, float32);
        }
        data.needUpdate = true;
    }

    remove(id: number, pos: number[]) {
        let data = this.getData(id);
        if (!data) {
            console.log("access need init!");
            return null;
        }

        for (let i = 0, n = data.buffers.length; i < n; i++) {
            let vb = data.buffers[i];
            vb.vbRemove(pos);
        }
        // data.buffer.vbRemove(pos);
        data.drawNum--;
        data.needUpdate = true;
    }

    uploadAllBuffer() {
        this._dataMap.forEach((value, id) => {
            this.uploadBuffer(id);
        })
    }

    /**
     * 上传buffer
     * @param id 
     * @returns 
     */
    uploadBuffer(id: number) {
        let info = this.getData(id);
        if (!info) {
            console.log("access need init!");
            return null
        }

        if (info.needUpdate) {
            // info.buffer.upload();
            if (info.buffers.length) {
                for (let i = 0, n = info.buffers.length; i < n; i++) {
                    // const element = array[i];
                    let buf = info.buffers[i];
                    buf.upload();
                    buf.drawNums = info.drawNum;
                }
            }
            // let fl32:Float32Array;
            // if (info.matrixs && info.matrixs.length) {
            //     let tempn = info.drawNum - 1;
            //     if (info.needReset || !info.arrayData) {
            //         if (info.drawNum > info.maxDrawNum || !info.arrayData) {
            //             let len = Math.ceil(info.drawNum / this._step) * this._step;
            //             info.maxDrawNum = len;
            //             fl32 = info.arrayData = new Float32Array(len * this._elementLength);
            //         }else{
            //             fl32 = info.arrayData;
            //             fl32.fill(0);
            //         }

            //         for (let i = 0 , n = info.drawNum; i < n; i++) {
            //             fl32.set(info.matrixs[i].elements, i * this.elementLength);
            //         }
            //         info.lastPos = tempn;//info.drawNum - 1;
            //     }

            //     if (info.drawNum > info.maxDrawNum) {
            //         let len = Math.ceil(info.drawNum / this._step) * this._step;
            //         info.maxDrawNum = len;
            //         let oldf = info.arrayData;
            //         fl32 = info.arrayData = new Float32Array(len * this._elementLength);
            //         fl32.set(oldf);
            //     }

            //     let needpos = info.needUpdatePos
            //     if (needpos && needpos.length) {
            //         for (let i = 0, n = needpos.length; i < n; i++) {
            //             let pos = needpos[i];
            //             if (pos < info.lastPos) {
            //                 fl32.set(info.matrixs[pos].elements ,pos * this.elementLength)
            //             }
            //         }
            //         needpos.length = 0;
            //     }

            //     if (info.lastPos <= tempn/*info.drawNum - 1*/) {
            //         fl32 = info.arrayData;
            //         for (let i = info.lastPos, n = info.drawNum; i < n; i++) {
            //             fl32.set(info.matrixs[i].elements, i * this.elementLength);
            //         }
            //         info.lastPos = tempn;//info.drawNum - 1;
            //     }
            // }else{
            //     fl32 = info.arrayData;
            // }

            // for (let index = 0 , n = info.buffers.length; index < n; index++) {
            //     let buffer = info.buffers[index];
            //     buffer.updateArrayBuffer(fl32,info.drawNum,info.maxDrawNum);
            // }
            info.needUpdate = false;
        }
    }

    // /**
    //  * 使用矩阵
    //  * @param id 
    //  * @param matrix 
    //  * @param compId 颜色
    //  * @returns 
    //  */
    // addMatrix(id:number,matrix:Matrix4x4,compId:number = 0){
    //     let info = this.getData(id);
    //     if (!info) {
    //         console.error("该id 需要初始化!");
    //         return null;
    //     }
    //     if (!info.matrixs) {
    //         info.matrixs = [];
    //     }
    //     if (!info.compIds) {
    //         info.compIds = [];
    //     }
    //     info.matrixs.push(matrix);
    //     info.compIds.push(compId);
    //     info.drawNum ++;
    //     info.needUpdate = true;
    //     return info;
    // }

    // updateMatrix(id:number,matrix:Matrix4x4){
    //     let info = this.getData(id);
    //     if (!info || !info.matrixs || !info.matrixs.length) {
    //         return null;
    //     }

    //     let index = info.matrixs.indexOf(matrix);
    //     if (index < 0) {
    //         return null;
    //     }
    //     if (index < info.lastPos - 1) {
    //         info.needUpdate = true;
    //         !info.needUpdatePos && (info.needUpdatePos = []);
    //         info.needUpdatePos.push(index);
    //     }
    //     // else{
    //     //     // info.needUpdatePos = index;
    //     // }
    //     return info;
    // }

    // removeMatrix(id:number,matrix:Matrix4x4){
    //     let info = this.getData(id);
    //     if (!info || !info.matrixs || !info.matrixs.length) {
    //         return null;
    //     }

    //     let index = info.matrixs.indexOf(matrix);
    //     if (index < 0) {
    //         return null;
    //     }
    //     if (index < info.lastPos) {
    //         // info.needReset = true;
    //         info.lastPos = index;
    //     }
    //     let needpos = info.needUpdatePos;
    //     if (needpos && needpos.length) {
    //         if (needpos[index]) {
    //             needpos.splice(needpos.indexOf(index),1);
    //         }
    //     }

    //     info.drawNum --;
    //     info.matrixs.splice(index,1);
    //     info.compIds.splice(index,1);
    //     info.needUpdate = true;
    //     return info.drawNum;
    // }

    // /**
    //  * 暂时清理不必要的float32
    //  * @param id 
    //  * @returns 
    //  */
    // clearFloatData(id:number){
    //     let info = this.getData(id);
    //     if (!info) {
    //         return null;
    //     }
    //     info.arrayData = null;
    // }

    // /**
    //  * 缩小buffer
    //  */
    // narrowDown(){
    //     this._dataMap.forEach((data,id)=>{
    //         let oldArrayData = data.arrayData;
    //         data.maxDrawNum = data.drawNum * this._elementLength
    //         data.arrayData = new Float32Array(data.maxDrawNum);
    //         data.arrayData.set(oldArrayData.slice(0,data.maxDrawNum));
    //     })
    // }

    /**
     * 返回一个 INFO 结构的数据
     * @param id 
     * @returns 
     */
    getData(id) {
        return this._dataMap.get(id);
    }

    clear(id) {
        let data = this.getData(id);
        data.drawNum = 0;
    }

    clearAll() {
        this._dataMap.forEach((value, key) => {
            value.drawNum = 0;
        })
    }

    clearBuffers(id) {
        let info = this._dataMap.get(id);
        if (info && info.buffers && info.buffers.length) {
            for (let index = 0, len = info.buffers.length; index < len; index++) {
                let element = info.buffers[index];
                element.destroy();
            }
            info.buffers.length = 0;
        }
        // info.buffer && info.buffer.destroy();
    }

    delete(id) {
        let info = this._dataMap.get(id);
        //todo
        if (info && info.buffers && info.buffers.length) {
            for (let index = 0, len = info.buffers.length; index < len; index++) {
                let element = info.buffers[index];
                element.destroy();
            }
            info.buffers.length = 0;
        }
        // info.buffer && info.buffer.destroy();

        this._dataMap.delete(id);
    }

    deleteAll() {
        this._dataMap.forEach((value, key) => {
            this.delete(key);
        })
    }
}