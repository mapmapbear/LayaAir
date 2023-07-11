/**
 * 分段连续数组
 */
export class DsArray {
    private _slen: number = 1024; //段长度
    private _spos: number = -1; //段位置
    private _dpos: number = 1024; //数据位置
    private _data: any[][]; //数据
    private _clas: any; //数据类型（Uint8Array，Float32Array...)

    /**
     * 构造函数
     * @param slen 每个段的长度
     */
    constructor(slen: number = 1024, clas: any) {
        this._slen = Math.max(2, slen);
        this._dpos = this._slen;
        this._data = [];
        this._clas = clas;
    }

    /**
     * 推入1个数据
     * @param value 数据
     */
    push(value: any) {
        if (this._dpos < this._slen)
            this._data[this._spos][this._dpos++] = value;
        else {
            this._dpos = 1;
            this._data[++this._spos] = new this._clas(this._slen);
            this._data[this._spos][0] = value;
        }
    }

    /**
     * 推入2个数据
     * @param v1 数据1
     * @param v2 数据2
     */
    push2(v1: any, v2: any) {
        if (this._dpos + 2 <= this._slen) {
            let arr = this._data[this._spos];
            arr[this._dpos++] = v1;
            arr[this._dpos++] = v2;
        }
        else {
            this.push(v1);
            this.push(v2);
        }
    }

    /**
     * 推入3个数据
     * @param v1 数据1
     * @param v2 数据2
     * @param v3 数据3
     */
    push3(v1: any, v2: any, v3: any) {
        if (this._dpos + 3 <= this._slen) {
            let arr = this._data[this._spos];
            arr[this._dpos++] = v1;
            arr[this._dpos++] = v2;
            arr[this._dpos++] = v3;
        }
        else {
            this.push2(v1, v2);
            this.push(v3);
        }
    }

    /**
     * 推入4个数据
     */
    push4(v1: any, v2: any, v3: any, v4: any) {
        if (this._dpos + 4 <= this._slen) {
            const arr = this._data[this._spos];
            arr[this._dpos++] = v1;
            arr[this._dpos++] = v2;
            arr[this._dpos++] = v3;
            arr[this._dpos++] = v4;
        }
        else {
            this.push2(v1, v2);
            this.push2(v3, v4);
        }
    }

    /**
     * 推入6个数据
     */
    push6(v1: any, v2: any, v3: any, v4: any, v5: any, v6: any) {
        this.push3(v1, v2, v3);
        this.push3(v4, v5, v6);
    }

    /**
     * 推入8个数据
     */
    push8(v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any) {
        this.push4(v1, v2, v3, v4);
        this.push4(v5, v6, v7, v8);
    }

    /**
     * 推入12个数据
     */
    push12(v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any, v10: any, v11: any, v12: any) {
        this.push6(v1, v2, v3, v4, v5, v6);
        this.push6(v7, v8, v9, v10, v11, v12);
    }

    /**
     * 推入1个数组
     * @param v 数组
     * @param offset 从数组的哪个成员开始推入
     */
    pushArray(v: any[], offset: number = 0) {
        let n = v.length - offset;
        if (n <= 0) return;
        const arr = this._data[this._spos];
        if (this._dpos + n <= this._slen) {
            for (let i = 0; i < n; i++)
                arr[this._dpos++] = v[i + offset];
            return;
        }
        else {
            n = this._slen - this._dpos;
            for (let i = 0; i < n; i++)
                arr[this._dpos++] = v[i + offset];
            if (n + offset < v.length) {
                this.push(v[n + offset]);
                this.pushArray(v, offset + n + 1);
            }
        }
    }

    /**
     * 推入一些数据
     * @param arg 一些数据
     */
    pushSome(...arg: any) {
        this.pushArray(arg);
    }

    /**
     * 返回一个完整的克隆数组
     */
    slice() {
        let dcount = 0;
        if (this._spos < 0) return null;
        for (let i = 0; i < this._spos; i++)
            dcount += this._slen;
        dcount += this._dpos;
        if (dcount > 0) {
            const arr_out = new this._clas(dcount);
            for (let i = 0; i < this._spos; i++)
                arr_out.set(this._data[i], i * this._slen);
            const last = this._data[this._spos].slice(0, this._dpos);
            arr_out.set(last, this._spos * this._slen);
            return arr_out;
        }
        return null;
    }

    /**
     * 获取数据长度
     */
    get length() {
        if (this._spos < 0) return 0;
        let dcount = 0;
        for (let i = 0; i < this._spos; i++)
            dcount += this._slen;
        dcount += this._dpos;
        return dcount;
    }

    /**
     * 读取数值
     * @param index 索引值
     */
    getValue(index: number) {
        const s = (index / this._slen) | 0;
        const d = index - s * this._slen;
        return this._data[s][d];
    }

    /**
     * 设置数值
     * @param index 
     * @param value 
     */
    setValue(index: number, value: number) {
        const s = (index / this._slen) | 0;
        const d = index - s * this._slen;
        this._data[s][d] = value;
    }

    /**
     * 清理
     * @returns 
     */
    clear() {
        const n = this._spos;
        for (let i = 0; i < n; i++)
            delete this._data[i];
        this._data = [];
        this._spos = -1;
        this._dpos = this._slen;
    }

    /**
     * 销毁
     */
    destroy() {
        this.clear();
    }
}