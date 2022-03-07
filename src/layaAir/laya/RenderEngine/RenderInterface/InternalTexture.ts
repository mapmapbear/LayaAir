import { FilterMode } from "../RenderEnum/FilterMode";
import { TextureCompareMode } from "../RenderEnum/TextureCompareMode";
import { WarpMode } from "../RenderEnum/WrapMode";

/**
 * @internal 
 * 内部纹理对象
 */
 export interface InternalTexture {

    /**
     * gpu texture object
     */
    resource: any;
    target:number;

    width: number;
    height: number;
    isPotSize: boolean;

    mipmap: boolean;
    mipmapCount: number;

    filterMode: FilterMode;
    wrapU: WarpMode;
    wrapV: WarpMode;
    wrapW: WarpMode;
    anisoLevel: number;

    compareMode: TextureCompareMode;

    /**
     * 是否使用 sRGB格式 加载图片数据
     */
    useSRGBLoad: boolean;
    /**
     * gamma 矫正值
     */
    gammaCorrection: number;

    dispose(): void;
}