import { BoundBox } from "laya/d3/math/BoundBox";
import { Bounds } from "laya/d3/math/Bounds";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Vector3 } from "laya/maths/Vector3";

/**
 * 数学扩展类
 */
export class MathEx {
    static DEG2RAD: number = Math.PI / 180; //角度转弧度
    static RAD2DEG: number = 180 / Math.PI; //弧度转角度
    private static _tempVec3: Vector3 = new Vector3();
    private static _corners: Vector3[] = [ //包围盒的8个顶点
        new Vector3(), new Vector3(), new Vector3(), new Vector3(),
        new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    private static _bb: BoundBox = new BoundBox(new Vector3(), new Vector3());

    /**
     * 限制值的范围
     * @param value 值
     * @param min 最小值
     * @param max 最大值
     * @returns [min, max]
     */
    static clamp(value: number, min: number, max: number) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    /**
     * 产生指定范围的随机数
     * @param min 最小值
     * @param max 最大值
     * @returns [min, max)
     */
    static random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    /**
     * 通过矩阵转换三个数到一个归一化的三维向量
     * @param x 源坐标x
     * @param y 源坐标y
     * @param z 源坐标z
     * @param transform 变换矩阵
     * @param result 输出三维向量
     */
    static transformCoordinateValue(x: number, y: number, z: number, transform: Matrix4x4, result: Vector3) {
        const e = transform.elements;
        const w = x * e[3] + y * e[7] + z * e[11] + e[15];
        result.x = (x * e[0] + y * e[4] + z * e[8] + e[12]) / w;
        result.y = (x * e[1] + y * e[5] + z * e[9] + e[13]) / w;
        result.z = (x * e[2] + y * e[6] + z * e[10] + e[14]) / w;
    }

    /**
     * 通过矩阵转换原始包围盒
     * @param bbOrg 原始包围盒
     * @param transform 矩阵
     * @param bbOut 输出包围盒
     */
    static transformBoundBox(bbOrg: BoundBox, transform: Matrix4x4, bbOut: BoundBox) {
        bbOrg.getCorners(this._corners);
        for (let i = 0; i < 8; i++)
            Vector3.transformCoordinate(this._corners[i], transform, this._corners[i]);
        BoundBox.createfromPoints(this._corners, bbOut);
    }

    /**
     * 通过矩阵转换原始包围盒
     * @param bbOrg 原始包围盒
     * @param transform 矩阵
     * @param bbOut 输出包围盒
     */
    static transformBounds(bbOrg: Bounds, transform: Matrix4x4, bbOut: Bounds) {
        const bb = new BoundBox(new Vector3(), new Vector3());
        bbOrg.getBoundBox(bb);
        bb.getCorners(this._corners);
        for (let i = 0; i < 8; i++)
            Vector3.transformCoordinate(this._corners[i], transform, this._corners[i]);
        BoundBox.createfromPoints(this._corners, this._bb);
        bbOut.setMin(this._bb.min);
        bbOut.setMax(this._bb.max);
    }

    /**
     * 将RGB颜色转成HSL颜色
     * @param rgb 
     * @param hsl 
     */
    static RGB2HSL(rgb: Vector3, hsl: Vector3) {
        const r = rgb.x;
        const g = rgb.y;
        const b = rgb.z;

        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const a = maxVal + minVal;
        const d = maxVal - minVal;
        const ss = 0.166667;

        //Luminance
        hsl.z = a * 0.5;

        //Hue
        if (maxVal == minVal)
            hsl.x = 0;
        else if (maxVal == r && g >= b)
            hsl.x = ss * (g - b) / d;
        else if (maxVal == r && g < b)
            hsl.x = ss * (g - b) / d + 1;
        else if (maxVal == g)
            hsl.x = ss * (b - r) / d + ss * 2;
        else hsl.x = ss * (r - g) / d + ss * 4;

        //Saturation
        if (hsl.z == 0 || maxVal == minVal)
            hsl.y = 0;
        else if (hsl.z > 0 && hsl.z <= 0.5)
            hsl.y = d / a;
        else hsl.y = d / (2 - a);
    }

    /**
     * 将HSL颜色转成RGB颜色
     * @param rgb 
     * @param hsl 
     */
    static HSL2RGB(hsl: Vector3, rgb: Vector3) {
        const ss = 0.333333;

        if (hsl.y == 0) {
            rgb.x = hsl.z;
            rgb.y = hsl.z;
            rgb.z = hsl.z;
        }
        else {
            let q = 0;
            if (hsl.z < 0.5)
                q = hsl.z * (1 + hsl.y);
            else q = hsl.z + hsl.y - hsl.z * hsl.y;

            const p = hsl.z * 2 - q;
            const t = [];
            t[0] = hsl.x + ss;
            t[1] = hsl.x;
            t[2] = hsl.x - ss;

            for (let i = 0; i < 3; i++) {
                if (t[i] < 0) t[i] += 1;
                if (t[i] > 1) t[i] -= 1;

                if ((t[i] * 6) < 1)
                    t[i] = p + ((q - p) * 6 * t[i]);
                else if ((t[i] * 2) < 1)
                    t[i] = q;
                else if ((t[i] * 3) < 2)
                    t[i] = p + (q - p) * (ss * 2 - t[i]) * 6;
                else t[i] = p;
            }
            rgb.x = t[0];
            rgb.y = t[1];
            rgb.z = t[2];
        }
    }

    // 计算某个点到所有聚类中心的距离，并返回最近的聚类中心的下标
    private static _findNearestClusterIndex(point: Vector3, clusterCenters: Vector3[]) {
        let minDist = Number.MAX_VALUE;
        let nearestClusterIndex = -1;
        for (let i = 0, len = clusterCenters.length; i < len; i++) {
            const dist = Vector3.distance(point, clusterCenters[i]);
            if (dist < minDist) {
                minDist = dist;
                nearestClusterIndex = i;
            }
        }
        return nearestClusterIndex;
    }

    // 计算某个聚类中心的平均值，即所有属于该聚类的点的平均值
    private static _calculateClusterMean(points: Vector3[]) {
        const sum = this._tempVec3;
        const len = points.length;
        sum.x = sum.y = sum.z = 0;
        for (let i = 0; i < len; i++) {
            sum.x += points[i].x / len;
            sum.y += points[i].y / len;
            sum.z += points[i].z / len;
        }
        return sum;
    }

    // 对数据进行聚类，并返回聚类结果和聚类中心
    private static _kMeansClustering(data: Vector3[], keys: Vector3[], maxIterations: number = 10) {
        const n = data.length;
        const k = keys.length;
        const clusterCenters = keys;
        const clusterAssignments = Array(n).fill(-1);
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            for (let i = 0; i < n; i++) // 分配每个数据点到最近的聚类中心
                clusterAssignments[i] = this._findNearestClusterIndex(data[i], clusterCenters);

            for (let i = 0; i < k; i++) { // 更新每个聚类的中心
                const assignedPoints = [];
                for (let j = 0; j < n; j++)
                    if (clusterAssignments[j] == i)
                        assignedPoints.push(data[j]);
                if (assignedPoints.length > 0) {
                    const c = this._calculateClusterMean(assignedPoints);
                    clusterCenters[i].x = c.x;
                    clusterCenters[i].y = c.y;
                    clusterCenters[i].z = c.z;
                }
            }
        }
        data.length = 0;
        return clusterCenters;
    }

    /**
     * 获取n个在指定立方空间分布均匀的点
     * @param n 
     * @param xmin 
     * @param xmax 
     * @param ymin 
     * @param ymax 
     * @param zmin 
     * @param zmax 
     */
    static kMeansSquare(n: number, xmin: number, xmax: number, ymin: number, ymax: number, zmin: number, zmax: number, iteration: number = 20) {
        const kn = 20;
        const num = n * kn;
        const data = [];
        const keys = [];
        for (let i = 0; i < num; i++)
            data[i] = new Vector3(MathEx.random(xmin, xmax), MathEx.random(ymin, ymax), MathEx.random(zmin, zmax));
        for (let i = 0; i < n; i++)
            keys[i] = new Vector3(MathEx.random(xmin, xmax), MathEx.random(ymin, ymax), MathEx.random(zmin, zmax));
        return this._kMeansClustering(data, keys, iteration);
    }

    /**
     * 获取n个在指定球体空间内分布均匀的点
     * @param n 
     * @param x 
     * @param x 
     * @param y 
     * @param r 
     */
    static kMeansSphere(n: number, x: number, y: number, z: number, r: number, iteration: number = 20) {
        const kn = 20;
        const num = n * kn;
        const data = [];
        const keys = [];
        const sr = r * r;
        const xmin = x - r, xmax = x + r;
        const ymin = y - r, ymax = y + r;
        const zmin = z - r, zmax = z + r;
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(MathEx.random(xmin, xmax), MathEx.random(ymin, ymax), MathEx.random(zmin, zmax));
            if ((v.x - x) * (v.x - x) + (v.y - y) * (v.y - y) + (v.z - z) * (v.z - z) <= sr)
                data.push(v);
            if (data.length >= num) break;
        }
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(MathEx.random(xmin, xmax), MathEx.random(ymin, ymax), MathEx.random(zmin, zmax));
            if ((v.x - x) * (v.x - x) + (v.y - y) * (v.y - y) + (v.z - z) * (v.z - z) <= sr)
                keys.push(v);
            if (keys.length >= n) break;
        }
        return this._kMeansClustering(data, keys, iteration);
    }

    /**
     * 获取n个在指定圆空间内分布均匀的点
     * @param n 
     * @param x 
     * @param x 
     * @param y 
     * @param r 
     */
    static kMeansCircleX(n: number, x: number, y: number, z: number, r: number, iteration: number = 20) {
        const kn = 20;
        const num = n * kn;
        const data = [];
        const keys = [];
        const sr = r * r;
        const ymin = y - r, ymax = y + r;
        const zmin = z - r, zmax = z + r;
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(x, MathEx.random(ymin, ymax), MathEx.random(zmin, zmax));
            if ((v.y - y) * (v.y - y) + (v.z - z) * (v.z - z) <= sr)
                data.push(v);
            if (data.length >= num) break;
        }
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(x, MathEx.random(ymin, ymax), MathEx.random(zmin, zmax));
            if ((v.y - y) * (v.y - y) + (v.z - z) * (v.z - z) <= sr)
                keys.push(v);
            if (keys.length >= n) break;
        }
        return this._kMeansClustering(data, keys, iteration);
    }

    /**
     * 获取n个在指定圆空间内分布均匀的点
     * @param n 
     * @param x 
     * @param x 
     * @param y 
     * @param r 
     */
    static kMeansCircleY(n: number, x: number, y: number, z: number, r: number, iteration: number = 20) {
        const kn = 20;
        const num = n * kn;
        const data = [];
        const keys = [];
        const sr = r * r;
        const xmin = x - r, xmax = x + r;
        const zmin = z - r, zmax = z + r;
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(MathEx.random(xmin, xmax), y, MathEx.random(zmin, zmax));
            if ((v.x - x) * (v.x - x) + (v.z - z) * (v.z - z) <= sr)
                data.push(v);
            if (data.length >= num) break;
        }
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(MathEx.random(xmin, xmax), y, MathEx.random(zmin, zmax));
            if ((v.x - x) * (v.x - x) + (v.z - z) * (v.z - z) <= sr)
                keys.push(v);
            if (keys.length >= n) break;
        }
        return this._kMeansClustering(data, keys, iteration);
    }

    /**
     * 获取n个在指定圆空间内分布均匀的点
     * @param n 
     * @param x 
     * @param x 
     * @param y 
     * @param r 
     */
    static kMeansCircleZ(n: number, x: number, y: number, z: number, r: number, iteration: number = 20) {
        const kn = 20;
        const num = n * kn;
        const data = [];
        const keys = [];
        const sr = r * r;
        const xmin = x - r, xmax = x + r;
        const ymin = y - r, ymax = y + r;
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(MathEx.random(xmin, xmax), MathEx.random(ymin, ymax), z);
            if ((v.x - x) * (v.x - x) + (v.y - y) * (v.y - y) <= sr)
                data.push(v);
            if (data.length >= num) break;
        }
        for (let i = 0; i < 1000000; i++) {
            const v = new Vector3(MathEx.random(xmin, xmax), MathEx.random(ymin, ymax), z);
            if ((v.x - x) * (v.x - x) + (v.y - y) * (v.y - y) <= sr)
                keys.push(v);
            if (keys.length >= n) break;
        }
        return this._kMeansClustering(data, keys, iteration);
    }

    /**
     * 一维贝塞尔曲线函数
     * @param t 
     * @param p0 
     * @param p1 
     * @param p2 
     * @param p3 
     * @returns 
     */
    static bezierCurve(t: number, p0: number, p1: number, p2: number, p3: number) {
        const c0 = (1 - t) ** 3 * p0;
        const c1 = 3 * (1 - t) ** 2 * t * p1;
        const c2 = 3 * (1 - t) * t ** 2 * p2;
        const c3 = t ** 3 * p3;
        return c0 + c1 + c2 + c3;
    }

    /**
     * 计算季节色相值（折线连接）
     * @param season 
     * @param spring 
     * @param summer 
     * @param autumn 
     * @param winter 
     */
    static seasonCurve(season: number, spring: number, summer: number, autumn: number, winter: number) {
        if (season >= 0 && season < 1)
            return spring * (1 - season) + summer * season;
        if (season >= 1 && season < 2)
            return summer * (2 - season) + autumn * (season - 1);
        if (season >= 2 && season <= 3)
            return autumn * (3 - season) + winter * (season - 2);
        return 0;
    }

    /**
     * 求镜像点
     * @param n 
     * @param d 
     * @param p 
     * @param out 
     * @returns 
     */
    static getMirrorPoint(n: Vector3, d: number, p: Vector3, out?: Vector3) {
        if (out == undefined)
            out = new Vector3();
        const dist = Vector3.dot(p, n) - d;
        Vector3.scale(n, dist * 2.0, out);
        Vector3.subtract(p, out, out);
        return out;
    }

    /**
     * 计算反射矩阵
     * @param n 
     * @param d 
     * @param out 
     */
    static calcReflectionMatrix(n: Vector3, d: number, out?: Matrix4x4) {
        if (out == undefined)
            out = new Matrix4x4();
        const e = out.elements;
        e[0] = 1 - 2 * n.x * n.x;
        e[1] = -2 * n.x * n.y;
        e[2] = -2 * n.x * n.z;
        e[3] = -2 * n.x * d;

        e[4] = -2 * n.y * n.x;
        e[5] = 1 - 2 * n.y * n.y;
        e[6] = -2 * n.y * n.z;
        e[7] = -2 * n.y * d;

        e[8] = -2 * n.z * n.x;
        e[9] = -2 * n.z * n.y;
        e[10] = 1 - 2 * n.z * n.z;
        e[11] = -2 * n.z * d;

        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;

        return out;
    }

    /**
     * 计算反射矩阵
     * @param n 
     * @param d 
     * @param out 
     */
    static calcReflectionMatrix2(n: Vector3, d: number, out?: Matrix4x4) {
        if (out == undefined)
            out = new Matrix4x4();
        const e = out.elements;
        e[0] = 1 - 2 * n.x * n.x;
        e[4] = -2 * n.x * n.y;
        e[8] = -2 * n.x * n.z;
        e[12] = -2 * n.x * d;

        e[1] = -2 * n.y * n.x;
        e[5] = 1 - 2 * n.y * n.y;
        e[9] = -2 * n.y * n.z;
        e[13] = -2 * n.y * d;

        e[2] = -2 * n.z * n.x;
        e[6] = -2 * n.z * n.y;
        e[10] = 1 - 2 * n.z * n.z;
        e[14] = -2 * n.z * d;

        e[3] = 0;
        e[7] = 0;
        e[11] = 0;
        e[15] = 1;

        return out;
    }
}