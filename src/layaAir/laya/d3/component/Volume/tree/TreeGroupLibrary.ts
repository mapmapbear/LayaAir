import { Laya } from "Laya";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { Functions } from "../utils/Functions";

/**
 * 组合植物库
 */
export class TreeGroupLibrary {
    root: string = "res/layaverse/tree/group/"; //植物库根目录
    keys: string[];
    treeGroup = {
        "100100": { name: "野花组合", num: 1 },
        "100200": { name: "荷花组合", num: 1 },
        "100300": { name: "绿篱组合", num: 3 },
    };

    constructor() {
        this.keys = Object.keys(this.treeGroup);
    }

    /**
     * 数据JSON保存
     */
    toJson() {
        const json = JSON.stringify(this.treeGroup);
        return json;
    }

    /**
     * 解析JSON数据
     * @param json 
     */
    parseJson(json: string) {
        this.treeGroup = JSON.parse(json);
    }

    /**
     * 根据名称获取植物编码
     * @param name 
     */
    getTypeFromName(name: string) {
        for (const key in this.treeGroup) {
            if (this.treeGroup[key].name == name)
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
        return cfg.slice(len, cfg.length - 9);
    }

    /**
     * 从cfg中提取植物序号
     * @param cfg 
     */
    getKindFromCfg(cfg: string) {
        const len = cfg.length;
        return Number(cfg.slice(len - 8, len - 5)) - 1;
    }

    /**
     * 保存数据文件
     * @param file 
     */
    save(file: string) {
        Functions.saveDataToJsonFile(this.treeGroup, file);
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
     * 获取某类组合的数量
     * @param type 
     */
    getGroupKindNum(type: number) {
        let typeStr = type.toString();
        for (let i = 0, len = 6 - typeStr.length; i < len; i++)
            typeStr = "0" + typeStr;
        if (this.treeGroup[typeStr] != undefined)
            return this.treeGroup[typeStr].num;
        return 0;
    }

    /**
     * 根据类型码和形状码获取植物组合的配置文件路径
     * @param type 
     * @param kind 
     * @returns 
     */
    getGroupCfgFileByType(type: number, kind: number = -1) {
        let typeStr = type.toString();
        for (let i = 0, len = 6 - typeStr.length; i < len; i++)
            typeStr = "0" + typeStr;
        if (kind < 0)
            kind = Math.random() * this.treeGroup[typeStr].num | 0;
        let kindStr = (kind + 1).toString();
        for (let i = 0, len = 3 - kindStr.length; i < len; i++)
            kindStr = "0" + kindStr;
        return this.root + this.treeGroup[typeStr].name + '/' + kindStr + '.json';
    }

    /**
     * 根据类型名称和形状码获取植物组合配置文件路径
     * @param name  
     * @param kind 
     * @returns 
     */
    getGroupCfgFileByName(name: string, kind: number = -1) {
        for (const key in this.treeGroup) {
            if (this.treeGroup[key].name == name) {
                if (kind < 0)
                    kind = Math.random() * this.treeGroup[key].num | 0;
                let kindStr = (kind + 1).toString();
                for (let i = 0, len = 3 - kindStr.length; i < len; i++)
                    kindStr = "0" + kindStr;
                return this.root + this.treeGroup[key].name + '/' + kindStr + '.json';
            }
        }
        return "";
    }

    /**
     * 获取随机组合
     */
    randGroupCfgFile() {
        const randType = this.keys[Math.random() * this.keys.length | 0];
        let randKind = ((Math.random() * this.treeGroup[randType].num | 0) + 1).toString();
        for (let i = 0, len = 3 - randKind.length; i < len; i++)
            randKind = "0" + randKind;
        return this.root + this.treeGroup[randType].name + '/' + randKind + '.json';
    }

    /**
     * 获取植物组合名称列表
     * @param groupNameArray 
     */
    getGroupNameArray(groupNameArray: string[]) {
        groupNameArray.length = 0;
        for (const key in this.treeGroup) {
            groupNameArray.push(this.treeGroup[key].name);
        }
    }

    /**
     * 根据植物组合名称获取数量
     * @param name 
     * @param groupKindArray 
     * @returns 
     */
    getGroupKindArray(name: string, groupKindArray: number[]) {
        groupKindArray.length = 0;
        for (const key in this.treeGroup) {
            if (this.treeGroup[key].name == name) {
                for (let i = 0; i < this.treeGroup[key].num; i++)
                    groupKindArray.push(i);
                return;
            }
        }
    }
}