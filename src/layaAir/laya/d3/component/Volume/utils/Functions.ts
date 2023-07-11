import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { Texture2D } from "laya/resource/Texture2D";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { RenderTexture } from "laya/resource/RenderTexture";
import { HTMLCanvas } from "laya/resource/HTMLCanvas";
import { ShaderDefine } from "laya/RenderEngine/RenderShader/ShaderDefine";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Ray } from "laya/d3/math/Ray";
import { Picker } from "laya/d3/utils/Picker";
import { BoundBox } from "laya/d3/math/BoundBox";
import { Bounds } from "laya/d3/math/Bounds";

export class Functions {
    static transVertex0: Vector3 = new Vector3();
    static transVertex1: Vector3 = new Vector3();
    static transVertex2: Vector3 = new Vector3();
    static corners: Vector3[] = [];

    //限制参数范围
    static clamp(v: number, min: number, max: number): number {
        return v < min ? min : (v > max ? max : v);
    }

    //交换两个bit的位置
    static swap2Bits(bits: number): number {
        let b0 = (bits & 0b01);
        let b1 = (bits & 0b10);
        return (b0 << 1 | b1 >> 1);
    }

    /**
     * 计算两个颜色之间的距离（判断颜色是否相近？）
     * @param color1 颜色1
     * @param color2 颜色2
     * @returns 颜色距离平方
     */
    static colorDistSq(color1: Vector4, color2: Vector4): number {
        let dx = color1.x - color2.x;
        let dy = color1.y - color2.y;
        let dz = color1.z - color2.z;
        let rx = (color1.x + color2.x) * 0.5;
        return (2 + rx / 256) * dx * dx + 4 * dy * dy + (2 + (255 - rx) / 256) * dz * dz;
    }

    /**
     * 计算两个颜色之间的距离（判断颜色是否相近？）
     * @param color1 颜色1
     * @param color2 颜色2
     * @returns 颜色距离
     */
    static colorDist(color1: Vector4, color2: Vector4): number {
        let dx = color1.x - color2.x;
        let dy = color1.y - color2.y;
        let dz = color1.z - color2.z;
        let rx = (color1.x + color2.x) * 0.5;
        return Math.sqrt((2 + rx / 256) * dx * dx + 4 * dy * dy + (2 + (255 - rx) / 256) * dz * dz);
    }

    /**
     * 是否是2的幂次
     * @param n 
     * @returns 
     */
    static isPower2(n: number): boolean {
        return (n & (n - 1)) == 0;
    }

    /**
     * 找出最接近的2的幂次值
     * @param n 
     * @returns 
     */
    static nearestPow2(n: number) {
        return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
    }

    /**
     * 提取Mesh线框
     * @param mesh Mesh
     * @param transform 世界变换
     * @param line 线框精灵
     * @param color 线框颜色
     * @param normal 是否提取法线
     */
    static wireframeMesh(mesh: Mesh, line: PixelLineSprite3D, transform: Matrix4x4 = null, color: Color = Color.GREEN, normal: boolean = false) {
        const positions: Array<Vector3> = [];
        const normals: Array<Vector3> = [];
        mesh.getPositions(positions);
        if (transform)
            for (let i = positions.length - 1; i > -1; i--)
                Vector3.transformCoordinate(positions[i], transform, positions[i]);
        if (normal) {
            mesh.getNormals(normals); //pos和normal队列等长
            for (let i = positions.length - 1; i > -1; i--) {
                const v0 = positions[i];
                const n0 = normals[i];
                n0.normalize();
                Vector3.add(v0, n0, n0);
                line.addLine(v0, n0, Color.BLUE, Color.BLUE);
            }
        }
        for (let j = mesh.subMeshCount - 1; j > -1; j--) {
            const indices = mesh.getSubMesh(j).getIndices();
            for (let i = 0, len = indices.length; i < len; i += 3) {
                const v0 = positions[indices[i]];
                const v1 = positions[indices[i + 1]];
                const v2 = positions[indices[i + 2]];
                line.addLine(v0, v1, color, color);
                line.addLine(v1, v2, color, color);
                line.addLine(v2, v0, color, color);
            }
        }
    }

    /**
     * 提取Mesh精灵线框
     * @param s3d Mesh精灵
     * @param line 线框精灵
     * @param color 线框颜色
     * @param normal 是否提取法线
     */
    static wireFrameSprite3D(s3d: Sprite3D, line: PixelLineSprite3D, color: Color = Color.GREEN, normal: boolean = false) {
        if (s3d instanceof MeshSprite3D) {
            const mesh = s3d.meshFilter.sharedMesh;
            const transform = s3d.transform.worldMatrix;
            Functions.wireframeMesh(mesh, line, transform, color, normal);
        }
        for (let i = 0, n = s3d.numChildren; i < n; i++)
            Functions.wireFrameSprite3D((<Sprite3D>s3d.getChildAt(i)), line, color, normal);
    }

    /**
     * 将16bit（565）颜色写入纹理中（分辨率256x256）
     * @param destTex 目标纹理
     */
    static writeColorPatternToTexture16b(destTex: Texture2D) {
        let buffer: Uint8Array;
        switch (destTex.format) {
            case TextureFormat.R5G6B5:
                buffer = new Uint8Array(256 * 256 * 2)
                for (let i = 0; i < 32; i++) {
                    for (let j = 0; j < 64; j++) {
                        for (let k = 0; k < 32; k++) {
                            let index = i * 64 * 32 * 2 + j * 32 * 2 + k * 2;
                            buffer[index] = (((i * 8.226) | 0) << 3) + ((((j * 4.048) | 0) & 0b111000) >> 3);
                            buffer[index + 1] = ((((j * 4.048) | 0) & 0b000111) << 5) + ((k * 8.226) | 0);
                        }
                    }
                }
                break;
            case TextureFormat.R8G8B8:
                buffer = new Uint8Array(256 * 256 * 3)
                for (let i = 0; i < 32; i++) {
                    for (let j = 0; j < 64; j++) {
                        for (let k = 0; k < 32; k++) {
                            let index = i * 64 * 32 * 3 + j * 32 * 3 + k * 3;
                            buffer[index] = (i * 8.226) | 0;
                            buffer[index + 1] = (j * 4.048) | 0;
                            buffer[index + 2] = (k * 8.226) | 0;
                        }
                    }
                }
                break;
            case TextureFormat.R8G8B8A8:
                buffer = new Uint8Array(256 * 256 * 4)
                for (let i = 0; i < 32; i++) {
                    for (let j = 0; j < 64; j++) {
                        for (let k = 0; k < 32; k++) {
                            let index = i * 64 * 32 * 4 + j * 32 * 4 + k * 4;
                            buffer[index] = (i * 8.226) | 0;
                            buffer[index + 1] = (j * 4.048) | 0;
                            buffer[index + 2] = (k * 8.226) | 0;
                            buffer[index + 3] = 255;
                        }
                    }
                }
                break;
        }
        destTex.setSubPixelsData(0, 0, 256, 256, buffer, 0, false, false, false);
    }

    /**
     * 将18bit（666）颜色写入纹理中（分辨率512x512）
     * @param destTex 目标纹理
     */
    static writeColorPatternToTexture18b(destTex: Texture2D) {
        let buffer: Uint8Array;
        switch (destTex.format) {
            case TextureFormat.R8G8B8:
                buffer = new Uint8Array(512 * 512 * 3)
                for (let i = 0; i < 64; i++) {
                    for (let j = 0; j < 64; j++) {
                        for (let k = 0; k < 64; k++) {
                            let index = i * 64 * 64 * 3 + j * 64 * 3 + k * 3;
                            buffer[index] = (i * 4.048) | 0;
                            buffer[index + 1] = (j * 4.048) | 0;
                            buffer[index + 2] = (k * 4.048) | 0;
                        }
                    }
                }
                break;
            case TextureFormat.R8G8B8A8:
                buffer = new Uint8Array(512 * 512 * 4)
                for (let i = 0; i < 64; i++) {
                    for (let j = 0; j < 64; j++) {
                        for (let k = 0; k < 64; k++) {
                            let index = i * 64 * 64 * 4 + j * 64 * 4 + k * 4;
                            buffer[index] = (i * 4.048) | 0;
                            buffer[index + 1] = (j * 4.048) | 0;
                            buffer[index + 2] = (k * 4.048) | 0;
                            buffer[index + 3] = 255;
                        }
                    }
                }
                break;
        }
        destTex.setSubPixelsData(0, 0, 512, 512, buffer, 0, false, false, false);
    }

    /**
     * 将20bit（776）颜色写入纹理中（分辨率1024x1024）
     * @param destTex 目标纹理
     */
    static writeColorPatternToTexture20b(destTex: Texture2D) {
        let buffer: Uint8Array;
        switch (destTex.format) {
            case TextureFormat.R8G8B8:
                buffer = new Uint8Array(1024 * 1024 * 3)
                for (let i = 0; i < 128; i++) {
                    for (let j = 0; j < 128; j++) {
                        for (let k = 0; k < 64; k++) {
                            let index = i * 128 * 64 * 3 + j * 64 * 3 + k * 3;
                            buffer[index] = (i * 2.008) | 0;
                            buffer[index + 1] = (j * 2.008) | 0;
                            buffer[index + 2] = (k * 4.048) | 0;
                        }
                    }
                }
                break;
            case TextureFormat.R8G8B8A8:
                buffer = new Uint8Array(1024 * 1024 * 4)
                for (let i = 0; i < 128; i++) {
                    for (let j = 0; j < 128; j++) {
                        for (let k = 0; k < 64; k++) {
                            let index = i * 128 * 64 * 4 + j * 64 * 4 + k * 4;
                            buffer[index] = (i * 2.008) | 0;
                            buffer[index + 1] = (j * 2.008) | 0;
                            buffer[index + 2] = (k * 4.048) | 0;
                            buffer[index + 3] = 255;
                        }
                    }
                }
                break;
        }
        destTex.setSubPixelsData(0, 0, 1024, 1024, buffer, 0, false, false, false);
    }

    /**
     * 将22bit（787）颜色写入纹理中（分辨率2048x2048）
     * @param destTex 目标纹理
     */
    static writeColorPatternToTexture22b(destTex: Texture2D) {
        let buffer: Uint8Array;
        switch (destTex.format) {
            case TextureFormat.R8G8B8:
                buffer = new Uint8Array(2048 * 2048 * 3)
                for (let i = 0; i < 128; i++) {
                    for (let j = 0; j < 256; j++) {
                        for (let k = 0; k < 128; k++) {
                            let index = i * 256 * 128 * 3 + j * 128 * 3 + k * 3;
                            buffer[index] = (i * 2.008) | 0;
                            buffer[index + 1] = j;
                            buffer[index + 2] = (k * 2.008) | 0;
                        }
                    }
                }
                break;
            case TextureFormat.R8G8B8A8:
                buffer = new Uint8Array(2048 * 2048 * 4)
                for (let i = 0; i < 128; i++) {
                    for (let j = 0; j < 256; j++) {
                        for (let k = 0; k < 128; k++) {
                            let index = i * 256 * 128 * 4 + j * 128 * 4 + k * 4;
                            buffer[index] = (i * 2.008) | 0;
                            buffer[index + 1] = j;
                            buffer[index + 2] = (k * 2.008) | 0;
                            buffer[index + 3] = 255;
                        }
                    }
                }
                break;
        }
        destTex.setSubPixelsData(0, 0, 2048, 2048, buffer, 0, false, false, false);
    }

    /**
     * 将24bit（888）颜色写入纹理中（分辨率4096x4096）
     * @param destTex 目标纹理
     */
    static writeColorPatternToTexture24b(destTex: Texture2D) {
        let buffer: Uint8Array;
        switch (destTex.format) {
            case TextureFormat.R8G8B8:
                buffer = new Uint8Array(4096 * 4096 * 3)
                for (let i = 0; i < 256; i++) {
                    for (let j = 0; j < 256; j++) {
                        for (let k = 0; k < 256; k++) {
                            let index = i * 256 * 256 * 3 + j * 256 * 3 + k * 3;
                            buffer[index] = i;
                            buffer[index + 1] = j;
                            buffer[index + 2] = k;
                        }
                    }
                }
                break;
            case TextureFormat.R8G8B8A8:
                buffer = new Uint8Array(4096 * 4096 * 4)
                for (let i = 0; i < 256; i++) {
                    for (let j = 0; j < 256; j++) {
                        for (let k = 0; k < 256; k++) {
                            let index = i * 256 * 256 * 4 + j * 256 * 4 + k * 4;
                            buffer[index] = i;
                            buffer[index + 1] = j;
                            buffer[index + 2] = k;
                            buffer[index + 3] = 255;
                        }
                    }
                }
                break;
        }
        destTex.setSubPixelsData(0, 0, 4096, 4096, buffer, 0, false, false, false);
    }

    /**
     * 将数据存入文件
     * @param data
     * @param file
     */
    static saveDataToJsonFile(data: any, file: string) {
        let b = new Blob([JSON.stringify(data)], { type: 'application/json' });
        let src = URL.createObjectURL(b);
        let a = document.createElement("a");
        a.download = file;
        a.href = src;
        a.click();
    }

    /**
     * 将数据存入文件
     * @param data
     * @param file
     */
    static saveDataToFile(data: any, file: string) {
        let b = new Blob([data]);
        let src = URL.createObjectURL(b);
        let a = document.createElement("a");
        a.download = file;
        a.href = src;
        a.click();
    }

    static tex2Data(tex: Texture2D): Uint8Array {
        let pixelArray: Uint8Array;
        let width = tex.width;
        let height = tex.height;
        pixelArray = tex.getPixels();

        let canv: HTMLCanvas = new HTMLCanvas(true);
        canv.lock = true;
        canv.size(width, height);
        let ctx2d = canv.getContext('2d');
        //@ts-ignore
        let imgdata: ImageData = ctx2d.createImageData(width, height);
        //@ts-ignore
        imgdata.data.set(new Uint8ClampedArray(pixelArray));
        //@ts-ignore
        ctx2d.putImageData(imgdata, 0, 0);

        let ds = canv.source.toDataURL();
        let bstr = window.atob(ds.split(',')[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--)
            u8arr[n] = bstr.charCodeAt(n);
        canv.destroy();
        return u8arr;
    }

    static rt2Data(rt: RenderTexture): Uint8Array {
        let pixelArray: Uint8Array;
        let width = rt.width;
        let height = rt.height;
        pixelArray = new Uint8Array(width * height * 4);
        rt.getData(0, 0, width, height, pixelArray);

        let canv: HTMLCanvas = new HTMLCanvas(true);
        canv.lock = true;
        canv.size(width, height);
        let ctx2d = canv.getContext('2d');
        //@ts-ignore
        let imgdata: ImageData = ctx2d.createImageData(width, height);
        //@ts-ignore
        imgdata.data.set(new Uint8ClampedArray(pixelArray));
        //@ts-ignore
        ctx2d.putImageData(imgdata, 0, 0);

        let ds = canv.source.toDataURL();
        let bstr = window.atob(ds.split(',')[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--)
            u8arr[n] = bstr.charCodeAt(n);
        canv.destroy();
        return u8arr;
    }

    /**
     * 计算和射线和网格的最近交点，返回距离
     * @param ray 
     */
    static rayIntersectMesh(ray: Ray, mesh: Mesh, transform: Matrix4x4) {
        let closestIntersection = Number.MAX_VALUE;
        if (!mesh) return closestIntersection;

        for (let j = 0; j < mesh.subMeshCount; j++) { //@ts-ignore
            const vertices = mesh._subMeshes[j]._vertexBuffer.getFloat32Data(); //@ts-ignore
            const indices = mesh._subMeshes[j]._indexBuffer.getData(); //@ts-ignore
            const vs = mesh.getVertexDeclaration().vertexStride / 4;

            const v1 = this.transVertex0;
            const v2 = this.transVertex1;
            const v3 = this.transVertex2;

            for (let i = 0, len = indices.length; i < len; i += 3) {
                const idex1 = indices[i] * vs;
                const idex2 = indices[i + 1] * vs;
                const idex3 = indices[i + 2] * vs;
                v1.x = vertices[idex1];
                v1.y = vertices[idex1 + 1];
                v1.z = vertices[idex1 + 2];
                v2.x = vertices[idex2];
                v2.y = vertices[idex2 + 1];
                v2.z = vertices[idex2 + 2];
                v3.x = vertices[idex3];
                v3.y = vertices[idex3 + 1];
                v3.z = vertices[idex3 + 2];

                Vector3.transformCoordinate(v1, transform, v1);
                Vector3.transformCoordinate(v2, transform, v2);
                Vector3.transformCoordinate(v3, transform, v3);
                const intersection = Picker.rayIntersectsTriangle(ray, v1, v2, v3);

                if (!isNaN(intersection) && intersection < closestIntersection)
                    closestIntersection = intersection;
            }
        }
        return closestIntersection;
    }

    /**
     * 绘制包围盒
     * @param debugLine 
     * @param boundBox 
     * @param color 
     */
    static drawBound(debugLine: PixelLineSprite3D, boundBox: BoundBox | Bounds, color: Color) {
        if (debugLine.lineCount + 12 > debugLine.maxLineCount)
            debugLine.maxLineCount += 12;

        const start: Vector3 = this.transVertex0;
        const end: Vector3 = this.transVertex1;
        const min: Vector3 = boundBox.min;
        const max: Vector3 = boundBox.max;

        start.setValue(min.x, min.y, min.z);
        end.setValue(max.x, min.y, min.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(min.x, min.y, min.z);
        end.setValue(min.x, min.y, max.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(max.x, min.y, min.z);
        end.setValue(max.x, min.y, max.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(min.x, min.y, max.z);
        end.setValue(max.x, min.y, max.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(min.x, min.y, min.z);
        end.setValue(min.x, max.y, min.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(min.x, min.y, max.z);
        end.setValue(min.x, max.y, max.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(max.x, min.y, min.z);
        end.setValue(max.x, max.y, min.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(max.x, min.y, max.z);
        end.setValue(max.x, max.y, max.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(min.x, max.y, min.z);
        end.setValue(max.x, max.y, min.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(min.x, max.y, min.z);
        end.setValue(min.x, max.y, max.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(max.x, max.y, min.z);
        end.setValue(max.x, max.y, max.z);
        debugLine.addLine(start, end, color, color);

        start.setValue(min.x, max.y, max.z);
        end.setValue(max.x, max.y, max.z);
        debugLine.addLine(start, end, color, color);
    }
}