import { TextureFormat } from "../resource/TextureFormat";
import { SystemUtils } from "./SystemUtils";

const FOURCC_DXT1: number = 827611204;
const FOURCC_DXT3 = 861165636;
const FOURCC_DXT5: number = 894720068;
const FOURCC_DX10 = 808540228;
const DDPF_FOURCC: number = 0x4;
const DDPF_RGB = 0x40;
const DDSCAPS2_CUBEMAP = 0x200;
const DDPF_LUMINANCE = 0x20000;
const DDSD_MIPMAPCOUNT: number = 0x20000;
const DDS_MAGIC: number = 0x20534444;
const DDS_HEADER_LENGTH: number = 31;
const DDS_HEADER_MAGIC: number = 0;
const DDS_HEADER_SIZE: number = 1;
const DDS_HEADER_FLAGS: number = 2;
const DDS_HEADER_HEIGHT: number = 3;
const DDS_HEADER_WIDTH: number = 4;
const DDS_HEADER_MIPMAPCOUNT: number = 7;
const DDS_HEADER_PF_FLAGS: number = 20;
const DDS_HEADER_PF_FOURCC: number = 21;
const DDS_HEADER_PF_RGBBPP: number = 22;
const DDS_HEADER_PF_CAPS2: number = 28;
const FOURCC_D3DFMT_R16G16B16A16F = 113;
const FOURCC_D3DFMT_R32G32B32A32F = 116;

const Int32ToFourCC = (value: number) => {
    return String.fromCharCode(
        value & 0xff,
        (value >> 8) & 0xff,
        (value >> 16) & 0xff,
        (value >> 24) & 0xff
    );
}

export class DDSTextureInfo {

    width: number;
    height: number;
    mipmapCount: number;
    isCube: boolean;
    blockBytes: number;
    format: TextureFormat;
    dataOffset: number;

    constructor(width: number, height: number, mipmapCount: number, isCube: boolean, blockBytes: number, dataOffset: number, format: TextureFormat) {
        this.width = width;
        this.height = height;
        this.mipmapCount = mipmapCount;
        this.isCube = isCube;
        this.blockBytes = blockBytes;
        this.dataOffset = dataOffset;
        this.format = format;
    }

    static getDDSTextureInfo(source: ArrayBuffer): DDSTextureInfo {
        let header = new Int32Array(source, 0, DDS_HEADER_LENGTH);

        let width = header[DDS_HEADER_WIDTH];
        let height = header[DDS_HEADER_HEIGHT];

        let mipmapCount = 1;
        if (header[DDS_HEADER_FLAGS] & DDSD_MIPMAPCOUNT) {
            mipmapCount = Math.max(1, header[DDS_HEADER_MIPMAPCOUNT]);
        }

        let fourCC = header[DDS_HEADER_PF_FOURCC];

        // let extendedHeader = new Int32Array(source, 0, DDS_HEADER_LENGTH + 4);
        // let dxgiFormat = (fourCC == FOURCC_DX10) ? extendedHeader[32] : 0;

        let isFourCC = (header[DDS_HEADER_PF_FLAGS] & DDPF_FOURCC) === DDPF_FOURCC;

        let isRGB = (header[DDS_HEADER_PF_FLAGS] & DDPF_RGB) === DDPF_RGB;
        let isLuminance = (header[DDS_HEADER_PF_FLAGS] & DDPF_LUMINANCE) === DDPF_LUMINANCE;
        let isCube = (header[DDS_HEADER_PF_CAPS2] & DDSCAPS2_CUBEMAP) === DDSCAPS2_CUBEMAP;
        let isCompressed = (fourCC === FOURCC_DXT1 || fourCC === FOURCC_DXT3 || fourCC === FOURCC_DXT5);

        let layaTexFormat = TextureFormat.DXT1;
        let dataOffset = header[DDS_HEADER_SIZE] + 4;
        let blockBytes = 1;
        // todo  DXT10  unCompressed texture ?
        switch (fourCC) {
            case FOURCC_DXT1:
                layaTexFormat = TextureFormat.DXT1;
                blockBytes = 8;
                break;
            case FOURCC_DXT3:
                layaTexFormat = TextureFormat.DXT3;
                blockBytes = 16;
                break;
            case FOURCC_DXT5:
                layaTexFormat = TextureFormat.DXT5;
                blockBytes = 16;
                break;
            default:
                throw "Unsupported format " + Int32ToFourCC(fourCC)
        }


        let ext = SystemUtils.supportDDSTexture() || SystemUtils.supportDDS_srgb();

        if (header[DDS_HEADER_MAGIC] !== DDS_MAGIC) {
            throw "Invalid magic number in DDS header";
        }
        if (!isFourCC && !isRGB && !isLuminance) {
            throw "Unsupported format, must contain a FourCC, RGB or LUMINANCE code";
        }

        if (isCompressed && !ext) {
            throw "Compressed textures are not supported on this platform.";
        }

        return new DDSTextureInfo(width, height, mipmapCount, isCube, blockBytes, dataOffset, layaTexFormat);
    }

}