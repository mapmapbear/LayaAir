import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { MathEx } from "../utils/MathEx";
import { TreeTestRender } from "../TreeRender/TreeTestRender";

/**
 * 随机生成植物的相关参数
 */
export class TreeRandomGenParam {
    type: number; //植物类型（唯一编号）
    name: string; //植物类型（中文名称）
    kind: number; //序号
    season: string; //植物季节
    height: number; //高度程度
    wide: number; //粗细程度
    curve: number; //弯曲程度
    leafRich: number; //叶茂密程度
    branchRich: number; //枝茂盛程度
    luminance: number; //亮度系数
    saturation: number; //色度系数
    rand: number; //随机度

    template: any; //模板参数

    constructor() {
        this.type = 100;
        this.kind = 0;
        this.name = "阔叶树";
        this.season = "夏季";
        this.height = 5;
        this.wide = 1;
        this.curve = 0.2;
        this.leafRich = 1;
        this.branchRich = 1;
        this.luminance = 1;
        this.saturation = 1;
        this.rand = 0.1;
        this.template = {};
    }

    /**
     * 拷贝配置参数
     */
    copyParam(param: any) {
        if (param) {
            const _copyObject = (obj1: any, obj2: any) => {
                Object.keys(obj2).forEach(key => {
                    if (obj1[key] != undefined) {
                        if (typeof obj2[key] == 'object')
                            _copyObject(obj1[key], obj2[key]);
                        else obj1[key] = obj2[key];
                    } else {
                        if (typeof obj2[key] == 'object') {
                            obj1[key] = {};
                            _copyObject(obj1[key], obj2[key]);
                        } else obj1[key] = obj2[key];
                    }
                });
            };
            _copyObject(this.template, param);
        }
    }

    /**
     * 获取季节的数字编号
     */
    getSeasonNumber() {
        switch (this.season) {
            case '春季':
                return 0;
            case '夏季':
                return 1;
            case '秋季':
                return 2;
            case '冬季':
                return 3;
        }
        return 0;
    }
}

/**
 * 树干相关参数
 */
export type TrunkParam = {
    length: number, //长度系数
    radius: number, //半径系数
    slices: number, //横向分段数量
    stacks: number, //纵向分段数量
    swing: number, //风力摆动系数
    radiusBegin: number, //始端半径系数
    radiusEnd: number, //终端半径系数
    capType: number, //顶端形状（0：无顶，1：平面，2：圆锥，3：半球）
    bush: boolean, //是否灌木模式（第一层树枝将作为主干，实现多主干）
    stem: boolean, //是否用作茎（使用茎的贴图）
    hide: boolean, //是否隐藏（常用于灌木模式）
    apot: boolean, //是否用作花盆（常用于室内盆景）
    envelope: { x: number, y: number, z: number }, //外形正弦包络（x: 幅度，y: 频率，z:扭转）
    curve: { x: number, z: number, r: number }[], //纵向曲线控制点（xz：位置 r: 半径）
}

/**
 * 树枝相关参数
 */
export type BranchParam = {
    seed: number, //随机数种子
    length: number, //长度系数
    radius: number, //半径系数
    slices: number, //横向分段数量
    stacks: number, //纵向分段数量
    cone: number, //锥度系数
    topNum: number, //顶部树枝数量
    sideNum: number, //周边树枝数量
    sideGrp: number, //周边树枝成组
    sizeRand: number, //尺寸随机量
    radiusBegin: number, //始端半径系数
    radiusEnd: number, //终端半径系数
    angleTop: number, //顶部树枝角度
    angleSide: number, //周边树枝角度
    lenBegin: number, //周边树枝起始长度系数
    lenEnd: number, //周边树枝终止长度系数
    lenTop: number, //顶部树枝长度系数
    posBegin: number, //周边树枝起始位置
    posEnd: number, //周边树枝终止位置
    direction: number, //生长方向（0: 任意 1：竖直向上 2：竖直向下）
    capType: number, //顶端形状（0：无顶，1：平面，2：圆锥，3：半球）
    stem: boolean, //是否用作茎（使用茎的贴图）
    leaf: boolean, //是否包含叶和花（该树枝上是否长树叶和花朵）
    sphere: boolean, //是否圆球模式（用于半球形灌木）
    envelope: { x: number, y: number, z: number }, //外形正弦包络（x: 幅度，y: 频率，z:扭转）
    curve: { x: number, z: number, r: number }[], //曲线控制点（xz：位置 r: 半径）
}

/**
 * 蕨叶相关参数
 */
export type FrondParam = {
    seed: number, //随机数种子
    length: number, //长度系数
    width: number, //宽度系数
    stacks: number, //纵向分段数量
    swing: number, //风力摆动系数
    soft: number, //柔软系数
    cone: number, //锥度系数
    topNum: number, //顶部蕨叶数量
    sideNum: number, //周边蕨叶数量
    sideGrp: number, //周边蕨叶成组
    sizeRand: number, //尺寸随机量
    stemRadius: number, //茎根部半径
    angleTop: number, //顶部蕨叶角度
    angleSide: number, //周边蕨叶角度
    angleRand: number, //顶部角度随机
    angleFace: number, //叶面张开角度
    posBegin: number, //周边蕨叶起始位置
    posEnd: number, //周边蕨叶终止位置
    willow: boolean, //是否柳叶模式（下垂模式）
    onlyTop: boolean, //仅顶部有蕨叶（最后一层树枝才长蕨叶）
    haveStem: boolean, //是否对茎建模（3D模式茎部更有真实感）
    sphere: boolean, //是否圆球模式
    curve: { x: number, z: number, r: number }[], //曲线控制点（xzr：位置）
}

/**
 * 鳞叶相关参数
 */
export type SquamaParam = {
    seed: number, //随机数种子
    length: number, //长度系数
    width: number, //宽度系数
    stacks: number, //纵向分段数量
    swing: number, //风力摆动系数
    soft: number, //柔软度系数
    cone: number, //锥度系数
    topNum: number, //顶部鳞叶数量
    sideNum: number, //周边鳞叶数量
    sideGrp: number, //周边鳞叶成组
    sizeRand: number, //尺寸随机量
    angleTop: number, //顶部鳞叶角度
    angleSide: number, //周边鳞叶角度
    angleRand: number, //顶部角度随机
    angleFace: number, //叶面张开角度
    posBegin: number, //周边鳞叶起始位置
    posEnd: number, //周边鳞叶终止位置
    sphere: boolean, //是否圆球模式
    curve: { x: number, z: number, r: number }[], //曲线控制点（xzr：位置）
}

/**
 * 树叶相关参数
 */
export type LeafParam = {
    length: number, //长度系数
    width: number, //宽度系数
    slices: number, //横向分段数量
    stacks: number, //纵向分段数量
    swing: number, //风力摆动系数
    cone: number, //锥度系数
    uvScale: number, //UV缩放比例
    topNum: number, //顶部树叶数量
    sideNum: number, //周边树叶数量
    sizeRand: number, //尺寸随机量
    group: number, //几片成组
    posRand: number, //位置随机量
    angleRand: number, //角度随机量
    direction: number, //生长方向（0: 任意 1：竖直向上 2：竖直向下 3：背对背）
    sphere: boolean, //是否圆球模式
    angle: { x: number, y: number, z: number }, //旋转方向
    curve: { x: number, z: number, r: number }[], //曲线控制点（xz：位置，r：尺寸）
}

/**
 * 花朵相关参数
 */
export type FlowerParam = {
    radius: number, //半径系数
    width: number, //宽度系数
    stacks: number, //纵向分段数量
    petal: number, //花瓣数量
    layer: number, //花瓣层数
    swing: number, //风力摆动系数
    cone: number, //锥度系数
    topNum: number, //顶部花朵数量
    sideNum: number, //周边花朵数量
    sizeRand: number, //尺寸随机量
    group: number, //几朵成组
    posRand: number, //位置随机量
    angleFace: number, //花瓣角度
    angleOpen: number, //开放角度
    angleRand: number, //角度随机量
    direction: number, //生长方向（0: 任意 1：竖直向上 2：竖直向下 3：背对背）
    complex: boolean, //是否是复杂花朵（类似荷花）
    sphere: boolean, //是否圆球模式
    angle: { x: number, y: number, z: number }, //旋转方向
    curve: { x: number, z: number, r: number }[], //曲线控制点（xzr：位置）
}

/**
 * 树木配置参数（每一种类树木需要一个配置）
 */
export class TreeConfig {
    param = { //纯数据，支持JSON串行化
        treeNum: 1, //同种类树，不同形状的个体数量

        height: 5, //主干高度（米）
        wide: 1, //总体宽度系数（0~10）
        soft: 1, //柔软系数（0~2）
        drop: 0, //下垂系数（-2，2）
        lodNum: 4, //LOD级数
        lodDist: 64, //LOD距离
        visDist: 128, //可视距离
        luminance: 1, //亮度系数
        saturation: 1, //饱和系数
        uvScale: { u: 1, v: 0.5 }, //UV缩放比例
        hue: { spring: 0, summer: 0, autumn: 0, winter: 0 }, //四季色相系数

        texture: { //各类贴图
            bark: TreeTestRender.confRootPath + "bark/bark01.png", //树皮
            stem: TreeTestRender.confRootPath + "stem/stem01.png", //树茎
            leaf: TreeTestRender.confRootPath + "leaf/leaf01.png", //树叶或蕨叶
            squama: TreeTestRender.confRootPath + "squama/squama01.png", //鳞叶
            flower: TreeTestRender.confRootPath + "flower/flower01.png", //花朵
        },

        trunk: { //树干参数
            seed: 1,
            length: 1,
            radius: 0.05,
            slices: 7,
            stacks: 15,
            swing: 0,
            radiusBegin: 0.8,
            radiusEnd: 0.4,
            capType: 0,
            bush: false,
            stem: false,
            hide: false,
            apot: false,
            envelope: { x: 0, y: 0, z: 0 },
            curve: [
                { x: 0, z: 0, r: 1.2 },
                { x: 0.04, z: 0.03, r: 1.2 },
                { x: 0.02, z: 0.01, r: 0.8 },
                { x: 0.05, z: 0.05, r: 0.9 },
                { x: 0.09, z: 0.08, r: 0.5 },
                { x: 0.06, z: 0.05, r: 0.8 },
                { x: 0.05, z: 0.02, r: 0.6 },
                { x: 0.05, z: 0.02, r: 0.6 },
                { x: 0.05, z: 0.02, r: 0.6 },
                { x: 0.05, z: 0.02, r: 0.6 },
            ],
        },

        branch: [
            { //第一层树枝参数
                seed: 1,
                length: 0.35,
                radius: 0.015,
                slices: 3,
                stacks: 5,
                cone: 0,
                topNum: 2,
                sideNum: 8,
                sideGrp: 4,
                sizeRand: 0,
                radiusBegin: 1,
                radiusEnd: 0.35,
                angleTop: 20,
                angleSide: 30,
                lenBegin: 1,
                lenEnd: 1,
                lenTop: 1,
                posBegin: 0.4,
                posEnd: 0.8,
                direction: 0,
                capType: 0,
                stem: false,
                leaf: false,
                sphere: false,
                envelope: { x: 0, y: 0, z: 0 },
                curve: [
                    { x: 0, z: 0, r: 1 },
                    { x: 0.01, z: 0.01, r: 1 },
                    { x: 0.02, z: 0.05, r: 1 },
                    { x: 0.07, z: 0.08, r: 1 },
                    { x: 0.05, z: 0.05, r: 1 },
                    { x: 0.05, z: 0.02, r: 1 },
                    { x: 0.0, z: 0.0, r: 1 },
                    { x: 0.0, z: 0.0, r: 1 },
                ],
            },
            { //第二层树枝参数
                seed: 1,
                length: 0.2,
                radius: 0.005,
                slices: 3,
                stacks: 4,
                cone: 0,
                topNum: 2,
                sideNum: 2,
                sideGrp: 1,
                sizeRand: 0,
                radiusBegin: 1,
                radiusEnd: 0.5,
                angleTop: 20,
                angleSide: 30,
                lenBegin: 1,
                lenEnd: 1,
                lenTop: 1,
                posBegin: 0.5,
                posEnd: 0.8,
                direction: 0,
                capType: 0,
                stem: false,
                leaf: false,
                sphere: false,
                envelope: { x: 0, y: 0, z: 0 },
                curve: [
                    { x: 0, z: 0, r: 1 },
                    { x: 0.01, z: 0.01, r: 1 },
                    { x: 0.02, z: 0.05, r: 1 },
                    { x: 0.07, z: 0.08, r: 1 },
                    { x: 0.05, z: 0.05, r: 1 },
                    { x: 0.05, z: 0.02, r: 1 },
                ],
            },
            { //第三层树枝参数
                seed: 1,
                length: 0.2,
                radius: 0.0025,
                slices: 3,
                stacks: 4,
                cone: 0,
                topNum: 2,
                sideNum: 2,
                sideGrp: 1,
                sizeRand: 0,
                radiusBegin: 1,
                radiusEnd: 0.5,
                angleTop: 20,
                angleSide: 30,
                lenBegin: 1,
                lenEnd: 1,
                lenTop: 1,
                posBegin: 0.5,
                posEnd: 0.8,
                direction: 0,
                capType: 0,
                stem: false,
                leaf: true,
                sphere: false,
                curve: [
                    { x: 0, z: 0, r: 1 },
                    { x: 0.01, z: 0.01, r: 1 },
                    { x: 0.02, z: 0.05, r: 1 },
                    { x: 0.07, z: 0.08, r: 1 },
                ],
            },
            { //第四层树枝参数
                seed: 1,
                length: 0.1,
                radius: 0.00125,
                slices: 3,
                stacks: 3,
                cone: 0,
                topNum: 1,
                sideNum: 2,
                sideGrp: 1,
                sizeRand: 0,
                radiusBegin: 1,
                radiusEnd: 0.2,
                angleTop: 20,
                angleSide: 30,
                lenBegin: 1,
                lenEnd: 1,
                lenTop: 1,
                posBegin: 0.5,
                posEnd: 0.8,
                direction: 0,
                capType: 0,
                stem: false,
                leaf: true,
                sphere: false,
                curve: [
                    { x: 0, z: 0, r: 1 },
                    { x: 0, z: 0, r: 1 },
                    { x: 0, z: 0, r: 1 },
                    { x: 0, z: 0, r: 1 },
                ],
            }],

        frond: { //蕨叶参数
            seed: 1,
            length: 0.5,
            width: 0.2,
            stacks: 12,
            swing: 1,
            soft: 1,
            cone: 0,
            topNum: 0,
            sideNum: 0,
            sideGrp: 1,
            sizeRand: 0,
            stemRadius: 0.02,
            angleSide: 85,
            angleTop: 75,
            angleRand: 40,
            angleFace: 35,
            posBegin: 0.9,
            posEnd: 1.0,
            willow: false,
            onlyTop: true,
            haveStem: false,
            sphere: false,
            curve: [
                { x: 0, z: 0, r: 1 },
                { x: 0, z: -0.06, r: 1 },
                { x: 0, z: -0.15, r: 1 },
                { x: 0, z: -0.03, r: 1 },
                { x: 0, z: -0.05, r: 1 },
                { x: 0, z: 0.05, r: 1 },
            ],
        },

        squama: { //鳞叶参数
            seed: 1,
            length: 0.06,
            width: 0.08,
            stacks: 1,
            swing: 0,
            soft: 1,
            cone: 0,
            topNum: 0,
            sideNum: 0,
            sideGrp: 1,
            sizeRand: 0,
            angleSide: 45,
            angleTop: 15,
            angleRand: 20,
            angleFace: -10,
            posBegin: 0.7,
            posEnd: 1.0,
            sphere: false,
            curve: [
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
            ],
        },

        leaf: { //树叶参数
            length: 0.05,
            width: 0.05,
            slices: 1,
            stacks: 1,
            swing: 1,
            cone: 0,
            uvScale: 1,
            topNum: 0,
            sideNum: 5,
            sizeRand: 0,
            group: 1,
            posRand: 0.5,
            angleRand: 10,
            direction: 0,
            sphere: false,
            angle: { x: 0, y: 240, z: 90 },
            curve: [
                { x: 0, z: 0, r: 1 },
                { x: 0.01, z: 0.01, r: 1 },
                { x: 0.03, z: 0.02, r: 1 },
                { x: 0.05, z: 0.02, r: 1 },
            ],
        },

        flower: { //花朵参数
            radius: 0.015,
            width: 0.04,
            stacks: 1,
            petal: 5,
            layer: 1,
            swing: 0,
            cone: 0,
            topNum: 1,
            sideNum: 0,
            sizeRand: 0.2,
            group: 1,
            posRand: 0.5,
            angleFace: 0,
            angleOpen: 0,
            angleRand: 10,
            direction: 0,
            complex: false,
            sphere: false,
            angle: { x: 90, y: 180, z: 90 },
            curve: [
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
                { x: 0, z: 0, r: 1 },
            ],
        },
    };

    private _point: Vector3 = new Vector3(); //内部使用矢量
    private _bArray: any[] = []; //内部使用数组
    private _cArray: any[] = []; //内部使用数组

    gpuLod: boolean = true; //是否支持GPU细节层次
    gpuWind: boolean = true; //是否支持GPU随风摇动

    paramTexSize: number = 256; //树木参数贴图尺寸

    branchNum: number[] = []; //各层树枝总数量
    leafNum: number[] = []; //各层树叶总数量
    frondNum: number[] = []; //各层蕨叶总数量
    squamaNum: number[] = []; //各层鳞叶总数量
    flowerNum: number[] = []; //各层花朵总数量

    branchStart: number[] = []; //各层树枝编号起始
    leafStart: number = 0; //树叶编号起始
    frondStart: number = 0; //蕨叶编号起始
    squamaStart: number = 0; //鳞叶编号开始
    flowerStart: number = 0; //花朵编号开始

    dataStep: number = 16; //数据段长度
    dataLength: number; //树木数据长度
    faceNum: number //树木总面数（LOD0）

    grow: number = 1; //生长系数
    season: number = 0; //季节系数（0~3）代表春夏秋冬
    wind: Vector4 = new Vector4(1, 1, 0, 0); //风力参数
    showBranch: boolean = true; //是否显示树枝
    showLeaf: boolean = true; //是否显示树叶
    showFrond: boolean = true; //是否显示蕨叶
    showSquama: boolean = true; //是否显示鳞叶
    showFlower: boolean = true; //是否显示花朵
    showBound: boolean = false; //是否显示包围盒
    log: boolean = false; //是否打印信息

    constructor() {
        this.calcBranchAndLeafNum();
        this.calcFaceNum();
    }

    /**
     * 计算树枝和树叶总数量
     */
    calcBranchAndLeafNum() {
        this.branchNum[0] = (this.param.branch[0].sideNum + this.param.branch[0].topNum);
        this.branchNum[1] = (this.param.branch[1].sideNum + this.param.branch[1].topNum) * this.branchNum[0];
        this.branchNum[2] = (this.param.branch[2].sideNum + this.param.branch[2].topNum) * this.branchNum[1];
        this.branchNum[3] = (this.param.branch[3].sideNum + this.param.branch[3].topNum) * this.branchNum[2];

        for (let i = 0; i < 4; i++) {
            if (this.param.leaf && (this.param.branch[i].leaf || this.param.branch[i].leaf == undefined))
                this.leafNum[i] = this.branchNum[i] * (this.param.leaf.topNum + this.param.leaf.sideNum);
            else this.leafNum[i] = 0;
            if (this.param.frond) {
                const num = this.param.frond.topNum + this.param.frond.sideNum;
                if (i == 0)
                    this.frondNum[i] = num;
                else this.frondNum[i] = this.branchNum[i - 1] * num;
                if (this.param.frond.onlyTop) {
                    for (let i = 3; i > -1; i--) {
                        if (this.frondNum[i] > 0) {
                            for (let j = 0; j < i; j++)
                                this.frondNum[j] = 0;
                            break;
                        }
                    }
                }
            } else this.frondNum[i] = 0;
            if (this.param.squama) {
                const num = this.param.squama.topNum + this.param.squama.sideNum;
                if (i == 0)
                    this.squamaNum[i] = num;
                else this.squamaNum[i] = this.branchNum[i - 1] * num;
            } else this.squamaNum[i] = 0;
            if (this.param.flower && (this.param.branch[i].leaf || this.param.branch[i].leaf == undefined)) {
                this.flowerNum[i] = this.branchNum[i] * (this.param.flower.topNum + this.param.flower.sideNum);
            } else this.flowerNum[i] = 0;
        }

        this.branchStart[0] = 1;
        this.branchStart[1] = this.branchStart[0] + this.branchNum[0];
        this.branchStart[2] = this.branchStart[1] + this.branchNum[1];
        this.branchStart[3] = this.branchStart[2] + this.branchNum[2];
        this.leafStart = this.branchStart[3] + this.branchNum[3];
        this.frondStart = this.leafStart;
        for (let i = 0; i < 4; i++)
            this.frondStart += this.leafNum[i];
        this.squamaStart = this.frondStart;
        for (let i = 0; i < 4; i++)
            this.squamaStart += this.frondNum[i];
        this.flowerStart = this.squamaStart;
        for (let i = 0; i < 4; i++)
            this.flowerStart += this.squamaNum[i];

        this.dataLength = (this.calcTreeCodeMax() + 1) * this.dataStep;

        if (this.log) {
            console.log("tree branchNum =", this.branchNum[0], this.branchNum[1], this.branchNum[2], this.branchNum[3]);
            console.log("tree leafNum =", this.leafNum[0], this.leafNum[1], this.leafNum[2], this.leafNum[3]);
            console.log("tree frondNum =", this.frondNum[0], this.frondNum[1], this.frondNum[2], this.frondNum[3]);
            console.log("tree squamaNum =", this.squamaNum[0], this.squamaNum[1], this.squamaNum[2], this.squamaNum[3]);
            console.log("tree flowerNum =", this.flowerNum[0], this.flowerNum[1], this.flowerNum[2], this.flowerNum[3]);
            console.log("tree branchStart =", this.branchStart[0], this.branchStart[1], this.branchStart[2], this.branchStart[3]);
            console.log("tree leafStart =", this.leafStart);
            console.log("tree frondStart =", this.frondStart);
            console.log("tree squamaStart =", this.squamaStart);
            console.log("tree flowerStart =", this.flowerStart);
        }
    }

    /**
     * 计算树干编号最大值
     * @returns 
     */
    calcBranchCodeMax() {
        let num = 0;
        for (let i = 0; i < 4; i++)
            num += this.branchNum[i];
        return num;
    }

    /**
     * 计算编号最大值
     * @returns 
     */
    calcTreeCodeMax() {
        let num = this.calcBranchCodeMax();
        for (let i = 0; i < 4; i++) {
            num += this.leafNum[i];
            num += this.frondNum[i];
            num += this.squamaNum[i];
            num += this.flowerNum[i];
        }
        return num;
    }

    /**
     * 计算树木面数
     */
    calcFaceNum() {
        const trunk = this.param.trunk;
        let trunkFace = trunk.slices * trunk.stacks * 2;
        if (trunk.capType == 1) trunkFace += trunk.slices - 2;

        const branchFace = [];
        const leafFace = [];
        const frondFace = [];
        const squamaFace = [];
        const flowerFace = [];
        const leaf = this.param.leaf;
        const frond = this.param.frond;
        const squama = this.param.squama;
        const flower = this.param.flower;
        for (let i = 0; i < 4; i++) {
            const branch = this.param.branch[i];
            branchFace[i] = branch.slices * branch.stacks * 2;
            if (branch.capType == 1)
                branchFace[i] += branch.slices - 2;
            branchFace[i] *= this.branchNum[i];
            leafFace[i] = leaf.slices * leaf.stacks * 2;
            leafFace[i] *= this.leafNum[i];
            if (frond) {
                frondFace[i] = frond.stacks * 4;
                frondFace[i] *= this.frondNum[i];
            } else frondFace[i] = 0;
            if (squama) {
                squamaFace[i] = squama.stacks * 4;
                squamaFace[i] *= this.squamaNum[i];
            } else squamaFace[i] = 0;
            if (flower.complex)
                flowerFace[i] = flower.layer * flower.petal * flower.stacks * 4;
            else flowerFace[i] = 4;
            flowerFace[i] *= this.flowerNum[i];
        }

        this.faceNum = trunk.hide ? 0 : trunkFace;
        for (let i = 0; i < 4; i++) {
            this.faceNum += branchFace[i];
            this.faceNum += leafFace[i];
            this.faceNum += frondFace[i];
            this.faceNum += squamaFace[i];
            this.faceNum += flowerFace[i];
        }

        if (this.log)
            console.log("tree faceNum =", this.faceNum);
    }

    /**
     * 根据编号返回树枝的长度系数
     * @param code 
     * @param ct 
     * @param level 
     * @returns 
     */
    getBranchLen(code: number, ct: number, level: number) {
        const param = this.param.branch[level - 1];
        const sideNum = param.sideNum > 1 ? param.sideNum : 2;
        if (code % (sideNum + param.topNum) > sideNum - 1)
            return param.lenTop * (1 - ct * param.cone);
        return (param.lenBegin + ((code % sideNum) / (sideNum - 1)) * (param.lenEnd - param.lenBegin)) * (1 - ct * param.cone);
    }

    /**
     * 根据编号返回树枝的位置系数
     * @param code 
     * @param level 
     * @returns 
     */
    getBranchPos(code: number, level: number) {
        const param = this.param.branch[level - 1];
        const sideNum = param.sideNum > 1 ? param.sideNum : 2;
        if (code % (sideNum + param.topNum) > sideNum - 1) return 1;
        return param.posBegin + ((code % sideNum) / (sideNum - 1)) * (param.posEnd - param.posBegin);
    }

    /**
     * 根据编号返回蕨叶位置系数
     * @param code 
     * @returns 
     */
    getFrondPos(code: number) {
        const param = this.param.frond;
        const sideNum = param.sideNum > 1 ? param.sideNum : 2;
        if (code % (sideNum + param.topNum) > sideNum - 1) return 1;
        return param.posBegin + ((code % sideNum) / (sideNum - 1)) * (param.posEnd - param.posBegin);
    }

    /**
     * 根据编号返回鳞叶位置系数
     * @param code 
     * @returns 
     */
    getSquamaPos(code: number) {
        const param = this.param.squama;
        const sideNum = param.sideNum > 1 ? param.sideNum : 2;
        if (code % (sideNum + param.topNum) > sideNum - 1) return 1;
        return param.posBegin + ((code % sideNum) / (sideNum - 1)) * (param.posEnd - param.posBegin);
    }

    /**
     * 计算阶乘
     * @param n 
     * @returns 
     */
    private _factorial(n: number) {
        let result = 1;
        if (n == 0) return 1;
        for (let i = 1; i <= n; i++)
            result *= i;
        return result;
    }

    /**
     * 获取贝塞尔曲线（调节树枝弯曲度和半径等）
     * @param ctrl 曲线参数
     * @param t 0~1系数
     * @param h 高度或长度
     * @returns 
     */
    getCurve(ctrl: any[], t: number, h: number = 1) {
        const n = ctrl.length;
        const p = this._point;
        const b = this._bArray;
        const c = this._cArray;
        if (t < 0) t = 0;
        if (t > 1) t = 1;

        for (let i = 0; i < n; i++)
            c[i] = this._factorial(n - 1) / this._factorial(n - 1 - i) / this._factorial(i);
        for (let i = 0; i < n; i++)
            b[i] = c[i] * Math.pow(1 - t, n - 1 - i) * Math.pow(t, i);

        p.x = ctrl[0].x * b[0];
        p.y = ctrl[0].z * b[0];
        p.z = ctrl[0].r * b[0];
        for (let i = 1; i < n; i++) {
            p.x += ctrl[i].x * b[i];
            p.y += ctrl[i].z * b[i];
            p.z += ctrl[i].r * b[i];
        }
        p.x *= h;
        p.y *= h;
        return p;
    }

    /**
     * 获取包络（调节树枝径向形状）
     * @param envelope 包络参数
     * @param a2t 横向0~1系数
     * @param b2t 纵向0~1系数
     * @returns 
     */
    getEnvelope(envelope: any, a2t: number, b2t: number) {
        return Math.sin(a2t * envelope.y * Math.PI * 2 + b2t * envelope.z) * envelope.x + 1;
    }

    /**
     * 数据JSON保存
     */
    toJson() {
        const json = JSON.stringify(this.param);
        return json;
    }

    /**
     * 解析JSON数据
     * @param json 
     */
    parseJson(json: string) {
        this.param = JSON.parse(json);
        this.calcBranchAndLeafNum();
        this.calcFaceNum();
    }

    /**
     * 设置配置数据
     * @param param 
     */
    setParam(param: any) {
        if (param) {
            this.param = param;
            this.calcBranchAndLeafNum();
            this.calcFaceNum();
        }
    }

    /**
     * 拷贝配置参数
     */
    copyParam(param: any) {
        if (param) {
            const _copyObject = (obj1: any, obj2: any) => {
                Object.keys(obj2).forEach(key => {
                    if (obj1[key] != undefined) {
                        if (typeof obj2[key] == 'object')
                            _copyObject(obj1[key], obj2[key]);
                        else obj1[key] = obj2[key];
                    }
                });
            };
            _copyObject(this.param, param);
            this.calcBranchAndLeafNum();
            this.calcFaceNum();
        }
    }

    /**
     * 重置树干
     */
    initTrunk() {
        const length = 1;
        const radius = 0.05;
        const trunk = this.param.trunk;
        trunk.length = length;
        trunk.radius = radius;
        trunk.slices = 5;
        trunk.stacks = 5;
        trunk.swing = 0;
        trunk.radiusBegin = 1;
        trunk.radiusEnd = 0.4;
        trunk.capType = 0;
        trunk.bush = false;
        trunk.stem = false;
        trunk.hide = false;
        trunk.apot = false;
        trunk.envelope.x = 0;
        trunk.envelope.y = 0;
        trunk.envelope.z = 0;
        this.resetTrunkCurve();
    }

    /**
     * 重置树枝（第一层）
     */
    initBranch0() {
        const length = 0.5;
        const radius = 0.02;
        const branch = this.param.branch[0];
        branch.seed = 1;
        branch.length = length;
        branch.radius = radius;
        branch.slices = 3;
        branch.stacks = 3;
        branch.cone = 0;
        branch.topNum = 2;
        branch.sideNum = 2;
        branch.sideGrp = 1;
        branch.sizeRand = 0;
        branch.radiusBegin = 1;
        branch.radiusEnd = 0.4;
        branch.angleSide = 40;
        branch.angleTop = 20;
        branch.lenBegin = 1;
        branch.lenEnd = 1;
        branch.lenTop = 1;
        branch.posBegin = 0.4;
        branch.posEnd = 0.8;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = false;
        branch.sphere = false;
        this.resetBranch0Curve();
    }

    /**
     * 去除树枝（第一层）
     */
    removeBranch0() {
        const branch = this.param.branch[0];
        branch.seed = 0;
        branch.length = 0;
        branch.radius = 0;
        branch.slices = 0;
        branch.stacks = 0;
        branch.cone = 0;
        branch.topNum = 0;
        branch.sideNum = 0;
        branch.sideGrp = 0;
        branch.sizeRand = 0;
        branch.radiusBegin = 0;
        branch.radiusEnd = 0;
        branch.angleSide = 0;
        branch.angleTop = 0;
        branch.lenBegin = 0;
        branch.lenEnd = 0;
        branch.lenTop = 0;
        branch.posBegin = 0;
        branch.posEnd = 0;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = false;
        branch.sphere = false;
        this.resetBranch0Curve();
    }

    /**
     * 重置树枝（第二层）
     */
    initBranch1() {
        const length = 0.25;
        const radius = 0.008;
        const branch = this.param.branch[1];
        branch.seed = 1;
        branch.length = length;
        branch.radius = radius;
        branch.slices = 3;
        branch.stacks = 3;
        branch.cone = 0;
        branch.topNum = 2;
        branch.sideNum = 2;
        branch.sideGrp = 1;
        branch.sizeRand = 0;
        branch.radiusBegin = 1;
        branch.radiusEnd = 0.4;
        branch.angleSide = 40;
        branch.angleTop = 20;
        branch.lenBegin = 1;
        branch.lenEnd = 1;
        branch.lenTop = 1;
        branch.posBegin = 0.4;
        branch.posEnd = 0.8;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = false;
        branch.sphere = false;
        this.resetBranch1Curve();
    }

    /**
     * 去除树枝（第二层）
     */
    removeBranch1() {
        const branch = this.param.branch[1];
        branch.seed = 0;
        branch.length = 0;
        branch.radius = 0;
        branch.slices = 0;
        branch.stacks = 0;
        branch.cone = 0;
        branch.topNum = 0;
        branch.sideNum = 0;
        branch.sideGrp = 0;
        branch.sizeRand = 0;
        branch.radiusBegin = 0;
        branch.radiusEnd = 0;
        branch.angleSide = 0;
        branch.angleTop = 0;
        branch.lenBegin = 0;
        branch.lenEnd = 0;
        branch.lenTop = 0;
        branch.posBegin = 0;
        branch.posEnd = 0;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = false;
        branch.sphere = false;
        this.resetBranch0Curve();
    }

    /**
     * 重置树枝（第三层）
     */
    initBranch2() {
        const length = 0.125;
        const radius = 0.0032;
        const branch = this.param.branch[2];
        branch.seed = 1;
        branch.length = length;
        branch.radius = radius;
        branch.slices = 3;
        branch.stacks = 3;
        branch.cone = 0;
        branch.topNum = 2;
        branch.sideNum = 2;
        branch.sideGrp = 1;
        branch.sizeRand = 0;
        branch.radiusBegin = 1;
        branch.radiusEnd = 0.4;
        branch.angleSide = 40;
        branch.angleTop = 20;
        branch.lenBegin = 1;
        branch.lenEnd = 1;
        branch.lenTop = 1;
        branch.posBegin = 0.4;
        branch.posEnd = 0.8;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = true;
        branch.sphere = false;
        this.resetBranch1Curve();
    }

    /**
     * 去除树枝（第三层）
     */
    removeBranch2() {
        const branch = this.param.branch[2];
        branch.seed = 0;
        branch.length = 0;
        branch.radius = 0;
        branch.slices = 0;
        branch.stacks = 0;
        branch.cone = 0;
        branch.topNum = 0;
        branch.sideNum = 0;
        branch.sideGrp = 0;
        branch.sizeRand = 0;
        branch.radiusBegin = 0;
        branch.radiusEnd = 0;
        branch.angleSide = 0;
        branch.angleTop = 0;
        branch.lenBegin = 0;
        branch.lenEnd = 0;
        branch.lenTop = 0;
        branch.posBegin = 0;
        branch.posEnd = 0;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = false;
        branch.sphere = false;
        this.resetBranch0Curve();
    }

    /**
     * 重置树枝（第四层）
     */
    initBranch3() {
        const length = 0.0625;
        const radius = 0.00128;
        const branch = this.param.branch[3];
        branch.seed = 1;
        branch.length = length;
        branch.radius = radius;
        branch.slices = 3;
        branch.stacks = 3;
        branch.cone = 0;
        branch.topNum = 2;
        branch.sideNum = 2;
        branch.sideGrp = 1;
        branch.sizeRand = 0;
        branch.radiusBegin = 1;
        branch.radiusEnd = 0.4;
        branch.angleSide = 40;
        branch.angleTop = 20;
        branch.lenBegin = 1;
        branch.lenEnd = 1;
        branch.lenTop = 1;
        branch.posBegin = 0.4;
        branch.posEnd = 0.8;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = true;
        branch.sphere = false;
        this.resetBranch1Curve();
    }

    /**
     * 去除树枝（第四层）
     */
    removeBranch3() {
        const branch = this.param.branch[3];
        branch.seed = 0;
        branch.length = 0;
        branch.radius = 0;
        branch.slices = 0;
        branch.stacks = 0;
        branch.cone = 0;
        branch.topNum = 0;
        branch.sideNum = 0;
        branch.sideGrp = 0;
        branch.sizeRand = 0;
        branch.radiusBegin = 0;
        branch.radiusEnd = 0;
        branch.angleSide = 0;
        branch.angleTop = 0;
        branch.lenBegin = 0;
        branch.lenEnd = 0;
        branch.lenTop = 0;
        branch.posBegin = 0;
        branch.posEnd = 0;
        branch.direction = 0;
        branch.capType = 0;
        branch.stem = false;
        branch.leaf = false;
        branch.sphere = false;
        this.resetBranch0Curve();
    }

    /**
     * 重置树干曲线
     */
    resetTrunkCurve() {
        const trunk = this.param.trunk;
        if (trunk) {
            for (let i = 0; i < trunk.curve.length; i++) {
                trunk.curve[i].x = 0;
                trunk.curve[i].z = 0;
                trunk.curve[i].r = 1;
            }
        }
    }

    /**
     * 重置树枝曲线
     */
    resetBranch0Curve() {
        const branch = this.param.branch[0];
        if (branch) {
            for (let i = 0; i < branch.curve.length; i++) {
                branch.curve[i].x = 0;
                branch.curve[i].z = 0;
                branch.curve[i].r = 1;
            }
        }
    }

    /**
     * 重置树枝曲线
     */
    resetBranch1Curve() {
        const branch = this.param.branch[1];
        if (branch) {
            for (let i = 0; i < branch.curve.length; i++) {
                branch.curve[i].x = 0;
                branch.curve[i].z = 0;
                branch.curve[i].r = 1;
            }
        }
    }

    /**
     * 重置树枝曲线
     */
    resetBranch2Curve() {
        const branch = this.param.branch[2];
        if (branch) {
            for (let i = 0; i < branch.curve.length; i++) {
                branch.curve[i].x = 0;
                branch.curve[i].z = 0;
                branch.curve[i].r = 1;
            }
        }
    }

    /**
     * 重置树枝曲线
     */
    resetBranch3Curve() {
        const branch = this.param.branch[3];
        if (branch) {
            for (let i = 0; i < branch.curve.length; i++) {
                branch.curve[i].x = 0;
                branch.curve[i].z = 0;
                branch.curve[i].r = 1;
            }
        }
    }

    /**
     * 重置树叶曲线
     */
    resetLeafCurve() {
        const leaf = this.param.leaf;
        for (let i = 0; i < leaf.curve.length; i++) {
            leaf.curve[i].x = 0;
            leaf.curve[i].z = 0;
            leaf.curve[i].r = 1;
        }
    }

    /**
     * 重置树叶参数
     */
    initLeaf() {
        const leaf = this.param.leaf;
        leaf.length = 0.05;
        leaf.width = 0.05;
        leaf.slices = 1;
        leaf.stacks = 1;
        leaf.swing = 1;
        leaf.cone = 0;
        leaf.uvScale = 1;
        leaf.topNum = 1;
        leaf.sideNum = 4;
        leaf.sizeRand = 0;
        leaf.group = 1;
        leaf.posRand = 0.5;
        leaf.angleRand = 10;
        leaf.direction = 0;
        leaf.angle.x = 0;
        leaf.angle.y = 0;
        leaf.angle.z = 0;
        leaf.sphere = false;
        this.resetLeafCurve();
    }

    /**
     * 去除树枝
     */
    removeLeaf() {
        const leaf = this.param.leaf;
        leaf.length = 0;
        leaf.width = 0;
        leaf.slices = 0;
        leaf.stacks = 0;
        leaf.swing = 0;
        leaf.cone = 0;
        leaf.uvScale = 0;
        leaf.topNum = 0;
        leaf.sideNum = 0;
        leaf.sizeRand = 0;
        leaf.group = 0;
        leaf.posRand = 0;
        leaf.angleRand = 0;
        leaf.direction = 0;
        leaf.angle.x = 0;
        leaf.angle.y = 0;
        leaf.angle.z = 0;
        leaf.sphere = false;
        this.resetLeafCurve();
    }

    /**
     * 重置蕨叶曲线
     */
    resetFrondCurve() {
        const frond = this.param.frond;
        for (let i = 0; i < frond.curve.length; i++) {
            frond.curve[i].x = 0;
            frond.curve[i].z = 0;
            frond.curve[i].r = 1;
        }
    }

    /**
     * 重置蕨叶参数
     */
    initFrond() {
        const frond = this.param.frond;
        frond.seed = 1;
        frond.length = 0.5;
        frond.width = 0.05;
        frond.stacks = 3;
        frond.swing = 1;
        frond.soft = 1;
        frond.cone = 0;
        frond.topNum = 0;
        frond.sideNum = 0;
        frond.sideGrp = 1;
        frond.sizeRand = 0;
        frond.stemRadius = 0.02;
        frond.angleSide = 40;
        frond.angleTop = 20;
        frond.posBegin = 0.9;
        frond.posEnd = 1;
        frond.willow = false;
        frond.onlyTop = false;
        frond.haveStem = false;
        frond.sphere = false;
        this.resetFrondCurve();
    }

    /**
     * 去除蕨叶
     */
    removeFrond() {
        const frond = this.param.frond;
        frond.seed = 0;
        frond.length = 0;
        frond.width = 0;
        frond.stacks = 0;
        frond.swing = 0;
        frond.soft = 0;
        frond.cone = 0;
        frond.topNum = 0;
        frond.sideNum = 0;
        frond.sideGrp = 0;
        frond.sizeRand = 0;
        frond.stemRadius = 0;
        frond.angleSide = 0;
        frond.angleTop = 0;
        frond.posBegin = 0;
        frond.posEnd = 0;
        frond.willow = false;
        frond.onlyTop = false;
        frond.haveStem = false;
        frond.sphere = false;
        this.resetFrondCurve();
    }

    /**
     * 重置鳞叶曲线
     */
    resetSquamaCurve() {
        const squama = this.param.squama;
        for (let i = 0; i < squama.curve.length; i++) {
            squama.curve[i].x = 0;
            squama.curve[i].z = 0;
            squama.curve[i].r = 1;
        }
    }

    /**
     * 重置鳞叶参数
     */
    initSquama() {
        const squama = this.param.squama;
        squama.seed = 1;
        squama.length = 0.05;
        squama.width = 0.05;
        squama.stacks = 1;
        squama.swing = 0;
        squama.soft = 1;
        squama.cone = 0;
        squama.topNum = 0;
        squama.sideNum = 0;
        squama.sideGrp = 1;
        squama.sizeRand = 0;
        squama.angleSide = 45;
        squama.angleTop = 15;
        squama.angleRand = 20;
        squama.angleFace = 0;
        squama.posBegin = 0.5;
        squama.posEnd = 1.0;
        squama.sphere = false;
        this.resetSquamaCurve();
    }

    /**
     * 去除鳞叶
     */
    removeSquama() {
        const squama = this.param.squama;
        squama.seed = 0;
        squama.length = 0;
        squama.width = 0;
        squama.stacks = 0;
        squama.swing = 0;
        squama.soft = 0;
        squama.cone = 0;
        squama.topNum = 0;
        squama.sideNum = 0;
        squama.sideGrp = 0;
        squama.sizeRand = 0;
        squama.angleSide = 0;
        squama.angleTop = 0;
        squama.angleRand = 0;
        squama.angleFace = 0;
        squama.posBegin = 0;
        squama.posEnd = 0;
        squama.sphere = false;
        this.resetSquamaCurve();
    }

    /**
     * 重置花朵曲线
     */
    resetFlowerCurve() {
        const flower = this.param.flower;
        for (let i = 0; i < flower.curve.length; i++) {
            flower.curve[i].x = 0;
            flower.curve[i].z = 0;
            flower.curve[i].r = 1;
        }
    }

    /**
     * 重置花朵参数
     */
    initFlower() {
        const flower = this.param.flower;
        flower.radius = 0.02;
        flower.width = 0.02;
        flower.stacks = 3;
        flower.petal = 1;
        flower.layer = 1;
        flower.swing = 1;
        flower.cone = 0;
        flower.topNum = 1;
        flower.sideNum = 2;
        flower.sizeRand = 0;
        flower.group = 1;
        flower.posRand = 0.5;
        flower.angleFace = 0;
        flower.angleOpen = 0;
        flower.angleRand = 10;
        flower.direction = 0;
        flower.angle.x = 0;
        flower.angle.y = 0;
        flower.angle.z = 0;
        flower.complex = false;
        flower.sphere = false;
        this.resetFlowerCurve();
    }

    /**
     * 去除花朵
     */
    removeFlower() {
        const flower = this.param.flower;
        flower.radius = 0;
        flower.width = 0;
        flower.stacks = 0;
        flower.petal = 0;
        flower.layer = 0;
        flower.swing = 0;
        flower.cone = 0;
        flower.topNum = 0;
        flower.sideNum = 0;
        flower.sizeRand = 0;
        flower.group = 0;
        flower.posRand = 0;
        flower.angleFace = 0;
        flower.angleOpen = 0;
        flower.angleRand = 0;
        flower.direction = 0;
        flower.angle.x = 0;
        flower.angle.y = 0;
        flower.angle.z = 0;
        flower.complex = false;
        flower.sphere = false;
        this.resetFlowerCurve();
    }

    /**
     * 初始化配置参数
     */
    initParam() {
        //总体
        const param = this.param;
        param.treeNum = 1;
        param.height = 5;
        param.wide = 1;
        param.drop = 0;
        param.soft = 1;
        param.lodNum = 4;
        param.lodDist = 64;
        param.visDist = 128;
        param.uvScale.u = 1;
        param.uvScale.v = 0.25;

        //贴图
        const texture = param.texture;
        texture.bark = "bark/bark01.png";
        texture.stem = "stem/stem01.png";
        texture.leaf = "leaf/leaf01.png";
        texture.squama = "squama/squama01.png";
        texture.flower = "flower/flower01.png";

        //部件
        this.initTrunk();
        this.initBranch0();
        this.initBranch1();
        this.initBranch2();
        this.initBranch3();
        this.initLeaf();
        this.initFrond();
        this.initSquama();
        this.initFlower();
    }

    /**
     * 随机配置参数
     */
    randParam() {
        this.initParam();
        const param = this.param;

        //树干
        let cx = 0, cz = 0, cr = 1;
        let length = MathEx.random(0.8, 1.2);
        let radius = MathEx.random(0.04, 0.06);
        const trunk = param.trunk;
        trunk.length = length;
        trunk.radius = radius;
        trunk.radiusBegin = MathEx.random(0.8, 1.2);
        trunk.radiusEnd = MathEx.random(0.3, 0.5);
        for (let i = 1; i < 9; i++) {
            cx += MathEx.random(-0.01, 0.01);
            cz += MathEx.random(-0.01, 0.01);
            cr += MathEx.random(-0.05, 0.05);
            trunk.curve[i].x = cx;
            trunk.curve[i].z = cz;
            trunk.curve[i].r = cr;
        }

        //树枝
        for (let i = 0; i < 4; i++) {
            length *= 0.5;
            radius *= 0.4;
            const cn = [8, 6, 4, 4];
            const branch = param.branch[i];
            branch.length = length;
            branch.radius = radius;
            branch.topNum = MathEx.random(i == 0 ? 2 : 0, 3) | 0;
            branch.sideNum = MathEx.random(i == 0 ? 2 : 0, 9 - i) | 0;
            branch.sideGrp = MathEx.random(1, 4) | 0;
            branch.sizeRand = MathEx.random(0, 0.5);
            branch.radiusBegin = MathEx.random(0.8, 1.2);
            branch.radiusEnd = MathEx.random(0.3, 0.5);
            branch.angleSide = MathEx.random(10, 50);
            branch.angleTop = MathEx.random(0, 40);
            branch.lenBegin = MathEx.random(0.8, 1.2);
            branch.lenEnd = MathEx.random(0.8, 1.2);
            branch.lenTop = MathEx.random(0.8, 1.2);
            branch.posBegin = MathEx.random(0.2, 0.8);
            branch.posEnd = MathEx.random(0.4, 1);
            cx = cz = 0; cr = 1;
            for (let j = 1; j < cn[i] - 1; j++) {
                cx += MathEx.random(-0.02, 0.02);
                cz += MathEx.random(-0.02, 0.02);
                cr += MathEx.random(-0.05, 0.05);
                branch.curve[j].x = cx;
                branch.curve[j].z = cz;
                branch.curve[j].r = cr;
            }
        }

        this.branchRadiusFit();
    }

    /**
     * 参数进化
     * @param percent 程度
     */
    evolveParam(percent: number) {
        const min = 1 - percent;
        const max = 1 + percent;
        const param = this.param;

        //树干
        const trunk = param.trunk;
        trunk.length *= MathEx.random(min, max);
        trunk.radius *= MathEx.random(min, max);
        trunk.radiusBegin *= MathEx.random(min, max);
        trunk.radiusEnd *= MathEx.random(min, max);
        trunk.envelope.x *= MathEx.random(min, max);
        trunk.envelope.y *= MathEx.random(min, max);
        trunk.envelope.z *= MathEx.random(min, max);
        for (let i = 0; i < 10; i++) {
            trunk.curve[i].x *= MathEx.random(min, max);
            trunk.curve[i].z *= MathEx.random(min, max);
            trunk.curve[i].r *= MathEx.random(min, max);
        }

        //树枝
        for (let i = 0; i < 4; i++) {
            const cn = [8, 6, 4, 4];
            const branch = param.branch[i];
            if (branch.topNum + branch.sideNum > 0) {
                branch.length *= MathEx.random(min, max);
                branch.radius *= MathEx.random(min, max);
                branch.sizeRand *= MathEx.random(min, max);
                branch.radiusBegin *= MathEx.random(min, max);
                branch.radiusEnd *= MathEx.random(min, max);
                branch.lenBegin *= MathEx.random(min, max);
                branch.lenEnd *= MathEx.random(min, max);
                if (i < 2) {
                    branch.envelope.x *= MathEx.random(min, max);
                    branch.envelope.y *= MathEx.random(min, max);
                    branch.envelope.z *= MathEx.random(min, max);
                }
                for (let j = 1; j < cn[i] - 1; j++) {
                    branch.curve[j].x *= MathEx.random(min, max);
                    branch.curve[j].z *= MathEx.random(min, max);
                    branch.curve[j].r *= MathEx.random(min, max);
                }
            }
            if (branch.topNum > 0) {
                branch.angleTop *= MathEx.random(min, max);
                branch.lenTop *= MathEx.random(min, max);
            }
            if (branch.sideNum > 0) {
                branch.angleSide *= MathEx.random(min, max);
                branch.posBegin *= MathEx.random(min, max);
                branch.posEnd *= MathEx.random(min, max);
            }
        }

        //蕨叶
        const frond = param.frond;
        if (frond.topNum + frond.sideNum > 0) {
            frond.length *= MathEx.random(min, max);
            frond.width *= MathEx.random(min, max);
            frond.sizeRand *= MathEx.random(min, max);
            frond.stemRadius *= MathEx.random(min, max);
            frond.angleSide *= MathEx.random(min, max);
            frond.angleTop *= MathEx.random(min, max);
            frond.posBegin *= MathEx.random(min, max);
            frond.posEnd *= MathEx.random(min, max);
            for (let i = 0; i < 6; i++) {
                frond.curve[i].x *= MathEx.random(min, max);
                frond.curve[i].z *= MathEx.random(min, max);
                frond.curve[i].r *= MathEx.random(min, max);
            }
        }

        //鳞叶
        const squama = param.squama;
        if (squama.topNum + squama.sideNum > 0) {
            squama.length *= MathEx.random(min, max);
            squama.width *= MathEx.random(min, max);
            squama.sizeRand *= MathEx.random(min, max);
            squama.angleSide *= MathEx.random(min, max);
            squama.angleTop *= MathEx.random(min, max);
            squama.angleRand *= MathEx.random(min, max);
            squama.angleFace *= MathEx.random(min, max);
            squama.posBegin *= MathEx.random(min, max);
            squama.posEnd *= MathEx.random(min, max);
            for (let i = 0; i < 4; i++) {
                squama.curve[i].x *= MathEx.random(min, max);
                squama.curve[i].z *= MathEx.random(min, max);
                squama.curve[i].r *= MathEx.random(min, max);
            }
        }

        //树叶
        const leaf = param.leaf;
        if (leaf.topNum + leaf.sideNum > 0) {
            leaf.length *= MathEx.random(min, max);
            leaf.width *= MathEx.random(min, max);
            leaf.uvScale *= MathEx.random(min, max);
            leaf.sizeRand *= MathEx.random(min, max);
            leaf.posRand *= MathEx.random(min, max);
            leaf.angleRand *= MathEx.random(min, max);
            for (let i = 0; i < 4; i++) {
                leaf.curve[i].x *= MathEx.random(min, max);
                leaf.curve[i].z *= MathEx.random(min, max);
                leaf.curve[i].r *= MathEx.random(min, max);
            }
        }

        this.branchRadiusFit();
    }

    /**
     * 同类型下一棵树（保持同类型，只更改随机数种子和长度）
     * @param percent
     */
    nextParam(percent: number) {
        const min = 1 - percent;
        const max = 1 + percent;
        const param = this.param;

        //树干
        const trunk = param.trunk;
        trunk.length *= MathEx.random(min, max);
        for (let i = 1; i < 9; i++) {
            trunk.curve[i].x *= MathEx.random(min, max);
            trunk.curve[i].z *= MathEx.random(min, max);
            trunk.curve[i].r *= MathEx.random(min, max);
        }

        //树枝
        for (let i = 0; i < 4; i++) {
            this.param.branch[i].seed = MathEx.random(0, 100) | 0;
            this.param.branch[i].length *= MathEx.random(min, max);
        }

        //其他
        this.param.frond.seed = MathEx.random(0, 100) | 0;
        this.param.squama.seed = MathEx.random(0, 100) | 0;
    }

    /**
     * 根据控制参数随机生成植物参数
     * @param trgp 
     */
    genParam(trgp: TreeRandomGenParam) {
        const param = this.param;
        const sr = trgp.rand * 0.5;
        const min1 = 1 - sr;
        const max1 = 1 + sr;
        const min2 = 1 - sr * 0.5;
        const max2 = 1 + sr * 0.5;
        const radiusRate = MathEx.random(min1, max1);

        //全局
        param.height = MathEx.random(trgp.height * min1, trgp.height * max1);
        param.wide = MathEx.random(trgp.wide * min1, trgp.wide * max1);
        param.luminance = MathEx.random(trgp.luminance * min2, trgp.luminance * max2);
        param.saturation = MathEx.random(trgp.saturation * min2, trgp.saturation * max2);

        //树干
        {
            const trunk = param.trunk;
            const temp = trgp.template.trunk;
            trunk.length = temp.length * MathEx.random(min2, max2);
            trunk.radiusBegin = temp.radiusBegin * MathEx.random(min2, max2);
            trunk.radiusEnd = temp.radiusEnd * MathEx.random(min2, max2);
            trunk.stacks = MathEx.clamp(trgp.curve * 50, 3, 20) | 0;
            for (let i = 1; i < 9; i++) {
                if (i < 8 || trgp.curve == 0) {
                    const cr = Math.pow(i, 0.7);
                    trunk.curve[i].x = MathEx.random(-trgp.curve * cr * 0.1, trgp.curve * cr * 0.1) + temp.curve[i].x * trgp.curve;;
                    trunk.curve[i].z = MathEx.random(-trgp.curve * cr * 0.1, trgp.curve * cr * 0.1) + temp.curve[i].z * trgp.curve;;
                    trunk.curve[i].r = temp.curve[i].r * MathEx.random(min2, max2);
                }
            }
        }

        //树枝
        for (let i = 0; i < 4; i++) {
            const cn = [8, 6, 4, 4];
            const branch = this.param.branch[i];
            const temp = trgp.template.branch[i];
            if (temp.topNum + temp.sideNum > 0) {
                branch.seed = MathEx.random(0, 100) | 0;
                branch.length = temp.length * MathEx.random(min2, max2);
                branch.radius = temp.radius * radiusRate;
                branch.radiusBegin = temp.radiusBegin * MathEx.random(min2, max2);
                branch.radiusEnd = temp.radiusEnd * MathEx.random(min2, max2);
                branch.posBegin = temp.posBegin * MathEx.random(min1, max1);
                branch.posEnd = temp.posEnd * MathEx.random(min1, max1);
                branch.angleTop = temp.angleTop * MathEx.random(min1, max1);
                branch.angleSide = temp.angleSide * MathEx.random(min1, max1);
                if (i < 2) {
                    branch.topNum = temp.topNum * trgp.branchRich | 0;
                    branch.sideNum = temp.sideNum * trgp.branchRich | 0;
                }
                for (let j = 1; j < cn[i]; j++) {
                    if (j < cn[i] - 1 || trgp.curve == 0) {
                        const cr = Math.pow(j, 0.3);
                        branch.curve[j].x = MathEx.random(-trgp.curve * cr * 0.2, trgp.curve * cr * 0.2) + temp.curve[j].x * trgp.curve;
                        branch.curve[j].z = MathEx.random(-trgp.curve * cr * 0.2, trgp.curve * cr * 0.2) + temp.curve[j].z * trgp.curve;
                        branch.curve[j].r = temp.curve[j].r * MathEx.random(min2, max2);
                    }
                }
            }
        }

        //树叶
        {
            const leaf = this.param.leaf;
            const temp = trgp.template.leaf;
            if (temp.topNum + temp.sideNum > 0) {
                leaf.topNum = temp.topNum * trgp.leafRich | 0;
                leaf.sideNum = temp.sideNum * trgp.leafRich | 0;
            }
        }

        //蕨叶
        {
            const frond = this.param.frond;
            const temp = trgp.template.frond;
            if (temp.topNum + temp.sideNum > 0) {
                frond.seed = MathEx.random(0, 100) | 0;
                frond.angleTop = temp.angleTop * MathEx.random(min1, max1);
                frond.angleSide = temp.angleSide * MathEx.random(min1, max1);
                frond.angleFace = temp.angleFace * MathEx.random(min1, max1);
                frond.width = temp.width * MathEx.random(min1, max1);
                frond.length = temp.length * MathEx.random(min1, max1);
                frond.topNum = temp.topNum * trgp.leafRich | 0;
                frond.sideNum = temp.sideNum * trgp.leafRich | 0;
            }
        }

        //鳞叶
        {
            const squama = this.param.squama;
            const temp = trgp.template.squama;
            if (temp.topNum + temp.sideNum > 0) {
                squama.seed = MathEx.random(0, 100) | 0;
                squama.angleTop = temp.angleTop * MathEx.random(min1, max1);
                squama.angleSide = temp.angleSide * MathEx.random(min1, max1);
                squama.angleFace = temp.angleFace * MathEx.random(min1, max1);
                squama.width = temp.width * MathEx.random(min1, max1);
                squama.length = temp.length * MathEx.random(min1, max1);
                squama.topNum = temp.topNum * trgp.leafRich | 0;
                squama.sideNum = temp.sideNum * trgp.leafRich | 0;
            }
        }

        //花朵
        {
            const flower = this.param.flower;
            const temp = trgp.template.flower;
            if (temp.topNum + temp.sideNum > 0) {
                flower.topNum = temp.topNum * trgp.leafRich | 0;
                flower.sideNum = temp.sideNum * trgp.leafRich | 0;
            }
        }

        this.branchRadiusFit();
    }

    /**
     * 获取弯曲系数
     */
    getCurveRate() {
        let curve = this.param.trunk.curve;
        if (!this.isHaveTrunk()) {
            curve = this.param.branch[0].curve;
            if (this.param.branch[0].length == 0)
                curve = this.param.branch[1].curve;
        }
        let sum = 0;
        for (let i = 0; i < curve.length; i++) {
            sum += Math.abs(curve[i].x);
            sum += Math.abs(curve[i].z);
        }
        return sum * 0.5;
    }

    /**
     * 是否有主干
     * @returns 
     */
    isHaveTrunk() {
        return !(this.param.trunk.bush || this.param.trunk.apot || this.param.trunk.hide);
    }

    /**
     * 树枝半径缝合（尽量减少破绽）
     */
    branchRadiusFit() {
        if (this.param.trunk.curve && this.param.branch[0].topNum > 0)
            this.param.trunk.curve[this.param.trunk.curve.length - 1].r = 1;
        if (this.param.branch[0] && this.param.branch[0].curve) {
            if (this.isHaveTrunk()) {
                this.param.branch[0].sizeRand = 0;
                if (this.param.branch[0].topNum > 0)
                    this.param.branch[0].curve[0].r = 1;
                if (this.param.branch[1].topNum > 0)
                    this.param.branch[0].curve[this.param.branch[0].curve.length - 1].r = 1;
            }
        }
        if (this.param.branch[1] && this.param.branch[1].curve) {
            this.param.branch[1].sizeRand = 0;
            if (this.param.branch[1].topNum > 0)
                this.param.branch[1].curve[0].r = 1;
            if (this.param.branch[2].topNum > 0)
                this.param.branch[1].curve[this.param.branch[1].curve.length - 1].r = 1;
        }
        if (this.param.branch[2] && this.param.branch[2].curve) {
            this.param.branch[2].sizeRand = 0;
            if (this.param.branch[2].topNum > 0)
                this.param.branch[2].curve[0].r = 1;
            if (this.param.branch[3].topNum > 0)
                this.param.branch[2].curve[this.param.branch[2].curve.length - 1].r = 1;
        }
        if (this.param.branch[3] && this.param.branch[3].curve) {
            this.param.branch[3].sizeRand = 0;
            if (this.param.branch[3].topNum > 0)
                this.param.branch[3].curve[0].r = 1;
        }
        const trunkEnd = this.param.trunk.radius * this.param.trunk.radiusEnd;
        console.log("trunkEnd = ", trunkEnd);
        if (this.param.branch[0]) {
            if (this.isHaveTrunk() && this.param.branch[0].topNum > 0)
                this.param.branch[0].radiusBegin = trunkEnd / this.param.branch[0].radius;
            const branch0End = this.param.branch[0].radius * this.param.branch[0].radiusEnd;
            if (this.param.branch[1]) {
                if (this.param.branch[1].topNum == 0)
                    this.param.branch[0].radiusEnd = 0.1;
                else this.param.branch[1].radiusBegin = branch0End / this.param.branch[1].radius;
                const branch1End = this.param.branch[1].radius * this.param.branch[1].radiusEnd;
                if (this.param.branch[2]) {
                    if (this.param.branch[2].topNum == 0)
                        this.param.branch[1].radiusEnd = 0.1;
                    else this.param.branch[2].radiusBegin = branch1End / this.param.branch[2].radius;
                    const branch2End = this.param.branch[2].radius * this.param.branch[2].radiusEnd;
                    if (this.param.branch[3]) {
                        if (this.param.branch[3].topNum == 0)
                            this.param.branch[2].radiusEnd = 0.1;
                        else this.param.branch[3].radiusBegin = branch2End / this.param.branch[3].radius;
                        this.param.branch[3].radiusEnd = 0;
                    } else this.param.branch[2].radiusEnd = 0.1;
                } else this.param.branch[1].radiusEnd = 0.1;
            } else this.param.branch[0].radiusEnd = 0.1;
        }
    }

    /**
     * 调整高矮
     * @param rate 
     */
    adjHeight(rate: number) {
        this.param.height = MathEx.clamp(this.param.height * rate, 0, 50);
    }

    /**
     * 调整粗细
     * @param rate 
     */
    adjWide(rate: number) {
        this.param.wide = MathEx.clamp(this.param.wide * rate, 0, 10);
    }

    /**
     * 调整弯曲
     * @param rate 
     */
    adjCurve(rate: number) {
        for (let i = 1; i < 10; i++) {
            this.param.trunk.curve[i].x = MathEx.clamp(this.param.trunk.curve[i].x * rate, -1, 1);
            this.param.trunk.curve[i].z = MathEx.clamp(this.param.trunk.curve[i].z * rate, -1, 1);
        }
    }

    /**
     * 调整树枝
     * @param rate 
     */
    adjBranch(rate: number) {
        if (rate > 0) {
            if (this.param.branch[0].topNum == 1)
                this.param.branch[0].topNum += rate;
            else if (this.param.branch[0].sideNum > 0)
                this.param.branch[0].sideNum += rate;
        } else {
            if (this.param.branch[0].sideNum > 0) {
                this.param.branch[0].sideNum += rate;
                if (this.param.branch[0].sideNum < 1)
                    this.param.branch[0].sideNum = 1;
            }
            else if (this.param.branch[0].topNum > 0) {
                this.param.branch[0].topNum += rate;
                if (this.param.branch[0].topNum < 1)
                    this.param.branch[0].topNum = 1;
            }
        }
    }

    /**
     * 调整树叶
     * @param rate 
     */
    adjLeaf(rate: number) {
        if (rate > 0) {
            if (this.param.leaf.topNum == 1)
                this.param.leaf.topNum += rate;
            else if (this.param.leaf.sideNum > 0)
                this.param.leaf.sideNum += rate;
            if (this.param.frond.topNum == 1)
                this.param.frond.topNum += rate;
            else if (this.param.frond.sideNum > 0)
                this.param.frond.sideNum += rate;
            if (this.param.squama.topNum == 1)
                this.param.squama.topNum += rate;
            else if (this.param.squama.sideNum > 0)
                this.param.squama.sideNum += rate;
        } else {
            if (this.param.leaf.sideNum > 0) {
                this.param.leaf.sideNum += rate;
                if (this.param.leaf.sideNum < 1)
                    this.param.leaf.sideNum = 1;
            }
            else if (this.param.leaf.topNum > 0) {
                this.param.leaf.topNum += rate;
                if (this.param.leaf.topNum < 1)
                    this.param.leaf.topNum = 1;
            }
            if (this.param.frond.sideNum > 0) {
                this.param.frond.sideNum += rate;
                if (this.param.frond.sideNum < 1)
                    this.param.frond.sideNum = 1;
            }
            else if (this.param.frond.topNum > 0) {
                this.param.frond.topNum += rate;
                if (this.param.frond.topNum < 1)
                    this.param.frond.topNum = 1;
            }
            if (this.param.squama.sideNum > 0) {
                this.param.squama.sideNum += rate;
                if (this.param.squama.sideNum < 1)
                    this.param.squama.sideNum = 1;
            }
            else if (this.param.squama.topNum > 0) {
                this.param.squama.topNum += rate;
                if (this.param.squama.topNum < 1)
                    this.param.squama.topNum = 1;
            }
        }
    }

    /**
     * 调整亮度
     * @param rate 
     */
    adjLuminance(rate: number) {
        this.param.luminance = MathEx.clamp(this.param.luminance * rate, 0, 2);
    }

    /**
     * 调整色度
     * @param rate 
     */
    adjSaturation(rate: number) {
        this.param.saturation = MathEx.clamp(this.param.saturation * rate, 0, 2);
    }

    /**
     * 调整随机数种子
     */
    adjSeed() {
        for (let i = 0; i < 4; i++)
            this.param.branch[i].seed = MathEx.random(0, 100) | 0;
        this.param.frond.seed = MathEx.random(0, 100) | 0;
        this.param.squama.seed = MathEx.random(0, 100) | 0;
    }
}