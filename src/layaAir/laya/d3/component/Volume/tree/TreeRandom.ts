/**
 * 均匀分布随机数产生器
 */
export class TreeRandom {
    private _randomSeed: number = 1;
    private readonly _randomMax: number = (1 << 48) - 1;

    /**
     * 产生随机数
     * @param min 最小值
     * @param max 最大值
     * @returns 
     */
    random(min: number, max: number) {
        this._randomSeed = (25214903917 * this._randomSeed) & this._randomMax;
        return (this._randomSeed / this._randomMax) * (max - min) + min;
    }

    /**
     * 设置随机数种子
     * @param seed 
     */
    setSeed(seed: number) {
        if (seed > 0)
            this._randomSeed = seed;
    }
}