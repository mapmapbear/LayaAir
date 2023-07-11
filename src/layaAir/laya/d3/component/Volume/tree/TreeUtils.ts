import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";
import { VertexDeclaration } from "laya/RenderEngine/VertexDeclaration";
import { TreeConfig } from "./TreeConfig";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { IndexFormat } from "laya/RenderEngine/RenderEnum/IndexFormat";
import { SubMesh } from "laya/d3/resource/models/SubMesh";
import { LayaGL } from "laya/layagl/LayaGL";
import { BufferUsage } from "laya/RenderEngine/RenderEnum/BufferTargetType";
import { BoundBox } from "laya/d3/math/BoundBox";
import { TreeRandom } from "./TreeRandom";
import { MathEx } from "../utils/MathEx";
import { DsArray } from "../utils/DsArray";
import { Transform3D } from "laya/d3/core/Transform3D";
import { Vector2 } from "laya/maths/Vector2";

type LatitudeLongitude = { lat: number; lon: number };

/**
 * 植物工具库
 */
export class TreeUtils {
    static vd: VertexDeclaration;
    static vs: number = 0;
    private static _beginDist: number = 0;
    private static _endDist: number = 0;
    private static _beginGrow: number = 0;
    private static _endGrow: number = 0;
    private static _tempVec3: Vector3 = new Vector3();
    private static _tempQuat: Quaternion = new Quaternion();
    private static _rand: TreeRandom = new TreeRandom();

    static __init__() {
        this.vd = VertexMesh.getVertexDeclaration("POSITION,NORMAL,COLOR,UV,TANGENT,BLENDWEIGHT");
        this.vs = this.vd.vertexStride / 4;
    }

    /**
     * 计算距离细节系数（用于GPU控制LOD）
     * @param level 拓扑层级（0~N）
     */
    private static _calcDistBeginAndEnd(level: number) {
        this._beginDist = 0;
        this._endDist = 0;
        switch (level) {
            case 0:
            case 1:
                this._beginDist = 0;
                this._endDist = 0;
                break;
            case 2:
                this._beginDist = 0;
                this._endDist = 0.5;
                break;
            case 3:
                this._beginDist = 0.5;
                this._endDist = 0.8;
                break;
            case 4:
                this._beginDist = 0.8;
                this._endDist = 1.0;
                break;
        }
    }

    /**
     * 计算树枝生长细节系数（用于GPU控制生长）
     * @param level 拓扑层级（0~N）
     */
    private static _calcTrunkGrowBeginAndEnd(level: number) {
        this._beginGrow = 0;
        this._endGrow = 0;
        switch (level) {
            case 0:
                this._beginGrow = 0;
                this._endGrow = 0.18;
                break;
            case 1:
                this._beginGrow = 0.18;
                this._endGrow = 0.36;
                break;
            case 2:
                this._beginGrow = 0.36;
                this._endGrow = 0.54;
                break;
            case 3:
                this._beginGrow = 0.54;
                this._endGrow = 0.72;
                break;
            case 4:
                this._beginGrow = 0.72;
                this._endGrow = 1.0;
                break;
        }
    }

    /**
     * 计算树叶生长细节系数（用于GPU控制生长）
     * @param level 拓扑层级（0~N）
     */
    private static _calcLeafGrowBeginAndEnd(level: number) {
        this._beginGrow = 0;
        this._endGrow = 0;
        switch (level) {
            case 0:
                this._beginGrow = 0;
                this._endGrow = 0.2;
                break;
            case 1:
                this._beginGrow = 0.2;
                this._endGrow = 0.4;
                break;
            case 2:
                this._beginGrow = 0.4;
                this._endGrow = 0.6;
                break;
            case 3:
                this._beginGrow = 0.6;
                this._endGrow = 0.8;
                break;
            case 4:
                this._beginGrow = 0.8;
                this._endGrow = 0.95;
                break;
        }
    }

    /**
     * 计算花朵生长细节系数（用于GPU控制生长）
     * @param level 拓扑层级（0~N）
     */
    private static _calcFlowerGrowBeginAndEnd(level: number) {
        this._beginGrow = 0;
        this._endGrow = 0;
        switch (level) {
            case 0:
                this._beginGrow = 0;
                this._endGrow = 0.3;
                break;
            case 1:
                this._beginGrow = 0.3;
                this._endGrow = 0.5;
                break;
            case 2:
                this._beginGrow = 0.5;
                this._endGrow = 0.75;
                break;
            case 3:
                this._beginGrow = 0.75;
                this._endGrow = 0.9;
                break;
            case 4:
                this._beginGrow = 0.9;
                this._endGrow = 0.95;
                break;
        }
    }

    /**
     * 计算包围盒
     * @param vertices 
     * @param bbox 
     * @param init 
     */
    private static _calcBoundBox(vertices: Float32Array, bbox: BoundBox, init: boolean = true) {
        const min = bbox.min;
        const max = bbox.max;
        if (init) {
            min.x = min.y = min.z = Number.MAX_VALUE;
            max.x = max.y = max.z = -Number.MAX_VALUE;
        }
        for (let i = 0, len = vertices.length; i < len; i += this.vs) {
            const px = vertices[i];
            const py = vertices[i + 1];
            const pz = vertices[i + 2];
            min.x = Math.min(min.x, px);
            min.y = Math.min(min.y, py);
            min.z = Math.min(min.z, pz);
            max.x = Math.max(max.x, px);
            max.y = Math.max(max.y, py);
            max.z = Math.max(max.z, pz);
        }
    }

    /**
     * 创建树干顶点数据
     * @param cfg 配置数据
     * @param sn 统一序号
     * @param sr 尺寸系数
     * @param ct 茎向位置归一化数（0~1）
     * @param length 树枝长度
     * @param slices 树枝横向分段
     * @param stacks 树枝纵向分段
     * @param level 拓扑层级（0~N）
     * @param type 类型
     * @param bbox 包围盒
     * @returns 
     */
    static createTrunkVI(cfg: TreeConfig, sn: number = 0, sr: number = 1, ct: number, length: number = 1,
        slices: number = 3, stacks = 1, level: number = 0, type: number = 0, bbox?: BoundBox) {
        slices = MathEx.clamp(slices, 3, 60);
        stacks = MathEx.clamp(stacks, 1, 60);
        const param = cfg.param;
        const cone = level == 0 ? 0 : param.branch[level - 1].cone;
        const trunk = level == 0 ? param.trunk : param.branch[level - 1];
        const radiusBegin = param.height * param.wide * trunk.radius * trunk.radiusBegin * sr;
        const radiusEnd = param.height * param.wide * trunk.radius * trunk.radiusEnd * sr;

        let vertexCount = (slices + 1) * (stacks + 1);
        let indexCount = slices * stacks * 6;
        if (trunk.capType != undefined) {
            if (trunk.capType == 1) {
                vertexCount += slices + 1;
                indexCount += (slices - 2) * 3;
            }
        }
        const vertices = new Float32Array(vertexCount * this.vs);
        const indices = new Uint16Array(indexCount);

        let curAngle = 0;
        let curRadius = 0;
        let dist = 0;
        let grow = 0;
        let vc = 0, ic = 0;
        let indexOffset = 0;
        let posX = 0, posY = 0, posZ = 0;

        this._calcDistBeginAndEnd(level);
        this._calcTrunkGrowBeginAndEnd(level);
        const beginDist = this._beginDist;
        const endDist = this._endDist;
        const beginGrow = this._beginGrow;
        const endGrow = this._endGrow;
        const rx = Math.random();
        const uvScale = length * param.uvScale.v / ((radiusBegin + radiusEnd) * 2 + 0.0001);
        //@ts-ignore
        const stem = trunk.stem;

        //四周
        for (let j = 0; j <= stacks; j++) {
            const b2t = j / stacks;
            const curve = cfg.getCurve(trunk.curve, b2t, length);
            posY = b2t * length;
            dist = endDist * b2t + beginDist * (1 - b2t);
            grow = endGrow * b2t + beginGrow * (1 - b2t);
            curRadius = radiusEnd * b2t + radiusBegin * (1 - b2t);
            curRadius *= curve.z;
            for (let i = 0; i <= slices; i++) {
                const a2t = i / slices;
                let cr = curRadius;
                if (trunk.envelope != undefined)
                    cr *= cfg.getEnvelope(trunk.envelope, a2t % 1, b2t);
                curAngle = Math.PI * a2t * 2;
                posX = Math.cos(curAngle) * cr + curve.x;
                posZ = Math.sin(curAngle) * cr + curve.y;
                //pos
                vertices[vc++] = posX;
                vertices[vc++] = posY;
                vertices[vc++] = posZ;
                //normal
                vertices[vc++] = dist; //顶点对应的距离系数
                vertices[vc++] = grow; //顶点对应的生长系数
                vertices[vc++] = b2t; //从底部到顶部（0~1）
                //color
                vertices[vc++] = sn; //统一序号
                vertices[vc++] = type; //顶点类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
                vertices[vc++] = level; //拓扑层级（0~N）
                vertices[vc++] = rx; //随机数（0~1）
                //uv
                if (!stem) {
                    vertices[vc++] = 0.01 + (a2t * param.uvScale.u * 0.23 - 0.0001) % 0.23;
                    vertices[vc++] = (1.0 - b2t) * uvScale;
                } else {
                    vertices[vc++] = 0.26 + (a2t * param.uvScale.u * 0.23 - 0.0001) % 0.23;
                    vertices[vc++] = (1.0 - b2t) * 0.25;
                }
                //tangent
                vertices[vc++] = curve.x; //树枝中心水平位置（用于调节树枝粗细）
                vertices[vc++] = curve.y; //树枝中心水平位置（用于调节树枝粗细）
                vertices[vc++] = 0;
                vertices[vc++] = 0;
                //blend
                vertices[vc++] = ct;
                vertices[vc++] = cone;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
            }
        }
        for (let j = 0; j < stacks; j++) {
            for (let i = 0; i < slices; i++) {
                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + j * (slices + 1);
                indices[ic++] = i + j * (slices + 1) + 1;

                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + j * (slices + 1) + 1;
                indices[ic++] = i + (j + 1) * (slices + 1) + 1;
            }
        }
        indexOffset += (slices + 1) * (stacks + 1);

        //顶盖
        if (trunk.capType != undefined) {
            if (trunk.capType == 1) {
                posY = length;
                curRadius = radiusEnd * cfg.getCurve(trunk.curve, 1, length).z;
                const curve = cfg.getCurve(trunk.curve, 1, length);
                for (let i = 0; i <= slices; i++) {
                    const k = i / slices;
                    curAngle = Math.PI * k * 2;
                    posX = Math.cos(curAngle) * curRadius + curve.x;
                    posZ = Math.sin(curAngle) * curRadius + curve.y;
                    //pos
                    vertices[vc++] = posX;
                    vertices[vc++] = posY;
                    vertices[vc++] = posZ;
                    //normal
                    vertices[vc++] = dist;
                    vertices[vc++] = grow;
                    vertices[vc++] = 1;
                    //color
                    vertices[vc++] = sn;
                    vertices[vc++] = type;
                    vertices[vc++] = level;
                    vertices[vc++] = rx;
                    //uv
                    vertices[vc++] = 0.12 + Math.cos(curAngle) * 0.12;
                    vertices[vc++] = 0.12 + Math.sin(curAngle) * 0.12;
                    //tangent
                    vertices[vc++] = curve.x;
                    vertices[vc++] = curve.y;
                    vertices[vc++] = 0;
                    vertices[vc++] = 0;
                    //blend
                    vertices[vc++] = 1;
                    vertices[vc++] = cone;
                    vertices[vc++] = 0;
                    vertices[vc++] = 0;
                }
                for (let i = 0; i < slices - 2; i++) {
                    indices[ic++] = indexOffset;
                    indices[ic++] = indexOffset + i + 1;
                    indices[ic++] = indexOffset + i + 2;
                }
            }
        }

        if (bbox)
            this._calcBoundBox(vertices, bbox);
        return { vertices, indices };
    }

    /**
     * 创建蕨叶顶点数据
     * @param cfg 配置数据
     * @param sn 统一序号
     * @param sr 尺寸系数
     * @param ct 茎向位置归一化数（0~1）
     * @param level 拓扑层级（0~N）
     * @param swing 摆动系数
     * @param lod lod系数
     * @param bbox 包围盒
     * @returns 
     */
    static createFrondVI(cfg: TreeConfig, sn: number = 0, sr: number = 0, ct: number, level: number = 0, swing: number = 1, lod: number = 1, bbox?: BoundBox) {
        const frond = cfg.param.frond;
        const slices = 2;
        const stacks = Math.max(1, frond.stacks / lod | 0);
        const type = 3; //蕨叶类型为3
        const soft = frond.soft;
        const cone = frond.cone;
        const length = cfg.param.height * frond.length * sr * (1 - ct * cone);
        const width = cfg.param.height * frond.width * sr * (1 - ct * cone * 0.6) * 0.5;
        const light = (1 + ct * cone);
        const haveStem = frond.haveStem; //是否对茎建模
        const radiusBegin = cfg.param.height * frond.width * frond.stemRadius * sr;
        const radiusEnd = 0;

        let dist = 0;
        let grow = 0;
        let curAngle = 0;
        let curRadius = 0;
        let indexOffset = 0;
        let vc = 0, ic = 0;
        let posX = 0, posY = 0, posZ = 0;

        this._calcDistBeginAndEnd(level);
        this._calcTrunkGrowBeginAndEnd(level);
        const beginDist = this._beginDist;
        const endDist = this._endDist;
        const beginGrow = this._beginGrow;
        const endGrow = this._endGrow;
        const rx = Math.random();

        const af = frond.angleFace;
        const v = TreeUtils._tempVec3;
        const q = TreeUtils._tempQuat;
        Quaternion.createFromYawPitchRoll(af * MathEx.DEG2RAD, 0, 0, q);

        let vertexCount = (slices + 1) * (stacks + 1);
        let indexCount = slices * stacks * 6;
        if (haveStem) {
            vertexCount += (stacks + 1) * 5;
            indexCount += stacks * 24;
        }
        const vertices = new Float32Array(vertexCount * this.vs);
        const indices = new Uint16Array(indexCount);

        if (haveStem) {
            for (let j = 0; j <= stacks; j++) {
                const b2t = j / stacks;
                const curve = cfg.getCurve(frond.curve, b2t, length);
                posY = b2t * length * curve.z;
                dist = endDist * b2t + beginDist * (1 - b2t);
                grow = endGrow * b2t + beginGrow * (1 - b2t);
                curRadius = radiusEnd * b2t + radiusBegin * (1 - b2t);
                for (let i = 0; i <= 4; i++) {
                    const a2t = i / 4;
                    let cr = curRadius;
                    curAngle = Math.PI * a2t * 2;
                    posX = Math.cos(curAngle) * cr + curve.x;
                    posZ = Math.sin(curAngle) * cr + curve.y * 2.5;

                    //pos
                    vertices[vc++] = posX;
                    vertices[vc++] = posY;
                    vertices[vc++] = posZ;
                    //normal
                    vertices[vc++] = dist; //顶点对应的距离系数
                    vertices[vc++] = grow; //顶点对应的生长系数
                    vertices[vc++] = b2t; //从底部到顶部（0~1）
                    //color
                    vertices[vc++] = sn; //统一序号
                    vertices[vc++] = type; //顶点类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
                    vertices[vc++] = level; //拓扑层级（0~N）
                    vertices[vc++] = rx; //随机数（0~1）
                    //uv
                    vertices[vc++] = 0.26 + (a2t * cfg.param.uvScale.u * 0.23 - 0.0001) % 0.23;
                    vertices[vc++] = (1.0 - b2t) * 0.25;
                    //tangent
                    vertices[vc++] = curve.x;
                    vertices[vc++] = curve.y;
                    vertices[vc++] = 0;
                    vertices[vc++] = soft;
                    //blend
                    vertices[vc++] = light; //亮度系数
                    vertices[vc++] = 0;
                    vertices[vc++] = 0;
                    vertices[vc++] = 0;
                }
            }
            for (let j = 0; j < stacks; j++) {
                for (let i = 0; i < 4; i++) {
                    indices[ic++] = i + (j + 1) * (4 + 1);
                    indices[ic++] = i + j * (4 + 1) + 1;
                    indices[ic++] = i + j * (4 + 1);

                    indices[ic++] = i + (j + 1) * (4 + 1);
                    indices[ic++] = i + (j + 1) * (4 + 1) + 1;
                    indices[ic++] = i + j * (4 + 1) + 1;
                }
            }
            indexOffset += (stacks + 1) * (4 + 1);
        }

        for (let j = 0; j <= stacks; j++) {
            const b2t = j / stacks;
            const curve = cfg.getCurve(frond.curve, b2t, length);
            posY = b2t * length * curve.z;
            dist = endDist * b2t + beginDist * (1 - b2t);
            grow = endGrow * b2t + beginGrow * (1 - b2t);
            for (let i = 0; i <= slices; i++) {
                const k = i / slices;

                v.x = width * (i + curve.x - 1);
                v.y = 0; v.z = 0;
                Vector3.transformQuat(v, q, v);
                posX = v.x;
                posZ = (i - 1) * v.z + curve.y * 2.5;

                //pos
                vertices[vc++] = posX;
                vertices[vc++] = posY;
                vertices[vc++] = posZ;
                //normal
                vertices[vc++] = dist; //顶点对应的距离系数
                vertices[vc++] = grow; //顶点对应的生长系数
                vertices[vc++] = b2t; //从底部到顶部（0~1）
                //color
                vertices[vc++] = sn; //统一序号
                vertices[vc++] = type; //顶点类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
                vertices[vc++] = level; //拓扑层级（0~N）
                vertices[vc++] = rx; //随机数（0~1）
                //uv
                vertices[vc++] = 0.52 + (k * 0.46 - 0.0001) % 0.46;
                vertices[vc++] = 1 - b2t;
                //tangent
                vertices[vc++] = curve.x; //蕨叶中心水平位置（用于调节蕨叶宽度）
                vertices[vc++] = curve.y; //蕨叶中心水平位置（用于调节蕨叶宽度）
                vertices[vc++] = Math.abs(i - 1) * swing;
                vertices[vc++] = soft;
                //blend
                vertices[vc++] = light; //亮度系数
                vertices[vc++] = 0;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
            }
        }
        for (let j = 0; j < stacks; j++) {
            for (let i = 0; i < slices; i++) {
                indices[ic++] = indexOffset + i + (j + 1) * (slices + 1);
                indices[ic++] = indexOffset + i + j * (slices + 1) + 1;
                indices[ic++] = indexOffset + i + j * (slices + 1);

                indices[ic++] = indexOffset + i + (j + 1) * (slices + 1);
                indices[ic++] = indexOffset + i + (j + 1) * (slices + 1) + 1;
                indices[ic++] = indexOffset + i + j * (slices + 1) + 1;
            }
        }

        if (bbox)
            this._calcBoundBox(vertices, bbox);
        return { vertices, indices };
    }

    /**
     * 创建鳞叶顶点数据
     * @param cfg 配置数据
     * @param sn 统一序号
     * @param sr 尺寸系数
     * @param ct 树枝上的排序归一化数（0~1）
     * @param level 拓扑层级（0~N）
     * @param swing 摆动系数
     * @param lod lod系数
     * @param bbox 包围盒
     * @returns 
     */
    static createSquamaVI(cfg: TreeConfig, sn: number = 0, sr: number = 0, ct: number, level: number = 0, swing: number = 1, lod: number = 1, bbox?: BoundBox) {
        const squama = cfg.param.squama;
        const slices = 2;
        const stacks = Math.max(1, squama.stacks / lod | 0);
        const type = 4; //鳞叶类型为4
        const soft = squama.soft;
        const cone = squama.cone;
        const length = cfg.param.height * squama.length * sr * (1 - ct * cone);
        const width = cfg.param.height * squama.width * sr * (1 - ct * cone * 0.6) * 0.5;
        const vertexCount = (slices + 1) * (stacks + 1);
        const indexCount = slices * stacks * 6;
        const vertices = new Float32Array(vertexCount * this.vs);
        const indices = new Uint16Array(indexCount);

        let dist = 0;
        let grow = 0;
        let vc = 0, ic = 0;
        let posX = 0, posY = 0, posZ = 0;

        this._calcDistBeginAndEnd(level);
        this._calcTrunkGrowBeginAndEnd(level);
        const beginDist = this._beginDist;
        const endDist = this._endDist;
        const beginGrow = this._beginGrow;
        const endGrow = this._endGrow;
        const rx = Math.random();

        const af = squama.angleFace;
        const v = TreeUtils._tempVec3;
        const q = TreeUtils._tempQuat;
        Quaternion.createFromYawPitchRoll(af * MathEx.DEG2RAD, 0, 0, q);

        for (let j = 0; j <= stacks; j++) {
            const b2t = j / stacks;
            const curve = cfg.getCurve(squama.curve, b2t, length);
            posY = b2t * length;
            dist = endDist * b2t + beginDist * (1 - b2t);
            grow = endGrow * b2t + beginGrow * (1 - b2t);
            for (let i = 0; i <= slices; i++) {
                const k = i / slices;

                v.x = width * (i + curve.x - 1);
                v.y = 0; v.z = 0;
                Vector3.transformQuat(v, q, v);
                posX = v.x;
                posZ = (i - 1) * v.z + MathEx.clamp(length, 2, 5) * curve.y;

                //pos
                vertices[vc++] = posX;
                vertices[vc++] = posY;
                vertices[vc++] = posZ;
                //normal
                vertices[vc++] = dist; //顶点对应的距离系数
                vertices[vc++] = grow; //顶点对应的生长系数
                vertices[vc++] = b2t; //从底部到顶部（0~1）
                //color
                vertices[vc++] = sn; //统一序号
                vertices[vc++] = type; //顶点类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
                vertices[vc++] = level; //拓扑层级（0~N）
                vertices[vc++] = rx; //随机数（0~1）
                //uv
                vertices[vc++] = 0.26 + (k * 0.23 - 0.0001) % 0.23;
                vertices[vc++] = 0.49 - b2t * 0.23;
                //tangent
                vertices[vc++] = curve.x; //鳞叶中心水平位置（用于调节鳞叶宽度）
                vertices[vc++] = curve.y; //鳞叶中心水平位置（用于调节鳞叶宽度）
                vertices[vc++] = Math.abs(i - 1) * swing;
                vertices[vc++] = soft;
                //blend
                vertices[vc++] = 1;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
            }
        }
        for (let j = 0; j < stacks; j++) {
            for (let i = 0; i < slices; i++) {
                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + j * (slices + 1) + 1;
                indices[ic++] = i + j * (slices + 1);

                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + (j + 1) * (slices + 1) + 1;
                indices[ic++] = i + j * (slices + 1) + 1;
            }
        }

        if (bbox)
            this._calcBoundBox(vertices, bbox);
        return { vertices, indices };
    }

    /**
     * 创建树叶顶点数据
     * @param cfg 配置数据
     * @param sn 统一序号
     * @param sr 尺寸系数
     * @param ct 树枝上的排序归一化数（0~1）
     * @param level 拓扑层级（0~N）
     * @param swing 摆动系数
     * @param bbox 包围盒
     * @returns 
     */
    static createLeafVI(cfg: TreeConfig, sn: number = 0, sr: number = 1, ct: number = 0, level: number = 0, swing: number = 1, bbox?: BoundBox) {
        const leaf = cfg.param.leaf;
        const slices = leaf.slices;
        const stacks = leaf.stacks;
        const cone = leaf.cone;
        const length = cfg.param.height * leaf.length * sr * (1 - ct * cone);
        const width = cfg.param.height * leaf.width * sr * (1 - ct * cone * 0.6);
        const type = 5; //树叶类型为5
        const vertexCount = (slices + 1) * (stacks + 1);
        const indexCount = slices * stacks * 6;
        const vertices = new Float32Array(vertexCount * this.vs);
        const indices = new Uint16Array(indexCount);

        let vc = 0, ic = 0;
        let posX = 0, posZ = 0;
        const rx = Math.random();

        this._calcLeafGrowBeginAndEnd(level);
        const beginGrow = this._beginGrow;
        const endGrow = this._endGrow;
        const grow = endGrow * ct + beginGrow * (1 - ct);
        const dist = 0;

        for (let j = 0; j <= stacks; j++) {
            const b2t = j / stacks;
            const curve = cfg.getCurve(leaf.curve, b2t, length);
            posZ = (b2t + curve.x) * length;
            for (let i = 0; i <= slices; i++) {
                const k = i / slices;
                posX = (k - 0.5) * curve.z * width;
                //pos
                vertices[vc++] = posX;
                vertices[vc++] = curve.y;
                vertices[vc++] = posZ;
                //normal
                vertices[vc++] = dist; //顶点对应的距离系数
                vertices[vc++] = grow; //顶点对应的生长系数
                vertices[vc++] = b2t; //从底部到顶部（0~1）
                //color
                vertices[vc++] = sn; //统一序号
                vertices[vc++] = type; //顶点类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
                vertices[vc++] = level; //拓扑层级（0~N）
                vertices[vc++] = rx; //随机数（0~1）
                //uv
                vertices[vc++] = 0.52 + (k * 0.46 - 0.0001) % 0.46;
                vertices[vc++] = (1 - b2t) * cfg.param.leaf.uvScale;
                //tangent
                vertices[vc++] = 0;
                vertices[vc++] = 0;
                vertices[vc++] = swing;
                vertices[vc++] = 0;
                //blend
                vertices[vc++] = 1;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
            }
        }
        for (let j = 0; j < stacks; j++) {
            for (let i = 0; i < slices; i++) {
                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + j * (slices + 1) + 1;
                indices[ic++] = i + j * (slices + 1);

                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + (j + 1) * (slices + 1) + 1;
                indices[ic++] = i + j * (slices + 1) + 1;
            }
        }

        if (bbox)
            this._calcBoundBox(vertices, bbox);
        return { vertices, indices };
    }

    /**
     * 创建花朵顶点数据
     * @param cfg 配置数据
     * @param sn 统一序号
     * @param sr 尺寸系数
     * @param ct 树枝上的排序归一化数（0~1）
     * @param level 拓扑层级（0~N）
     * @param swing 摆动系数
     * @param bbox 包围盒
     * @returns 
     */
    static createFlowerVI(cfg: TreeConfig, sn: number = 0, sr: number = 1, ct: number = 0, level: number = 0, swing: number = 1, bbox?: BoundBox) {
        const flower = cfg.param.flower;
        const layer = Math.max(1, flower.layer);
        const cone = flower.cone;
        const radius = cfg.param.height * flower.radius * sr * (1 - ct * cone);
        const height = [], width = [];
        this._rand.setSeed(1);
        const af = (flower.angleOpen + this._rand.random(-flower.angleRand, flower.angleRand)) * MathEx.DEG2RAD;
        const as = (Math.PI * 0.5 - af) / layer;
        const type = 6; //花朵类型为6
        const vertices = new Float32Array(this.vs * layer * 5);
        const index = [
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 1,
        ];
        const indices = new Uint16Array(layer * 12);
        for (let i = 0; i < layer; i++) {
            const angle = af + as * i;
            height[i] = Math.sin(angle) * radius;
            width[i] = Math.cos(angle) * radius;
            for (let j = 0; j < 12; j++)
                indices[i * 12 + j] = index[j] + i * 5;
        }

        let vc = 0;
        this._calcFlowerGrowBeginAndEnd(level);
        const beginGrow = this._beginGrow;
        const endGrow = this._endGrow;
        const grow = endGrow * ct + beginGrow * (1 - ct);
        const dist = 0;

        const _writeVertex = (
            px: number, py: number, pz: number,
            nx: number, ny: number, nz: number,
            cr: number, cg: number, cb: number, ca: number,
            tu: number, tv: number,
            tx: number, ty: number, tz: number, tw: number,
            bx: number, by: number, bz: number, bw: number
        ) => {
            //pos
            vertices[vc++] = px;
            vertices[vc++] = py;
            vertices[vc++] = pz;
            //normal
            vertices[vc++] = nx; //顶点对应的距离系数
            vertices[vc++] = ny; //顶点对应的生长系数
            vertices[vc++] = nz; //从底部到顶部（0~1）
            //color
            vertices[vc++] = cr; //统一序号
            vertices[vc++] = cg; //顶点类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
            vertices[vc++] = cb; //拓扑层级（0~N）
            vertices[vc++] = ca; //随机数（0~1）
            //uv
            vertices[vc++] = tu;
            vertices[vc++] = tv;
            //tangent
            vertices[vc++] = tx;
            vertices[vc++] = ty;
            vertices[vc++] = tz;
            vertices[vc++] = tw;
            //blend
            vertices[vc++] = bx;
            vertices[vc++] = by;
            vertices[vc++] = bz;
            vertices[vc++] = bw;
        }

        const tus = 0.375, tvs = 0.875, tw = 0.12;
        for (let i = 0; i < layer; i++) {
            const hw = width[i];
            const hh = height[i];
            const rx = Math.random();
            _writeVertex(0, 0, 0, dist, grow, 0, sn, type, level, rx, tus, tvs, 0, 0, swing, 0, ct, cone, 0, 0);
            _writeVertex(-hw, hh, hw, dist, grow, 1, sn, type, level, rx, tus - tw, tvs + tw, 0, 0, swing, 0, ct, cone, 0, 0);
            _writeVertex(-hw, hh, -hw, dist, grow, 1, sn, type, level, rx, tus - tw, tvs - tw, 0, 0, swing, 0, ct, cone, 0, 0);
            _writeVertex(hw, hh, -hw, dist, grow, 1, sn, type, level, rx, tus + tw, tvs - tw, 0, 0, swing, 0, ct, cone, 0, 0);
            _writeVertex(hw, hh, hw, dist, grow, 1, sn, type, level, rx, tus + tw, tvs + tw, 0, 0, swing, 0, ct, cone, 0, 0);
        }

        if (bbox)
            this._calcBoundBox(vertices, bbox);
        return { vertices, indices };
    }

    /**
     * 创建花瓣顶点数据
     * @param cfg 配置数据
     * @param sn 统一序号
     * @param sr 尺寸系数
     * @param ct 树枝上的排序归一化数（0~1）
     * @param level 拓扑层级（0~N）
     * @param swing 摆动系数
     * @param bbox 包围盒
     * @returns 
     */
    static createPetalVI(cfg: TreeConfig, sn: number = 0, sr: number = 1, ct: number = 0, level: number = 0, swing: number = 1, bbox?: BoundBox) {
        const flower = cfg.param.flower;
        const slices = 2;
        const stacks = flower.stacks;
        const type = 6; //花朵类型为6
        const cone = flower.cone;
        const radius = cfg.param.height * flower.radius * sr * (1 - ct * cone);
        const width = cfg.param.height * flower.width * sr * (1 - ct * cone);
        const vertexCount = (slices + 1) * (stacks + 1);
        const indexCount = slices * stacks * 6;
        const vertices = new Float32Array(vertexCount * this.vs);
        const indices = new Uint16Array(indexCount);

        let dist = 0;
        let grow = 0;
        let vc = 0, ic = 0;
        let posX = 0, posY = 0, posZ = 0;

        this._calcDistBeginAndEnd(level);
        this._calcTrunkGrowBeginAndEnd(level);
        const beginDist = this._beginDist;
        const endDist = this._endDist;
        const beginGrow = this._beginGrow;
        const endGrow = this._endGrow;
        const rx = Math.random();

        const af = flower.angleFace;
        const v = TreeUtils._tempVec3;
        const q = TreeUtils._tempQuat;
        Quaternion.createFromYawPitchRoll(af * MathEx.DEG2RAD, 0, 0, q);

        for (let j = 0; j <= stacks; j++) {
            const b2t = j / stacks;
            const curve = cfg.getCurve(flower.curve, b2t, radius);
            posY = b2t * radius * curve.z;
            dist = endDist * b2t + beginDist * (1 - b2t);
            grow = endGrow * b2t + beginGrow * (1 - b2t);
            for (let i = 0; i <= slices; i++) {
                const k = i / slices;

                v.x = width * (i + curve.x - 1);
                v.y = 0; v.z = 0;
                Vector3.transformQuat(v, q, v);
                posX = v.x;
                posZ = (i - 1) * v.z + MathEx.clamp(radius, 2, 5) * curve.y;

                //pos
                vertices[vc++] = posX;
                vertices[vc++] = posY;
                vertices[vc++] = posZ;
                //normal
                vertices[vc++] = dist; //顶点对应的距离系数
                vertices[vc++] = grow; //顶点对应的生长系数
                vertices[vc++] = b2t; //从底部到顶部（0~1）
                //color
                vertices[vc++] = sn; //统一序号
                vertices[vc++] = type; //顶点类型（0：树根，1：树干，2：树枝，3: 蕨叶，4: 鳞叶，5: 树叶，6: 花朵，7: 果实）
                vertices[vc++] = level; //拓扑层级（0~N）
                vertices[vc++] = rx; //随机数（0~1）
                //uv
                vertices[vc++] = 0.26 + (k * 0.23 - 0.0001) % 0.23;
                vertices[vc++] = 0.99 - b2t * 0.23;
                //tangent
                vertices[vc++] = curve.x; //鳞叶中心水平位置（用于调节鳞叶宽度）
                vertices[vc++] = curve.y; //鳞叶中心水平位置（用于调节鳞叶宽度）
                vertices[vc++] = Math.abs(i - 1) * swing;
                vertices[vc++] = 0;
                //blend
                vertices[vc++] = 1;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
                vertices[vc++] = 0;
            }
        }
        for (let j = 0; j < stacks; j++) {
            for (let i = 0; i < slices; i++) {
                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + j * (slices + 1) + 1;
                indices[ic++] = i + j * (slices + 1);

                indices[ic++] = i + (j + 1) * (slices + 1);
                indices[ic++] = i + (j + 1) * (slices + 1) + 1;
                indices[ic++] = i + j * (slices + 1) + 1;
            }
        }

        if (bbox)
            this._calcBoundBox(vertices, bbox);
        return { vertices, indices };
    }

    /**
     * 建立类似荷花的复杂花朵
     * @param cfg 
     * @param sn 
     * @param sr 
     * @param ct 
     * @param level 
     * @param swing 
     * @param bbox 
     */
    static createLotusVI(cfg: TreeConfig, sn: number = 0, sr: number = 1, ct: number = 0, level: number = 0, swing: number = 1, bbox?: BoundBox) {
        const flower = cfg.param.flower;
        const petal = flower.petal;
        const layer = flower.layer;
        const vertices = [];
        const indices = [];
        const matrixs = [];
        const quat1 = new Quaternion();
        const quat2 = new Quaternion();
        const ao = flower.angleOpen * MathEx.DEG2RAD;
        const bs = (Math.PI * 0.5 - ao) / layer;
        this._rand.setSeed(1);
        for (let i = 0; i < layer; i++) {
            const pn = Math.max(1, petal - i);
            const as = Math.PI * 2 / pn;
            for (let j = 0; j < pn; j++) {
                const vi = this.createPetalVI(cfg, sn, sr, ct, level, swing);
                vertices.push(vi.vertices);
                indices.push(vi.indices);
                const mat = new Matrix4x4();
                Quaternion.createFromYawPitchRoll(0, 0, j * as + this._rand.random(-as * 0.2, as * 0.2), quat1);
                Quaternion.createFromYawPitchRoll(0, bs * i + ao + this._rand.random(-bs * 0.2, bs * 0.2), 0, quat2);
                Quaternion.multiply(quat1, quat2, quat1);
                Matrix4x4.createAffineTransformation(Vector3.ZERO, quat1, Vector3.ONE, mat);
                matrixs.push(mat);
            }
        }
        return this.mergeVI(vertices, indices, matrixs, bbox);
    }

    /**
     * 基于包围盒创建替身网格对象
     * @param bbox 
     */
    static createImposterMesh(bbox: BoundBox) {
        const vd = VertexMesh.getVertexDeclaration("POSITION,NORMAL,UV");
        const vs = vd.vertexStride / 4;
        const vertices = new Float32Array(4 * vs);
        const indices = new Uint16Array
            ([
                0, 1, 2,
                0, 2, 3,
            ]);

        let vc = 0;
        const _writeVertex = (
            px: number, py: number, pz: number,
            tu: number, tv: number,
        ) => {
            //pos
            vertices[vc++] = px;
            vertices[vc++] = py;
            vertices[vc++] = pz;
            //normal
            vertices[vc++] = 0;
            vertices[vc++] = 1;
            vertices[vc++] = 0;
            //uv
            vertices[vc++] = tu;
            vertices[vc++] = tv;
        }

        const min = bbox.min;
        const max = bbox.max;
        _writeVertex(min.x, min.y, (min.z + max.z) * 0.5, 0.05, 0.95);
        _writeVertex(min.x, max.y, (min.z + max.z) * 0.5, 0.05, 0.05);
        _writeVertex(max.x, max.y, (min.z + max.z) * 0.5, 0.95, 0.05);
        _writeVertex(max.x, min.y, (min.z + max.z) * 0.5, 0.95, 0.95);

        return this._createMesh(vd, vertices, indices);
    }

    /**
     * 合并模型数据
     * @param vertices 
     * @param indices 
     * @param matrixs 
     * @param bbox 
     */
    static mergeVI(vertices: Float32Array[], indices: Uint16Array[], matrixs: Matrix4x4[], bbox?: BoundBox) {
        const vs = this.vs;
        const posIn = new Vector3(); //位置坐标输入
        const posOut = new Vector3(); //位置坐标输出
        const vert = new DsArray(256, Float32Array);
        const idex = new DsArray(256, Uint16Array);

        let vc = 0; //顶点计数
        for (let i = 0, len = vertices.length; i < len; i++) {
            const vertice = vertices[i];
            const indice = indices[i];
            const matrix = matrixs[i];

            for (let j = 0, len = indice.length; j < len; j++)
                idex.push(indice[j] + vc);

            for (let j = 0, len = vertice.length; j < len; j += vs) {
                if (matrix) {
                    posIn.x = vertice[j];
                    posIn.y = vertice[j + 1];
                    posIn.z = vertice[j + 2];
                    Vector3.transformCoordinate(posIn, matrix, posOut);
                    vert.push3(posOut.x, posOut.y, posOut.z);
                }
                else vert.push3(vertice[j], vertice[j + 1], vertice[j + 2]);
                vert.push3(vertice[j + 3], vertice[j + 4], vertice[j + 5]);
                vert.push4(vertice[j + 6], vertice[j + 7], vertice[j + 8], vertice[j + 9]);
                vert.push2(vertice[j + 10], vertice[j + 11]);
                vert.push4(vertice[j + 12], vertice[j + 13], vertice[j + 14], vertice[j + 15]);
                vert.push4(vertice[j + 16], vertice[j + 17], vertice[j + 18], vertice[j + 19]);
                vc++;
            }
        }

        const vert1 = vert.slice();
        const idex1 = idex.slice();
        idex.clear();
        vert.clear();

        if (bbox)
            this._calcBoundBox(vert1, bbox);
        return { vertices: vert1, indices: idex1 };
    }

    /**
     * 合并模型数据
     * @param vertices 
     * @param indices 
     * @param matrixs 
     */
    static mergeMesh(vertices: Float32Array[], indices: Uint16Array[], matrixs: Matrix4x4[]) {
        const vs = this.vs;
        const posIn = new Vector3(); //位置坐标输入
        const posOut = new Vector3(); //位置坐标输出
        const vert = new DsArray(256, Float32Array);

        let vc = 0; //顶点计数
        let idex: any;
        let type = 0; //索引类型（1：16bit，2：32bit）
        for (let i = 0, len = vertices.length; i < len; i++)
            vc += vertices[i].length / this.vs;
        if (vc > 65536) {
            type = 2;
            idex = new DsArray(256, Uint32Array);
        }
        else {
            type = 1;
            idex = new DsArray(256, Uint16Array);
        }

        for (let i = 0, len = vertices.length; i < len; i++) {
            const vertice = vertices[i];
            const indice = indices[i];
            const matrix = matrixs[i];

            for (let j = 0, len = indice.length; j < len; j++)
                idex.push(indice[j] + vc);

            for (let j = 0, len = vertice.length; j < len; j += vs) {
                if (matrix) {
                    posIn.x = vertice[j];
                    posIn.y = vertice[j + 1];
                    posIn.z = vertice[j + 2];
                    Vector3.transformCoordinate(posIn, matrix, posOut);
                    vert.push3(posOut.x, posOut.y, posOut.z);
                }
                else vert.push3(vertice[j], vertice[j + 1], vertice[j + 2]);
                vert.push3(vertice[j + 3], vertice[j + 4], vertice[j + 5]);
                vert.push4(vertice[j + 6], vertice[j + 7], vertice[j + 8], vertice[j + 9]);
                vert.push2(vertice[j + 10], vertice[j + 11]);
                vert.push4(vertice[j + 12], vertice[j + 13], vertice[j + 14], vertice[j + 15]);
                vert.push4(vertice[j + 16], vertice[j + 17], vertice[j + 18], vertice[j + 19]);
                vc++;
            }
        }

        let mesh: Mesh;
        const vert1 = vert.slice();
        if (vert1) {
            if (type == 1) {
                const idex1: Uint16Array = idex.slice();
                mesh = this._createMesh(this.vd, vert1, idex1);
            } else {
                const idex1: Uint32Array = idex.slice();
                mesh = this._createMesh(this.vd, vert1, idex1);
            }
        }
        idex.clear();
        vert.clear();
        return mesh;
    }

    /**
     * 合并模型数据
     * @param vertices 
     * @param indices 
     */
    static mergeMeshSimple(vertices: Float32Array[], indices: Uint16Array[]) {
        let vc = 0; //顶点计数
        let idex: any;
        let type = 0; //索引类型（1：16bit，2：32bit）
        for (let i = 0, len = vertices.length; i < len; i++)
            vc += vertices[i].length / this.vs;
        if (vc > 65536) {
            type = 2;
            idex = new DsArray(256, Uint32Array);
        }
        else {
            type = 1;
            idex = new DsArray(256, Uint16Array);
        }
        const vert = new DsArray(256, Float32Array);
        const vs = this.vs;
        vc = 0;

        for (let i = 0, len = vertices.length; i < len; i++) {
            const vertice = vertices[i];
            const indice = indices[i];

            for (let j = 0, len = indice.length; j < len; j++)
                idex.push(indice[j] + vc);

            for (let j = 0, len = vertice.length; j < len; j += vs) {
                vert.push3(vertice[j], vertice[j + 1], vertice[j + 2]);
                vert.push3(vertice[j + 3], vertice[j + 4], vertice[j + 5]);
                vert.push4(vertice[j + 6], vertice[j + 7], vertice[j + 8], vertice[j + 9]);
                vert.push2(vertice[j + 10], vertice[j + 11]);
                vert.push4(vertice[j + 12], vertice[j + 13], vertice[j + 14], vertice[j + 15]);
                vert.push4(vertice[j + 16], vertice[j + 17], vertice[j + 18], vertice[j + 19]);
                vc++;
            }
        }

        let mesh: Mesh;
        const vert1 = vert.slice();
        if (vert1) {
            if (type == 1) {
                const idex1: Uint16Array = idex.slice();
                mesh = this._createMesh(this.vd, vert1, idex1);
            } else {
                const idex1: Uint32Array = idex.slice();
                mesh = this._createMesh(this.vd, vert1, idex1);
            }
        }
        idex.clear();
        vert.clear();
        return mesh;
    }

    /**
     * 通过VI数据创建Mesh对象
     * @param vd 
     * @param vertices 
     * @param indices 
     * @returns 
     */
    private static _createMesh(vd: VertexDeclaration, vertices: Float32Array, indices: Uint16Array | Uint32Array) {
        const mesh = new Mesh();
        if (indices instanceof Uint16Array)
            mesh.indexFormat = IndexFormat.UInt16;
        else mesh.indexFormat = IndexFormat.UInt32;
        const canRead = true;
        const subMesh = new SubMesh(mesh);
        const vertexBuffer = LayaGL.renderOBJCreate.createVertexBuffer3D(vertices.byteLength, BufferUsage.Static, canRead);
        vertexBuffer.vertexDeclaration = vd;
        vertexBuffer.setData(vertices.buffer); //@ts-ignore
        mesh._vertexBuffer = vertexBuffer; //@ts-ignore
        mesh._vertexCount = vertexBuffer._byteLength / vd.vertexStride;
        const indexBuffer = LayaGL.renderOBJCreate.createIndexBuffer3D(mesh.indexFormat, indices.length, BufferUsage.Static, canRead);
        indexBuffer.setData(indices); //@ts-ignore
        mesh._indexBuffer = indexBuffer;

        //@ts-ignore
        mesh._setBuffer(vertexBuffer, indexBuffer); //@ts-ignore
        subMesh._vertexBuffer = vertexBuffer; //@ts-ignore
        subMesh._indexBuffer = indexBuffer; //@ts-ignore
        subMesh._setIndexRange(0, indexBuffer.indexCount, mesh.indexFormat);

        //@ts-ignore
        const subIndexBufferStart = subMesh._subIndexBufferStart; //@ts-ignore
        const subIndexBufferCount = subMesh._subIndexBufferCount; //@ts-ignore
        const boneIndicesList = subMesh._boneIndicesList;
        subIndexBufferStart.length = 1;
        subIndexBufferCount.length = 1;
        boneIndicesList.length = 1;
        subIndexBufferStart[0] = 0;
        subIndexBufferCount[0] = indexBuffer.indexCount;

        const subMeshes = [];
        subMeshes.push(subMesh); //@ts-ignore
        mesh._setSubMeshes(subMeshes);
        //mesh.calculateBounds(); //不用生成包围盒
        const memorySize = vertexBuffer._byteLength + indexBuffer._byteLength;
        mesh._setCPUMemory(memorySize);
        mesh._setGPUMemory(memorySize);
        return mesh;
    }

    /**
     * 位置转经纬度
     * @param x 
     * @param y 
     * @param z 
     * @returns 
     */
    private static _cartesianToSpherical(x: number, y: number, z: number): LatitudeLongitude {
        const r = Math.sqrt(x * x + y * y + z * z);
        const lat = Math.asin(z / r) * MathEx.RAD2DEG;
        const lon = Math.atan2(y, x) * MathEx.RAD2DEG;
        return { lat, lon };
    }

    /**
     * 生成球面上的N个均匀的经纬度坐标（斐波那契网格）
     * @param n 
     * @returns 
     */
    static genUniformCoordsOnSphere(n: number): LatitudeLongitude[] {
        const coords: LatitudeLongitude[] = [];
        const s = Math.sqrt(5) - 1;
        for (let i = 0; i < n; i++) {
            const z = (2 * i - 1) / n - 1;
            const ra = Math.sqrt(Math.max(0, 1 - z * z));
            const phi = i * s * Math.PI;
            const x = Math.cos(phi) * ra;
            const y = Math.sin(phi) * ra;
            const sphericalCoords = this._cartesianToSpherical(x, y, z);
            coords.push(sphericalCoords);
        }
        return coords;
    }

    /**
     * 外部设置世界矩阵对象
     * @param matrix 
     */
    static setWorldMatrixObject(transform: Transform3D, matrix: Matrix4x4) {
        if (matrix) {
            transform.worldMatrix = matrix; //@ts-ignore
            transform._worldMatrix = matrix; //@ts-ignore
            transform._doNotProcessWorldMatrix = true; //@ts-ignore
            transform._setTransformFlag(Transform3D.TRANSFORM_WORLDMATRIX, false);
        }
    }
}