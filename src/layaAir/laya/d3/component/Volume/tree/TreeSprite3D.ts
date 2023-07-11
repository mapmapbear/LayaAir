import { Sprite3D } from "laya/d3/core/Sprite3D";

/**
 * 树木部件节点，用于生成世界矩阵
 */
export class TreeSprite3D extends Sprite3D {
    sn: number = 0; //统一序号
    wb: number = 0; //风效起始值
    we: number = 0; //风效终止值
    wp: number = 0; //风效指数值
    type: number = 0; //类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
    level: number = 0; //拓扑层次（0~N）
    direction: number = 0; //生长方向（0: 任意方向 1：竖直向上 2：竖直向下 3：水平两边）
    isRoot: boolean = false; //是否是根节点

    constructor(sn: number) {
        super();
        this.sn = sn;
    }
}