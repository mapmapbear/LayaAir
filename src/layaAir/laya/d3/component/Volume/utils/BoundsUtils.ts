import { Vector3 } from "laya/maths/Vector3";
import { Bounds } from "laya/d3/math/Bounds";
import { BoundBox } from "laya/d3/math/BoundBox";
import { Ray } from "laya/d3/math/Ray";
import { MathUtils3D } from "laya/maths/MathUtils3D";

export class BoundsUtils {
	private static tempVec3 = new Vector3();
	/**
	 * 设置包围盒的最小点
	 * @param x
	 * @param y
	 * @param z
	 */
	static setMinValues(bounds: Bounds, x: number, y: number, z: number): void {
		this.tempVec3.setValue(x, y, z);
		bounds.setMin(this.tempVec3);
	}

	/**
	 * 设置包围盒的最大点
	 * @param x
	 * @param y
	 * @param z
	 */
	static setMaxValues(bounds: Bounds, x: number, y: number, z: number): void {
		this.tempVec3.setValue(x, y, z);
		bounds.setMax(this.tempVec3);
	}

	static clear(boundBox: BoundBox) {
		let min = boundBox.min;
		let max = boundBox.max;
		min.x = Number.POSITIVE_INFINITY;
		min.y = Number.POSITIVE_INFINITY;
		min.z = Number.POSITIVE_INFINITY;
		max.x = Number.NEGATIVE_INFINITY;
		max.y = Number.NEGATIVE_INFINITY;
		max.z = Number.NEGATIVE_INFINITY;
	}

	static empty(boundBox: BoundBox): boolean {
		let min = boundBox.min;
		let max = boundBox.max;
		return min.x == 0 && min.y == 0 && min.z == 0 && max.x == 0 && max.y == 0 && max.z == 0;
	}

	static add(boundBox: BoundBox, off: Vector3): void {
		Vector3.add(boundBox.min, off, boundBox.min);
		Vector3.add(boundBox.max, off, boundBox.max);
	}

	static expand(boundBox: BoundBox, off: number): void {
		boundBox.min.x -= off;
		boundBox.min.y -= off;
		boundBox.min.z -= off;

		boundBox.max.x += off;
		boundBox.max.y += off;
		boundBox.max.z += off;
	}

	static expandByOff(boundBox: BoundBox, offbounds: BoundBox): void {
		var min: Vector3 = offbounds.min;
		var max: Vector3 = offbounds.max;
		var temp: number;
		boundBox.min.x -= min.x;
		boundBox.min.y -= min.y;
		boundBox.min.z -= min.z;
		boundBox.max.x += max.x;
		boundBox.max.y += max.y;
		boundBox.max.z += max.z;

		if (boundBox.min.x > boundBox.max.x) {
			temp = boundBox.min.x;
			boundBox.min.x = boundBox.max.x;
			boundBox.max.x = temp;
		}
		else if (boundBox.min.x == boundBox.max.x) {
			boundBox.max.x += 0.001;
		}

		if (boundBox.min.y > boundBox.max.y) {
			temp = boundBox.min.y;
			boundBox.min.y = boundBox.max.y;
			boundBox.max.y = temp;
		}
		else if (boundBox.min.y == boundBox.max.y) {
			boundBox.max.y += 0.001;
		}

		if (boundBox.min.z > boundBox.max.z) {
			temp = boundBox.min.z;
			boundBox.min.z = boundBox.max.z;
			boundBox.max.z = temp;
		}
		else if (boundBox.min.z == boundBox.max.z) {
			boundBox.max.z += 0.001;
		}
	}

	static expandOffX(boundBox: BoundBox, value: number): void {
		boundBox.min.x -= value;
		boundBox.max.x += value;
	}

	static expandOffY(boundBox: BoundBox, value: number): void {
		boundBox.min.y -= value;
		boundBox.max.y += value;
	}

	static expandOffZ(boundBox: BoundBox, value: number): void {
		boundBox.min.z -= value;
		boundBox.max.z += value;
	}

	static contain(boundBox: BoundBox, pos: Vector3): boolean {
		return pos.x >= boundBox.min.x && pos.x < boundBox.max.x && pos.y >= boundBox.min.y && pos.y < boundBox.max.y && pos.z >= boundBox.min.z && pos.z < boundBox.max.z;
	}

	static containXYZ(boundBox: BoundBox, x: number, y: number, z: number): boolean {
		return x >= boundBox.min.x && x < boundBox.max.x && y >= boundBox.min.y && y < boundBox.max.y && z >= boundBox.min.z && z < boundBox.max.z;
	}

	static getSize(boundBox: BoundBox, value: Vector3): void {
		Vector3.subtract(boundBox.max, boundBox.min, value);
	}

	static limit(boundBox: BoundBox, tempPos: Vector3): void {
		tempPos.x = Math.min(boundBox.max.x, Math.max(boundBox.min.x, tempPos.x));
		tempPos.y = Math.min(boundBox.max.y, Math.max(boundBox.min.y, tempPos.y));
		tempPos.z = Math.min(boundBox.max.z, Math.max(boundBox.min.z, tempPos.z));
	}

	/**
     * 射线和包围盒是否相交
     * @param ray 射线
     * @param box 包围盒
     * @returns 相交距离，如果为-1，不相交
     */
    static rayIntersectBox(ray: Ray, minx: number, miny: number, minz: number, maxx: number, maxy: number, maxz: number) {
        const rayoe = ray.origin;
        const rayoeX = rayoe.x;
        const rayoeY = rayoe.y;
        const rayoeZ = rayoe.z;

        const rayde = ray.direction;
        const raydeX = rayde.x;
        const raydeY = rayde.y;
        const raydeZ = rayde.z;

        let out = 0;
        let tmax = MathUtils3D.MaxValue;

        if (MathUtils3D.isZero(raydeX)) {
            if (rayoeX < minx || rayoeX > maxx)
                return -1;
        } else {
            const inverse = 1 / raydeX;
            let t1 = (minx - rayoeX) * inverse;
            let t2 = (maxx - rayoeX) * inverse;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
            }

            out = Math.max(t1, out);
            tmax = Math.min(t2, tmax);

            if (out > tmax)
                return -1;
        }

        if (MathUtils3D.isZero(raydeY)) {
            if (rayoeY < miny || rayoeY > maxy)
                return -1;
        } else {
            const inverse1 = 1 / raydeY;
            let t3 = (miny - rayoeY) * inverse1;
            let t4 = (maxy - rayoeY) * inverse1;

            if (t3 > t4) {
                const temp1 = t3;
                t3 = t4;
                t4 = temp1;
            }

            out = Math.max(t3, out);
            tmax = Math.min(t4, tmax);

            if (out > tmax)
                return -1;
        }

        if (MathUtils3D.isZero(raydeZ)) {
            if (rayoeZ < minz || rayoeZ > maxz)
                return -1;
        } else {
            const inverse2 = 1 / raydeZ;
            let t5 = (minz - rayoeZ) * inverse2;
            let t6 = (maxz - rayoeZ) * inverse2;

            if (t5 > t6) {
                const temp2: number = t5;
                t5 = t6;
                t6 = temp2;
            }

            out = Math.max(t5, out);
            tmax = Math.min(t6, tmax);

            if (out > tmax)
                return -1;
        }

        return out;
    }
}