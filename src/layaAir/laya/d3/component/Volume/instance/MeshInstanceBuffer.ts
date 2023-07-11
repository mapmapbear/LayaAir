import { BufferState } from "laya/webgl/utils/BufferState";
import { VertexBuffer3D } from "laya/d3/graphics/VertexBuffer3D";
import { VertexDeclaration } from "laya/RenderEngine/VertexDeclaration";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { LayaGL } from "laya/layagl/LayaGL";
import { CustomDrawMeshInstanceCMD } from "./CustomDrawMeshInstanceCMD";
import { BufferUsage } from "laya/RenderEngine/RenderEnum/BufferTargetType";

export interface InstanceVertexDec {
    vd: VertexDeclaration,
    cls: typeof Float32Array | typeof Uint8Array | typeof Uint16Array,
    size: number,
    step: number,
}

export class MeshInstanceBuffer {
    static BLOAK_NO_USE = -1;
    static BLOAKUSE_WILLUPLOAD = 1;
    static BLOAKUSE_ENDUPLOAD = 2;

    static _VBRESIZE_DO = 1;
    static _VBRESIZE_END = 2;

    _vbData: Float32Array | Uint8Array | Uint16Array; //vb的数据，要根据vbUse给的偏移数组，一段一段增加
    private _vbIndexPool:number[] = []; // 数组中空缺的位置
    private _waitIndexPool:number[] = []; //新增等待加入到队列的数组

    private _vb: VertexBuffer3D;
    public get vertexBuffer() {
        return this._vb;
    }

    private _vbDatas: Array<Float32Array | Uint8Array | Uint16Array> = [];
    private _vbuse: Array<number> = [];
    private _vbuseIndexPool: Array<number> = [];

    private _vbBloakeSize: number;
    private _vbResize: number = 0;
    private _needUpload = false;
    /**  */
    private _orderShadow = [];
    // private _orderArr = [];

    private _uploadPos = Number.MAX_VALUE;
    private _size;
    private _step;
    /** 类型 */
    private _cls: typeof Float32Array | typeof Uint8Array | typeof Uint16Array;
    /** @internal */
    instanceBufferState: BufferState;
    // instanceBuffer:VertexBuffer3D;
    /** 假mesh渲染用的vb */
    // fakerBuffer:VertexBuffer3D;
    // maxDrawData:number = 0;
    drawNums: number;

    mesh: Mesh;
    subMeshIndex: number;

    hasFaker:boolean = false;
    faker: Mesh;
    fakerState: BufferState;

    _owner: CustomDrawMeshInstanceCMD;
    __queueIndex:number = -1;
    private _vd: VertexDeclaration;

    // private _bufcls:typeof Float32Array|typeof Uint8Array | typeof Uint16Array;
    /** uniformbuffer 一次绘制的单元长度 */
    // private _elementNum = 0;
    /**
     * 
     * @param mesh 
     * @param subMeshIndex 
     * @param faker 拾取时使用的假mesh
     */
    constructor(mesh: Mesh, subMeshIndex: number, dec: InstanceVertexDec, faker: Mesh = null) {
        this.mesh = mesh;
        this.faker = faker;
        this.hasFaker = !!faker;
        this.subMeshIndex = subMeshIndex;

        this._size = dec.size;
        this._step = dec.step;
        this._vbBloakeSize = dec.size * dec.step;
        this._cls = dec.cls;
        this._vd = dec.vd;


        this._initBuffer();
        this._setInstanceBufferData();
    }

    private _initBuffer() {
        this._vb = LayaGL.renderOBJCreate.createVertexBuffer3D(this._vbBloakeSize,BufferUsage.Dynamic, false);
        this._vb.vertexDeclaration = this._vd;
        this._vb.instanceBuffer = true;
    }

    private _setInstanceBufferData(): void {
        let instanceBufferState = this.instanceBufferState = new BufferState(); //@ts-ignore
        instanceBufferState.applyState([this.mesh._vertexBuffer,this._vb],this.mesh._indexBuffer);

        if (this.faker) {
            instanceBufferState = this.fakerState = new BufferState(); //@ts-ignore
            instanceBufferState.applyState([this.faker._vertexBuffer,this._vb],this.faker._indexBuffer);
        }

    }

    get VBBlockSize(): number {
        return this._vbBloakeSize;
    }

    /**
     * 需要使用VB一段内存
     * @returns VB管理器内存的索引，偏移值=返回值*this.VBBlockSize;
     */
    useVBBlock(rtn: any): number {
        let index;
        if (rtn.index != undefined) {
            index = rtn.index;
            if (!this._vbDatas[index]) {
                this._vbDatas[index] = new this._cls(this._vbBloakeSize);
                this._vbResize = MeshInstanceBuffer._VBRESIZE_DO;
            }
            let ofs = this._vbuseIndexPool.indexOf(index);
            this._vbuseIndexPool.splice(ofs, 1);
        } else {
            index = this._vbuseIndexPool.length ? this._vbuseIndexPool.pop() : -1;
            if (index < 0) {
                index = this._vbuse.length++;
                this._vbDatas[index] = new this._cls(this._vbBloakeSize);
                this._vbResize = MeshInstanceBuffer._VBRESIZE_DO;
            }
        }
        rtn.data = this._vbDatas[index];
        rtn.index = index;
        this._vbuse[index] = MeshInstanceBuffer.BLOAKUSE_WILLUPLOAD;
      
        !this._vbResize && (this._waitIndexPool.push(index));
        this._needUpload = true;
        return index;
    }

    /**
     * 根据index更新一个位置的vb
     * @param index 
     */
    vbUpdate(index: number, buf: Float32Array | Uint8Array | Uint16Array) {
        if (!this._vbDatas[index]) {
            return
        }
        this._vbDatas[index].set(buf);
        if (this._vbuse[index] != MeshInstanceBuffer.BLOAKUSE_WILLUPLOAD) {//确认状态添加到 更新数组中
            this._waitIndexPool.push(index);
        }
        this._vbuse[index] = MeshInstanceBuffer.BLOAKUSE_WILLUPLOAD;
        this._needUpload = true;
    }

    //根据vbUse获得数组，相应的段设为可以继续使用
    vbRemove(indexs: Array<number>) {
        for (let i = 0, n = indexs.length; i < n; i++) {
            let index = indexs[i];
            this._vbuseIndexPool.push(index);
            if (this._vbuse[index] != MeshInstanceBuffer.BLOAK_NO_USE) {
                this._vbuse[index] = MeshInstanceBuffer.BLOAK_NO_USE;
                let pos = this._orderShadow[index];
                if (pos != -1) {
                    this._vbIndexPool.push(pos);
                    if (pos == this._uploadPos - 1) {
                        this._uploadPos --;
                    }else{
                        this._needUpload = true;
                    }
                    this._orderShadow[index] = -1;
                }
            }
        }
    }

    clear() {
        this._vbuseIndexPool.length = 0;
        this._vbuse.length = 0;
    }

    vbToAll(mustDo: boolean) {
        mustDo && (this._vbResize = MeshInstanceBuffer._VBRESIZE_DO);
        if (this._vbResize == MeshInstanceBuffer._VBRESIZE_DO) {
            this._orderShadow.length = 0;
            this._vbResize = MeshInstanceBuffer._VBRESIZE_END;
            this._vbData = new this._cls(this._vbuse.length * this._vbBloakeSize);

            let mark = 0;
            for (let i = 0, n = this._vbDatas.length; i < n; i++) {
                let oneBlock: number = this._vbuse[i];
                if (oneBlock >= MeshInstanceBuffer.BLOAKUSE_WILLUPLOAD) {
                    // let time1 = Browser.now();
                    this._vbData.set(this._vbDatas[i], mark * this._vbBloakeSize);
                    // DyVIBuffer.timeA += Browser.now() - time1;
                    this._vbuse[i] = MeshInstanceBuffer.BLOAKUSE_ENDUPLOAD;
                    this._orderShadow[i] = mark;
                    // this._orderArr.push(i);
                    mark++;
                } else {
                    this._orderShadow[i] = -1;
                }
            }
            this._uploadPos = mark;
            this._waitIndexPool.length = 0;
            this._vbIndexPool.length = 0;
            //todo 增加进入池子的索引号
            this._vbIndexPool.length = 0;
            if (mark < this._vbuse.length) {
                for (let i = mark , n = this._vbuse.length ;i < n ; i++) {
                    this._vbIndexPool.push(i);                    
                }
            }
        }
    }

    upload() {
        if (!this._needUpload)
            return;

        this._needUpload = false;

        let i = 0, n = 0;

        //如果vb 调整尺寸了，要全部提交buffer
        if (this._vbResize) {
            this.vbToAll(true);
            this._vbResize = 0;
            this._vb._byteLength = this._vbData.length * this._cls.BYTES_PER_ELEMENT;
            this._vb.orphanStorage();
            this._vb.setData(this._vbData.buffer);
            // console.log("this._vb.setData all",this.vbData);
            return;
        }

        n = this._waitIndexPool.length;
        this._vbIndexPool.sort((a,b)=>{return b-a});
        //[3, 2, 4, 1, 0, 5]
        if (n) {
            this._waitIndexPool.sort((a,b)=>{return this._orderShadow[a] - this._orderShadow[b]});//优先把-1填上去
            let startUploadPos = -1;//从什么地方开始更新
            let mark = 0;
            let willUpload = false;
            let vbpLen = this._vbIndexPool.length;
            let endPos = this._vbIndexPool[vbpLen - 1];

            for (i = 0; i < n; i++) {//肯定是新增比减少的少
                let index = this._waitIndexPool[i];
                let oneBlock: number = this._vbuse[index];
                let curPos = this._orderShadow[index];

                if (oneBlock == MeshInstanceBuffer.BLOAKUSE_WILLUPLOAD 
                    && (!vbpLen || curPos < endPos)
                ) {//需要提交且是新增到数组内

                    let pos:number = curPos != -1? curPos : this._vbIndexPool.pop();

                    vbpLen = this._vbIndexPool.length;
                    endPos = this._vbIndexPool[vbpLen - 1];

                    this._vbData.set(this._vbDatas[index], pos * this._vbBloakeSize);
                    this._orderShadow[index] = pos;
                    this._vbuse[index] = MeshInstanceBuffer.BLOAKUSE_ENDUPLOAD;

                    mark ++;
                    startUploadPos == -1 && (startUploadPos = pos);
                    let nextPos = this._orderShadow[this._waitIndexPool[i + 1]];
                    if ( 
                        i == n -1 
                        || (nextPos - pos != 1 && ( nextPos != -1 || endPos - pos != 1 )) //下一个不连续，且下一个需要更新提交的不连续
                    ) {
                        willUpload = true;
                    }
                }

                if (willUpload && startUploadPos != -1) {
                    let startindex = startUploadPos * this._vbBloakeSize * this._cls.BYTES_PER_ELEMENT;
                    let len = mark * this._vbBloakeSize * this._cls.BYTES_PER_ELEMENT;
                    this._vb.setData(this._vbData.buffer, startindex, startindex, len);
                    startUploadPos = -1;
                    mark = 0;
                }

                willUpload = false;
            }
        }

        if (this._vbIndexPool.length) {
            let startUploadPos = -1;//从什么地方开始更新
            let willUpload = false;
    
            let mark = 0;
            let allNum = 0;

            let startpos = this._vbIndexPool.pop();
            let lastpos = startpos;
            // let lastpos = 0;
            for (i = 0, n = this._vbDatas.length; i < n; i++) {
                let oneBlock: number = this._vbuse[i];
                let curpos = this._orderShadow[i];
    
                if (curpos < lastpos) {
    
                    if (oneBlock == MeshInstanceBuffer.BLOAKUSE_WILLUPLOAD) {
                        if (curpos == -1) {
                            startUploadPos < 0 && (startUploadPos = startpos);
                            this._vbData.set(this._vbDatas[i], (startUploadPos + mark) * this._vbBloakeSize);
                            this._orderShadow[i] = startUploadPos + mark;
                            // this._orderArr.push(i);
                        } else {
                            startUploadPos < 0 && (startUploadPos = curpos);
                            this._vbData.set(this._vbDatas[i], curpos * this._vbBloakeSize);
                        }
                        mark++;
                        this._vbuse[i] = MeshInstanceBuffer.BLOAKUSE_ENDUPLOAD;

                        if (this._orderShadow[i + 1] - curpos != 1) {
                            willUpload = true;
                        }
                    } else {
                        willUpload = true;
                    }
                } else {
                    startUploadPos < 0 && (startUploadPos = startpos);
                    this._vbData.set(this._vbDatas[i], (startUploadPos + mark) * this._vbBloakeSize);
                    // 重新计算位置
                    this._orderShadow[i] = startUploadPos + mark;
                    // this._orderArr.push(i);
                    mark++;
                    this._vbuse[i] = MeshInstanceBuffer.BLOAKUSE_ENDUPLOAD;
                }

                if (this._vbuse[i] == MeshInstanceBuffer.BLOAKUSE_ENDUPLOAD)
                    allNum ++; //总有效计数

    
                // else willUpload=true;
                if (i == (n - 1)) {
                    willUpload = true;
                    i = n;//setData要取长度
                }
    
                if (startUploadPos >= 0 && willUpload) {
                    // console.log("this._vb.setData",startUploadPos*this._vbBloakeSize,(i-startUploadPos)*this._vbBloakeSize,this.vbData);
                    // let time1 = Browser.now();
                    let startindex = startUploadPos * this._vbBloakeSize * this._cls.BYTES_PER_ELEMENT;
                    let len = mark * this._vbBloakeSize * this._cls.BYTES_PER_ELEMENT;
                    this._vb.setData(this._vbData.buffer, startindex, startindex, len);
                    // this._vb.setData(this._vbData.buffer);
                    // DyVIBuffer.timeD += Browser.now() - time1;
                    if (startUploadPos == startpos) {
                        startpos += mark;
                    }
                    startUploadPos = -1;
                    mark = 0;
                }
                willUpload = false;
            }

            this._vbIndexPool.length = 0;
            if (allNum < this._vbuse.length) {
                for (i = allNum , n = this._vbuse.length ;i < n ; i++) {
                    this._vbIndexPool.push(i);                    
                }
            }

            // console.log("vbindexpool:",this._vbIndexPool);
            this._uploadPos = allNum;//Number.MAX_VALUE;
        }
        // if (!this._uploadPos) {
        //     this.vbToAll(true);
        //     this._vb.setData(this._vbData.buffer);
        //     return
        // }
        //TODO 如果buffer使用变小了，要减少this.vbData的长度

    
        this._waitIndexPool.length = 0;
    }

    /**
     * 清理使用的vb3d和bufferStat
     */
    clearBuffer() {
        this._vb.destroy();
        this._vb = null;
        this.instanceBufferState.destroy();
        // this.instanceBuffer.destroy();
        // this.fakerBuffer && this.fakerBuffer.destroy();
        this.fakerState && this.fakerState.destroy();

        this.instanceBufferState = null;
        this.fakerState = null;
    }

    destroy() {
        this.clearBuffer();
        if (this._owner) {
            this._owner.removeBuffer(this);
        }
        this.__queueIndex = -1;
        this._owner = null;
        this.mesh = null;
        this.faker = null;
        this._vbData = null;
        this._vbDatas = null;
    }
}