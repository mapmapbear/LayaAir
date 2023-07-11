import { TreeEdit } from "./TreeEdit";
import { TreeLibrary } from "./TreeLibrary";
import { TreeRandomGenParam } from "./TreeConfig";

/**
 * 基于AI生成植物
 */
export class TreeAIGC {
    te: TreeEdit;
    tl: TreeLibrary;
    trgp: TreeRandomGenParam;
    constructor(te: TreeEdit, tl: TreeLibrary) {
        this.te = te;
        this.tl = tl;
        this.trgp = new TreeRandomGenParam();
    }

    private _nameToType(name: string) {
        switch (name) {
            case 'bigLeaf':
                return 100;
            case 'midLeaf':
                return 110;
            case 'smallLeaf':
                return 120;
            case 'maple':
                return 130;
            case 'willow':
                return 500;
        }
        return -1;
    }

    private _getHeight(key: string, options: any) {
        switch (key) {
            case 'height':
            case 'high':
            case 'size':
                return options[key];
        }
        return -1;
    }

    private _getWide(key: string, options: any) {
        switch (key) {
            case 'wide':
            case 'width':
            case 'radius':
            case 'deminsion':
                return options[key];
        }
        return -1;
    }

    private _getCurve(key: string, options: any) {
        switch (key) {
            case 'curve':
                return options[key];
        }
        return -1;
    }

    private _getleafRich(key: string) {
        switch (key) {
            case 'more leaf':
                return 1.2;
            case 'less leaf':
                return 0.8;
        }
        return -1;
    }

    private _getbranchRich(key: string) {
        switch (key) {
            case 'more branch':
                return 1.2;
            case 'less branch':
                return 0.8;
        }
        return -1;
    }

    private _getLuminance(key: string) {
        switch (key) {
            case 'light':
                return 1.5;
            case 'dark':
                return 0.5;
        }
        return -1;
    }

    private _getSaturation(key: string) {
        switch (key) {
            case 'more colorful':
                return 1.5;
            case 'less colorful':
                return 0.5;
        }
        return -1;
    }

    /**
     * 根据关键词和参数生成植物
     * @param keywords 
     * @param options 
     */
    aigcPlant(keywords: string[], options: any) {
        let t = 0;
        let type = 100;
        let height = 5;
        let wide = 1;
        let curve = 0.1;
        let leafRich = 1;
        let branchRich = 1;
        let luminance = 1;
        let saturation = 1;
        Object.keys(options).forEach(key => {
            console.log(key, options[key]);
            t = this._getHeight(key, options); //提取高度
            if (t >= 0) height = t;
            t = this._getWide(key, options); //提取宽度
            if (t >= 0) wide = t;
            t = this._getCurve(key, options); //提取弯度
            if (t >= 0) curve = t;
        });
        keywords.forEach(key => {
            console.log(key);
            t = this._nameToType(key);
            if (t > 0) type = t;
            t = this._getleafRich(key);
            if (t > 0) leafRich = t;
            t = this._getbranchRich(key);
            if (t > 0) branchRich = t;
            t = this._getLuminance(key);
            if (t > 0) luminance = t;
            t = this._getSaturation(key);
            if (t > 0) saturation = t;
        });

        this.genPlant(type, height, wide, curve, leafRich, branchRich, luminance, saturation);
    }

    /**
     * 生成植物
     * @param type 
     * @param height 
     * @param wide 
     * @param curve 
     * @param leafRich 
     * @param branchRich 
     * @param luminance 
     * @param saturation 
     */
    genPlant(type: number = 100, height: number = 5, wide: number = 1, curve: number = 0,
        leafRich: number = 1, branchRich: number = 1, luminance: number = 1, saturation: number = 1) {
        const tal = this.tl;
        const cfg = tal.getTreeCfgFileByType(type);
        this.te.loadConfig(cfg,
            () => {
                this.trgp.copyParam(this.te.tr.cfg.param);
                this.trgp.height = height;
                this.trgp.wide = wide;
                this.trgp.curve = curve;
                this.trgp.leafRich = leafRich;
                this.trgp.branchRich = branchRich;
                this.trgp.luminance = luminance;
                this.trgp.saturation = saturation;
                this.te.genConfig(this.trgp);
                this.te.updateTree();
            }, true);
    }

    moreHeight() {
        if (this.te) {
            this.te.adjHeight(1.05);
            this.te.updateTree();
        }
    }

    lessHeight() {
        if (this.te) {
            this.te.adjHeight(0.95);
            this.te.updateTree();
        }
    }

    moreWide() {
        if (this.te) {
            this.te.adjWide(1.05);
            this.te.updateTree();
        }
    }

    lessWide() {
        if (this.te) {
            this.te.adjWide(0.95);
            this.te.updateTree();
        }
    }

    moreCurve() {
        if (this.te) {
            this.te.adjCurve(1.1);
            this.te.updateTree();
        }
    }

    lessCurve() {
        if (this.te) {
            this.te.adjCurve(0.9);
            this.te.updateTree();
        }
    }

    moreBranch() {
        if (this.te) {
            this.te.adjBranch(1);
            this.te.updateTree();
        }
    }

    lessBranch() {
        if (this.te) {
            this.te.adjBranch(-1);
            this.te.updateTree();
        }
    }

    moreLeaf() {
        if (this.te) {
            this.te.adjLeaf(1);
            this.te.updateTree();
        }
    }

    lessLeaf() {
        if (this.te) {
            this.te.adjLeaf(-1);
            this.te.updateTree();
        }
    }

    moreLuminance() {
        if (this.te) {
            this.te.adjLuminance(1.05);
            this.te.refreshTree();
        }
    }

    lessLuminance() {
        if (this.te) {
            this.te.adjLuminance(0.95);
            this.te.refreshTree();
        }
    }

    moreSaturation() {
        if (this.te) {
            this.te.adjSaturation(1.05);
            this.te.refreshTree();
        }
    }

    lessSaturation() {
        if (this.te) {
            this.te.adjSaturation(0.95);
            this.te.refreshTree();
        }
    }

    nextSeed() {
        if (this.te) {
            this.te.adjSeed();
            this.te.updateTree();
        }
    }
}