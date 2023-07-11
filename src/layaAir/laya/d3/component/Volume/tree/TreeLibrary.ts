import { Laya } from "Laya";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { Functions } from "../utils/Functions";

/**
 * 单元植物库
 */
export class TreeLibrary {
    root: string = "res/layaverse/tree/agent/"; //植物库根目录
    keys: string[];
    treeLib = {
        "000100": { name: "阔叶树", num: 5 },
        "000110": { name: "小叶树", num: 5 },
        "000120": { name: "细叶树", num: 5 },
        "000130": { name: "枫树", num: 5 },
        "000200": { name: "矮银杏", num: 5 },
        "000210": { name: "高银杏", num: 5 },
        "000220": { name: "红叶树", num: 5 },
        "000230": { name: "茶花树", num: 5 },
        "000240": { name: "圆球树", num: 5 },
        "000300": { name: "桃花树", num: 5 },
        "000310": { name: "樱花树", num: 5 },
        "000400": { name: "松树", num: 5 },
        "000410": { name: "松柏", num: 5 },
        "000500": { name: "柳树", num: 5 },
        "000600": { name: "棕榈树", num: 3 },
        "000610": { name: "椰子树", num: 5 },
        "000620": { name: "香蕉树", num: 3 },
        "000700": { name: "仙人掌", num: 2 },
        "000800": { name: "竹子", num: 2 },
        "000900": { name: "绿篱", num: 2 },
        "000910": { name: "半球", num: 5 },
        "000920": { name: "圆球", num: 5 },
        "001000": { name: "发财树", num: 3 },
        "001010": { name: "龟背竹", num: 4 },
        "001020": { name: "天堂鸟", num: 3 },
        "001030": { name: "散尾葵", num: 3 },
        "001040": { name: "富贵竹", num: 2 },
        "001060": { name: "银皇后", num: 3 },
        "002000": { name: "荷花", num: 3 },
        "002100": { name: "玫瑰", num: 2 },
        "002200": { name: "百合", num: 3 },
        "003000": { name: "野草", num: 3 },
        "003100": { name: "野花", num: 5 },
        "004000": { name: "芦苇", num: 1 },
    };

    static TYPE_MAX: number = 100000;

    constructor() {
        this.keys = Object.keys(this.treeLib);
    }

    /**
     * 数据JSON保存
     */
    toJson() {
        const json = JSON.stringify(this.treeLib);
        return json;
    }

    /**
     * 解析JSON数据
     * @param json 
     */
    parseJson(json: string) {
        this.treeLib = JSON.parse(json);
    }

    /**
     * 根据名称获取植物编码
     * @param name 
     */
    getTypeFromName(name: string) {
        for (const key in this.treeLib) {
            if (this.treeLib[key].name == name)
                return Number(key);
        }
        return 0;
    }

    /**
     * 从cfg中提取植物名称
     * @param cfg 
     */
    getNameFromCfg(cfg: string) {
        const len = this.root.length;
        return cfg.slice(len, cfg.length - 8);
    }

    /**
     * 从cfg中提取植物序号
     * @param cfg 
     */
    getKindFromCfg(cfg: string) {
        const len = cfg.length;
        return Number(cfg.slice(len - 7, len - 5)) - 1;
    }

    /**
     * 保存数据文件
     * @param file 
     */
    save(file: string) {
        Functions.saveDataToJsonFile(this.treeLib, file);
    }

    /**
     * 加载数据文件
     * @param file 
     */
    load(file: string) {
        Laya.loader.load({ url: file, type: Loader.JSON },
            Handler.create(this, (json: any) => {
                if (json)
                    this.parseJson(json);
            }));
    }

    /**
     * 获取某类型树的形状数量
     * @param type 
     */
    getTreeKindNum(type: number) {
        let typeStr = type.toString();
        for (let i = 0, len = 6 - typeStr.length; i < len; i++)
            typeStr = "0" + typeStr;
        if (this.treeLib[typeStr] != undefined)
            return this.treeLib[typeStr].num;
        return 0;
    }

    /**
     * 根据类型码和形状码获取树木配置文件路径
     * @param type 
     * @param kind 
     * @returns 
     */
    getTreeCfgFileByType(type: number, kind: number = -1) {
        let typeStr = type.toString();
        for (let i = 0, len = 6 - typeStr.length; i < len; i++)
            typeStr = "0" + typeStr;
        if (kind < 0)
            kind = Math.random() * this.treeLib[typeStr].num | 0;
        let kindStr = (kind + 1).toString();
        for (let i = 0, len = 2 - kindStr.length; i < len; i++)
            kindStr = "0" + kindStr;
        return this.root + this.treeLib[typeStr].name + '/' + kindStr + '.json';
    }

    /**
     * 根据类型码和形状码获取树木配置文件路径
     * @param name  
     * @param kind 
     * @returns 
     */
    getTreeCfgFileByName(name: string, kind: number = -1) {
        for (const key in this.treeLib) {
            if (this.treeLib[key].name == name) {
                if (kind < 0)
                    kind = Math.random() * this.treeLib[key].num | 0;
                let kindStr = (kind + 1).toString();
                for (let i = 0, len = 2 - kindStr.length; i < len; i++)
                    kindStr = "0" + kindStr;
                return this.root + this.treeLib[key].name + '/' + kindStr + '.json';
            }
        }
        return "";
    }

    /**
     * 获取随机树木
     */
    randTreeCfgFile() {
        const randType = this.keys[Math.random() * this.keys.length | 0];
        let randKind = ((Math.random() * this.treeLib[randType].num | 0) + 1).toString();
        for (let i = 0, len = 2 - randKind.length; i < len; i++)
            randKind = "0" + randKind;
        return this.root + this.treeLib[randType].name + '/' + randKind + '.json';
    }

    /**
     * 获取指定类型树木
     * @param type 
     */
    typeTreeCfgFile(type: number) {
        if (this.keys.length > 0) {
            if (type >= this.keys.length)
                type = this.keys.length - 1;
            const randType = this.keys[type];
            let randKind = ((Math.random() * this.treeLib[randType].num | 0) + 1).toString();
            for (let i = 0, len = 2 - randKind.length; i < len; i++)
                randKind = "0" + randKind;
            return this.root + this.treeLib[randType].name + '/' + randKind + '.json';
        }
        return "";
    }

    /**
     * 获取指定类型树木
     * @param name 
     * @param kind 
     */
    typeTreeCfgFileByName(name: string, kind: number = -1) {
        for (let i = 0; i < this.keys.length; i++) {
            const keyName = this.treeLib[this.keys[i]].name;
            if (keyName == name) {
                const randType = this.keys[i];
                let randKind = kind < 0 ? ((Math.random() * this.treeLib[randType].num | 0) + 1).toString() : (kind + 1).toString();
                for (let i = 0, len = 2 - randKind.length; i < len; i++)
                    randKind = "0" + randKind;
                return this.root + this.treeLib[randType].name + '/' + randKind + '.json';
            }
        }
        return "";
    }

    /**
     * 获取树木名称列表
     * @param treeNameArray 
     */
    getTreeNameArray(treeNameArray: string[]) {
        treeNameArray.length = 0;
        for (const key in this.treeLib)
            treeNameArray.push(this.treeLib[key].name);
    }

    /**
     * 根据树木名称获取树木数量
     * @param name 
     * @param treeKindArray 
     * @returns 
     */
    getTreeKindArray(name: string, treeKindArray: number[]) {
        treeKindArray.length = 0;
        for (const key in this.treeLib) {
            if (this.treeLib[key].name == name) {
                for (let i = 0; i < this.treeLib[key].num; i++)
                    treeKindArray.push(i);
                return;
            }
        }
    }
}