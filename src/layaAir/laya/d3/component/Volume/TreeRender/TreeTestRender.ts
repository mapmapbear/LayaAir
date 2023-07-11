import { Component } from "../../../../components/Component";
import { MeshFilter } from "../../../core/MeshFilter";
import { Sprite3D } from "../../../core/Sprite3D";
import { BlinnPhongMaterial } from "../../../core/material/BlinnPhongMaterial";
import { Material } from "../../../core/material/Material";
import { BaseRender } from "../../../core/render/BaseRender";
import { RenderElement } from "../../../core/render/RenderElement";
import { MeshReader } from "../../../loaders/MeshReader";
import { Mesh } from "../../../resource/models/Mesh";
// import { TreeInstanceManager } from "../tree/TreeInstanceManager";
import { TreeUtils } from "../tree/TreeUtils";
import { TreeEdit } from "../tree/TreeEdit";
import { TreeResManager } from "../tree/TreeResManager";
import { TreeConfig, TreeRandomGenParam } from "../tree/TreeConfig";
import { TreeRender } from "../tree/TreeRender";
import { RenderContext3D } from "../../../core/render/RenderContext3D";
import { Transform3D } from "../../../core/Transform3D";
import { MeshRenderer } from "../../../core/MeshRenderer";
import { ShaderDefine } from "../../../../RenderEngine/RenderShader/ShaderDefine";
import { BoundFrustum } from "../../../math/BoundFrustum";
import { TreeResource } from "../tree/TreeResource";
import { Loader } from "../../../../net/Loader";
import { Handler } from "../../../../utils/Handler";
import { Laya, loader } from "../../../../../Laya";
import { Texture2D } from "../../../../resource/Texture2D";
import { TreeMaterial } from "../tree/material/tree/TreeMaterial";
import { TreeShaderInit } from "../tree/material/tree/TreeShaderInit";
import { ImposterShaderInit } from "../tree/material/imposter/ImposterShaderInit";
import { ImposterMaterial } from "../tree/material/imposter/ImposterMaterial";
declare module dat { const GUI: any; }
/**
 * 类用来描述一个程序化树的渲染流程
 */
export class TreeTestRender extends MeshRenderer
{

    static confFilePath : string;
    static confRootPath : string;
    private treeEdit : TreeEdit;
    private treeResource : TreeResource;
    private cfg : TreeConfig;
    private tree : Texture2D;
    
    private gui: any; //界面
    private guiName: string;

    
    constructor()
    {
        super();
        TreeTestRender.confRootPath = "";
        TreeTestRender.confFilePath = "res/tree/tree.json";
        TreeUtils.__init__();
        TreeMaterial.__init__();
        TreeShaderInit.__init__();
        // TreeInstanceManager.__init__();
        ImposterShaderInit.__init__();
        ImposterMaterial.__init__();
    }

    /**
     * @internal
     */
    _createRenderElement(): RenderElement {
        return super._createRenderElement();
    }

    /**@intermal */
    getMesh() 
    {
        return this._mesh;
    }

    protected _onEnable(): void {
        super._onEnable();
        const filter = this.owner.getComponent(MeshFilter) as MeshFilter;
        if (filter) filter._enabled && this._onMeshChange(filter.sharedMesh);
        else {
            this.owner.addComponent(MeshFilter);
        }

        this.treeEdit = new TreeEdit();
        this.treeEdit.loadConfig(TreeTestRender.confFilePath,
        () => {
            this.treeEdit.tree.renderCamera();
            this.owner.getComponent(MeshFilter).sharedMesh = this.treeEdit.tree.renderNode.mesh;
            this.owner.getComponent(MeshRenderer).sharedMaterial = this.treeEdit.tree.renderNode.material;
            this.addTreeEditGui();
        }, true);
        
    }

    addTreeEditGui() {
        if (this.gui)
            this.gui.destroy();
        const updateTree = this.treeEdit.updateTree.bind(this.treeEdit);
        const refreshTree = this.treeEdit.refreshTree.bind(this.treeEdit);
        const cfg = this.treeEdit.tr.cfg;

        this.gui = new dat.GUI();
        this.gui.width = 400;
        this.guiName = "TreeEdit";
        const gui = this.gui;
        let folder = gui.addFolder("植物参数");
        folder.open();
        folder = gui.addFolder("全局");
        folder.add(cfg, 'showLeaf', false).name('显示树叶').listen().onChange(() => { updateTree(); });
        folder.add(cfg, 'showFrond', false).name('显示蕨叶').listen().onChange(() => { updateTree(); });
        folder.add(cfg, 'showSquama', false).name('显示鳞叶').listen().onChange(() => { updateTree(); });
        folder.add(cfg, 'showFlower', false).name('显示花朵').listen().onChange(() => { updateTree(); });
        folder.add(cfg, 'showBranch', false).name('显示树枝').listen().onChange(() => { updateTree(); });
        folder.add(cfg, 'showBound', false).name('显示包盒').listen().onChange(() => { refreshTree(); });
        folder.add(cfg, 'grow', 0, 1, 0.01).name('生长系数').listen().onChange(() => { refreshTree(); });
        folder.add(cfg, 'season', 0, 3, 0.01).name('季节系数').listen().onChange(() => {
            if (this.treeEdit)
                this.treeEdit.setSeason(cfg.season);
            refreshTree();
        });
        folder.add(cfg.wind, 'x', 0, 10, 0.1).name('风力').listen().onChange(() => { refreshTree(); });
        folder.add(cfg.wind, 'y', 0, 2, 0.1).name('风频').listen().onChange(() => { refreshTree(); });
        folder.add(cfg.wind, 'z', 0, 360, 1).name('风向').listen().onChange(() => { refreshTree(); });
        folder.add(cfg.param, 'height', 0.1, 20, 0.01).name('树高').listen().onChange(() => { updateTree(); });
        folder.add(cfg.param, 'wide', 0.1, 10, 0.01).name('宽度').listen().onChange(() => { updateTree(); });
        folder.add(cfg.param, 'soft', 0, 20, 0.1).name('柔软').listen().onChange(() => { updateTree(); });
        folder.add(cfg.param, 'drop', -2, 2, 0.1).name('重力').listen().onChange(() => { updateTree(); });
        folder.add(cfg.param, 'lodNum', 2, 4, 1).name('LOD数量').listen().onChange(() => { updateTree(); });
        folder.add(cfg.param, 'lodDist', 1, 100, 1).name('LOD距离').listen().onChange(() => { });
        folder.add(cfg.param, 'visDist', 1, 200, 1).name('可视距离').listen().onChange(() => { });
        folder.add(cfg.param.uvScale, 'u', 0.1, 10, 0.05).name('UV水平缩放').listen().onChange(() => { updateTree(); });
        folder.add(cfg.param.uvScale, 'v', 0.1, 10, 0.05).name('UV垂直缩放').listen().onChange(() => { updateTree(); });
        {
            const prev = folder;
            folder = folder.addFolder("色彩");
            folder.add(cfg.param, 'luminance', 0, 2, 0.01).name('亮度').listen().onChange(() => { refreshTree(); });
            folder.add(cfg.param, 'saturation', 0, 2, 0.01).name('色度').listen().onChange(() => { refreshTree(); });
            folder.add(cfg.param.hue, 'spring', -1, 1, 0.01).name('春季').listen().onChange(() => {
                cfg.season = 0;
                if (this.treeEdit)
                    this.treeEdit.setSeason(cfg.season);
                refreshTree();
            });
            folder.add(cfg.param.hue, 'summer', -1, 1, 0.01).name('夏季').listen().onChange(() => {
                cfg.season = 1;
                if (this.treeEdit)
                    this.treeEdit.setSeason(cfg.season);
                refreshTree();
            });
            folder.add(cfg.param.hue, 'autumn', -1, 1, 0.01).name('秋季').listen().onChange(() => {
                cfg.season = 2;
                if (this.treeEdit)
                    this.treeEdit.setSeason(cfg.season);
                refreshTree();
            });
            folder.add(cfg.param.hue, 'winter', -1, 1, 0.01).name('冬季').listen().onChange(() => {
                cfg.season = 3;
                if (this.treeEdit)
                    this.treeEdit.setSeason(cfg.season);
                refreshTree();
            });
            folder = prev;
        }
        {
            const prev = folder;
            folder = folder.addFolder("数据");
            folder.add(cfg, 'dataLength').name('数据长度').listen();
            folder.add(cfg, 'faceNum').name('植物面数').listen();
            if (cfg.param.branch) {
                folder.add(cfg.branchNum, '0').name('一层树枝').listen();
                folder.add(cfg.branchNum, '1').name('二层树枝').listen();
                folder.add(cfg.branchNum, '2').name('三层树枝').listen();
                folder.add(cfg.branchNum, '3').name('四层树枝').listen();
            }
            if (cfg.param.leaf) {
                folder.add(cfg.leafNum, '0').name('一层树叶').listen();
                folder.add(cfg.leafNum, '1').name('二层树叶').listen();
                folder.add(cfg.leafNum, '2').name('三层树叶').listen();
                folder.add(cfg.leafNum, '3').name('四层树叶').listen();
            }
            if (cfg.param.frond) {
                folder.add(cfg.frondNum, '0').name('一层蕨叶').listen();
                folder.add(cfg.frondNum, '1').name('二层蕨叶').listen();
                folder.add(cfg.frondNum, '2').name('三层蕨叶').listen();
                folder.add(cfg.frondNum, '3').name('四层蕨叶').listen();
            }
            if (cfg.param.squama) {
                folder.add(cfg.squamaNum, '0').name('一层鳞叶').listen();
                folder.add(cfg.squamaNum, '1').name('二层鳞叶').listen();
                folder.add(cfg.squamaNum, '2').name('三层鳞叶').listen();
                folder.add(cfg.squamaNum, '3').name('四层鳞叶').listen();
            }
            if (cfg.param.flower) {
                folder.add(cfg.flowerNum, '0').name('一层花朵').listen();
                folder.add(cfg.flowerNum, '1').name('二层花朵').listen();
                folder.add(cfg.flowerNum, '2').name('三层花朵').listen();
                folder.add(cfg.flowerNum, '3').name('四层花朵').listen();
            }
            folder = prev;
        }
        folder.add(cfg, 'branchRadiusFit').name('树枝拼合').onChange(() => { updateTree(); });

        if (cfg.param.trunk) {
            const trunk = cfg.param.trunk;
            folder = gui.addFolder("树干");
            folder.add(trunk, 'length', 0, 1, 0.01).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'radius', 0, 0.5, 0.001).name('半径系数').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'slices', 3, 30, 1).name('横向分段').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'stacks', 3, 30, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'swing', 0, 1, 0.01).name('摆动系数').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'radiusBegin', 0, 2, 0.05).name('始端半径').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'radiusEnd', 0, 2, 0.05).name('终端半径').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'capType', 0, 3, 1).name('顶盖类型').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'bush', false).name('有否灌木').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'stem', false).name('有否是茎').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'hide', false).name('有否隐藏').listen().onChange(() => { updateTree(); });
            folder.add(trunk, 'apot', false).name('有否花盆').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initTrunk').name('初始').onChange(() => { updateTree(); });
            if (trunk.envelope != undefined) {
                const prev = folder;
                folder = folder.addFolder("包络");
                folder.add(trunk.envelope, 'x', 0, 0.5, 0.01).listen().onChange(() => { updateTree(); });
                folder.add(trunk.envelope, 'y', 0, 10, 1).listen().onChange(() => { updateTree(); });
                folder.add(trunk.envelope, 'z', 0, 50, 0.1).listen().onChange(() => { updateTree(); });
                folder = prev;
            }
            if (trunk.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < trunk.curve.length; i++) {
                    folder.add(trunk.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(trunk.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(trunk.curve[i], 'r', 0, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetTrunkCurve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.branch[0]) {
            const branch = cfg.param.branch[0];
            folder = gui.addFolder("第一层树枝");
            folder.add(branch, 'seed', 1, 100, 1).name('随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'length', 0, 1, 0.02).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radius', 0, 0.1, 0.001).name('半径系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'slices', 3, 30, 1).name('横向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stacks', 3, 30, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'topNum', 0, 10, 1).name('顶部树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideNum', 0, 30, 1).name('周边树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideGrp', 1, 6, 1).name('树枝成组').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusBegin', 0, 2, 0.02).name('始端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusEnd', 0, 2, 0.02).name('终端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleTop', 0, 150, 1).name('顶部角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleSide', 0, 150, 1).name('周边角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenBegin', 0, 2, 0.02).name('始端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenEnd', 0, 2, 0.02).name('终端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenTop', 0, 2, 0.02).name('顶部长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posBegin', 0, 1, 0.02).name('起始位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posEnd', 0, 1, 0.02).name('终止位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'capType', 0, 3, 1).name('顶盖类型').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stem', false).name('是否是茎').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'leaf', false).name('是否有叶').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initBranch0').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeBranch0').name('去除').onChange(() => { updateTree(); });
            if (branch.envelope != undefined) {
                const prev = folder;
                folder = folder.addFolder("包络");
                folder.add(branch.envelope, 'x', 0, 0.5, 0.01).listen().onChange(() => { updateTree(); });
                folder.add(branch.envelope, 'y', 0, 10, 1).listen().onChange(() => { updateTree(); });
                folder.add(branch.envelope, 'z', 0, 50, 0.1).listen().onChange(() => { updateTree(); });
                folder = prev;
            }
            if (branch.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < branch.curve.length; i++) {
                    folder.add(branch.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'r', 0, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetBranch0Curve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.branch[1]) {
            const branch = cfg.param.branch[1];
            folder = gui.addFolder("第二层树枝");
            folder.add(branch, 'seed', 1, 100, 1).name('随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'length', 0, 1, 0.02).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radius', 0, 0.05, 0.001).name('半径系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'slices', 3, 30, 1).name('横向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stacks', 3, 30, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'topNum', 0, 10, 1).name('顶部树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideNum', 0, 30, 1).name('周边树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideGrp', 1, 6, 1).name('树枝成组').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusBegin', 0, 2, 0.02).name('始端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusEnd', 0, 2, 0.02).name('终端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleTop', 0, 120, 1).name('顶部角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleSide', 0, 120, 1).name('周边角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenBegin', 0, 2, 0.02).name('始端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenEnd', 0, 2, 0.02).name('终端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenTop', 0, 2, 0.02).name('顶部长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posBegin', 0, 1, 0.02).name('起始位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posEnd', 0, 1, 0.02).name('终止位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'direction', 0, 3, 1).name('生长方向').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'capType', 0, 3, 1).name('顶盖类型').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stem', false).name('是否是茎').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'leaf', false).name('是否有叶').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initBranch1').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeBranch1').name('去除').onChange(() => { updateTree(); });
            if (branch.envelope != undefined) {
                const prev = folder;
                folder = folder.addFolder("包络");
                folder.add(branch.envelope, 'x', 0, 0.5, 0.01).listen().onChange(() => { updateTree(); });
                folder.add(branch.envelope, 'y', 0, 10, 1).listen().onChange(() => { updateTree(); });
                folder.add(branch.envelope, 'z', 0, 50, 0.1).listen().onChange(() => { updateTree(); });
                folder = prev;
            }
            if (branch.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < branch.curve.length; i++) {
                    folder.add(branch.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'r', 0, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetBranch1Curve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.branch[2]) {
            const branch = cfg.param.branch[2];
            folder = gui.addFolder("第三层树枝");
            folder.add(branch, 'seed', 1, 100, 1).name('随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'length', 0, 1, 0.02).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radius', 0, 0.025, 0.0005).name('半径系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'slices', 3, 30, 1).name('横向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stacks', 2, 30, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'topNum', 0, 10, 1).name('顶部树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideNum', 0, 30, 1).name('周边树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideGrp', 1, 6, 1).name('树枝成组').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusBegin', 0, 2, 0.02).name('始端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusEnd', 0, 2, 0.02).name('终端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleTop', 0, 120, 1).name('顶部角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleSide', 0, 120, 1).name('周边角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenBegin', 0, 2, 0.02).name('始端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenEnd', 0, 2, 0.02).name('终端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenTop', 0, 2, 0.02).name('顶部长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posBegin', 0, 1, 0.02).name('起始位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posEnd', 0, 1, 0.02).name('终止位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'direction', 0, 3, 1).name('生长方向').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'capType', 0, 3, 1).name('顶盖类型').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stem', false).name('是否是茎').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'leaf', false).name('是否有叶').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initBranch2').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeBranch2').name('去除').onChange(() => { updateTree(); });
            if (branch.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < branch.curve.length; i++) {
                    folder.add(branch.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'r', 0, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetBranch2Curve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.branch[3]) {
            const branch = cfg.param.branch[3];
            folder = gui.addFolder("第四层树枝");
            folder.add(branch, 'seed', 1, 100, 1).name('随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'length', 0, 1, 0.02).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radius', 0, 0.02, 0.0002).name('半径系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'slices', 3, 30, 1).name('横向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stacks', 1, 30, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'topNum', 0, 10, 1).name('顶部树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideNum', 0, 30, 1).name('周边树枝').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sideGrp', 1, 6, 1).name('树枝成组').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusBegin', 0, 2, 0.02).name('始端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'radiusEnd', 0, 2, 0.02).name('终端半径').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleTop', 0, 120, 1).name('顶部角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'angleSide', 0, 120, 1).name('周边角度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenBegin', 0, 2, 0.02).name('始端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenEnd', 0, 2, 0.02).name('终端长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'lenTop', 0, 2, 0.02).name('顶部长度').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posBegin', 0, 1, 0.02).name('起始位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'posEnd', 0, 1, 0.02).name('终止位置').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'direction', 0, 3, 1).name('生长方向').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'capType', 0, 3, 1).name('顶盖类型').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'stem', false).name('是否是茎').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'leaf', false).name('是否有叶').listen().onChange(() => { updateTree(); });
            folder.add(branch, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initBranch3').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeBranch3').name('去除').onChange(() => { updateTree(); });
            if (branch.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < branch.curve.length; i++) {
                    folder.add(branch.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(branch.curve[i], 'r', 0, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetBranch3Curve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.leaf) {
            const leaf = cfg.param.leaf;
            folder = gui.addFolder("树叶");
            folder.add(leaf, 'length', 0.01, 0.2, 0.001).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'width', 0.01, 0.2, 0.001).name('宽度系数').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'slices', 1, 4, 1).name('横向分段').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'stacks', 1, 20, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'swing', 0, 2, 0.05).name('摆动系数').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'uvScale', 1, 60, 1).name('UV缩放').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'topNum', 0, 60, 1).name('顶部树叶').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'sideNum', 0, 60, 1).name('周边树叶').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'group', 1, 4, 1).name('成组数量').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'posRand', 0, 1, 0.05).name('位置随机').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'angleRand', 0, 30, 1).name('角度随机').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'direction', 0, 3, 1).name('生长方向').listen().onChange(() => { updateTree(); });
            folder.add(leaf.angle, 'x', 0, 360, 10).name('旋转角度x').listen().onChange(() => { updateTree(); });
            folder.add(leaf.angle, 'y', 0, 360, 10).name('旋转角度y').listen().onChange(() => { updateTree(); });
            folder.add(leaf.angle, 'z', 0, 360, 10).name('旋转角度z').listen().onChange(() => { updateTree(); });
            folder.add(leaf, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initLeaf').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeLeaf').name('去除').onChange(() => { updateTree(); });
            if (leaf.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < leaf.curve.length; i++) {
                    folder.add(leaf.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(leaf.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(leaf.curve[i], 'r', 0, 1, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetLeafCurve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.frond) {
            const frond = cfg.param.frond;
            folder = gui.addFolder("蕨叶");
            folder.add(frond, 'seed', 1, 100, 1).name('随机').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'length', 0, 1, 0.02).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'width', 0, 0.5, 0.001).name('宽度系数').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'stacks', 1, 30, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'swing', 0, 2, 0.05).name('摆动系数').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'soft', 0, 2, 0.02).name('柔软系数').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'topNum', 0, 50, 1).name('顶部蕨叶').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'sideNum', 0, 200, 1).name('周边蕨叶').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'sideGrp', 1, 6, 1).name('蕨叶成组').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'stemRadius', 0, 0.1, 0.001).name('茎部半径').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'angleTop', 0, 120, 5).name('顶部角度').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'angleSide', 0, 120, 5).name('周边角度').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'angleRand', 0, 120, 5).name('角度随机').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'angleFace', -80, 80, 5).name('叶面角度').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'posBegin', 0, 1, 0.02).name('起始位置').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'posEnd', 0, 1, 0.02).name('终止位置').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'willow', false).name('柳叶模式').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'onlyTop', false).name('仅顶部有').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'haveStem', false).name('包含茎部').listen().onChange(() => { updateTree(); });
            folder.add(frond, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initFrond').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeFrond').name('去除').onChange(() => { updateTree(); });
            if (frond.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < frond.curve.length; i++) {
                    folder.add(frond.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(frond.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(frond.curve[i], 'r', -2, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetFrondCurve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.squama) {
            const squama = cfg.param.squama;
            folder = gui.addFolder("鳞叶");
            folder.add(squama, 'seed', 1, 100, 1).name('随机').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'length', 0, 1, 0.02).name('长度系数').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'width', 0, 0.5, 0.001).name('宽度系数').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'stacks', 1, 30, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'swing', 0, 2, 0.05).name('摆动系数').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'soft', 0, 2, 0.02).name('柔软系数').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'topNum', 0, 50, 1).name('顶部鳞叶').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'sideNum', 0, 50, 1).name('周边鳞叶').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'sideGrp', 1, 6, 1).name('鳞叶成组').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'angleTop', 0, 120, 5).name('顶部角度').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'angleSide', 0, 120, 5).name('周边角度').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'angleRand', 0, 120, 5).name('角度随机').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'angleFace', -80, 80, 5).name('叶面角度').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'posBegin', 0, 1, 0.02).name('起始位置').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'posEnd', 0, 1, 0.02).name('终止位置').listen().onChange(() => { updateTree(); });
            folder.add(squama, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initSquama').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeSquama').name('去除').onChange(() => { updateTree(); });
            if (squama.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < squama.curve.length; i++) {
                    folder.add(squama.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(squama.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(squama.curve[i], 'r', 0, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetSquamaCurve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }

        if (cfg.param.flower) {
            const flower = cfg.param.flower;
            folder = gui.addFolder("花朵");
            folder.add(flower, 'radius', 0.001, 0.1, 0.00001).name('半径系数').listen().onChange(() => { updateTree(); });
            if (flower.complex)
                folder.add(flower, 'width', 0.0001, 0.01, 0.00001).name('宽度系数').listen().onChange(() => { updateTree(); });
            else folder.add(flower, 'width', 0.001, 0.1, 0.00001).name('宽度系数').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'stacks', 1, 20, 1).name('纵向分段').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'petal', 1, 30, 1).name('花瓣数量').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'layer', 1, 10, 1).name('花瓣层数').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'swing', 0, 2, 0.05).name('摆动系数').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'cone', 0, 1, 0.01).name('锥度系数').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'topNum', 0, 1, 1).name('顶部花朵').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'sideNum', 0, 60, 1).name('周边花朵').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'sizeRand', 0, 0.5, 0.05).name('尺寸随机').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'group', 1, 4, 1).name('成组数量').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'posRand', 0, 1, 0.05).name('位置随机').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'angleFace', -90, 90, 1).name('花瓣角度').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'angleOpen', -90, 90, 1).name('开放角度').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'angleRand', 0, 30, 1).name('角度随机').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'direction', 0, 3, 1).name('生长方向').listen().onChange(() => { updateTree(); });
            folder.add(flower.angle, 'x', 0, 360, 5).name('旋转角度x').listen().onChange(() => { updateTree(); });
            folder.add(flower.angle, 'y', 0, 360, 5).name('旋转角度y').listen().onChange(() => { updateTree(); });
            folder.add(flower.angle, 'z', 0, 360, 5).name('旋转角度z').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'complex', false).name('复杂花形').listen().onChange(() => { updateTree(); });
            folder.add(flower, 'sphere', false).name('是否圆球').listen().onChange(() => { updateTree(); });
            folder.add(cfg, 'initFlower').name('初始').onChange(() => { updateTree(); });
            folder.add(cfg, 'removeFlower').name('去除').onChange(() => { updateTree(); });
            if (flower.curve != undefined) {
                const prev = folder;
                folder = folder.addFolder("曲线");
                for (let i = 0; i < flower.curve.length; i++) {
                    folder.add(flower.curve[i], 'x', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(flower.curve[i], 'z', -1, 1, 0.01).listen().onChange(() => { updateTree(); });
                    folder.add(flower.curve[i], 'r', 0, 2, 0.01).listen().onChange(() => { updateTree(); });
                }
                folder.add(cfg, 'resetFlowerCurve').name('重置').onChange(() => { updateTree(); });
                folder = prev;
            }
        }
    }

    /**
     * @internal
     * @param mesh 
     * @param out 
     */
    protected _getMeshDefine(mesh: Mesh, out: Array<ShaderDefine>): number {
        return super._getMeshDefine(mesh, out);
    }

    protected _changeVertexDefine(mesh: Mesh) {
        super._changeVertexDefine(mesh);
    }

    protected _changeMorphData(mesh: Mesh) {
        super._changeMorphData(mesh);
    }

    _renderUpdate(context: RenderContext3D, transform: Transform3D): void
    {
        super._renderUpdate(context, transform);
        
        if(this.treeEdit && this.treeEdit.UpdateState != false)
		{
			this.treeEdit.everyFrame(context.camera.transform.position);
			this.treeEdit.tree.renderCamera(); 
			this.owner.getComponent(MeshFilter).sharedMesh = this.treeEdit.tree.renderNode.mesh.clone();
			this.owner.getComponent(MeshRenderer).sharedMaterial = this.treeEdit.tree.renderNode.material.clone();
			console.log("loop func!!!");
		}
    }

    _needRender(boundFrustum: BoundFrustum, context: RenderContext3D): boolean {
        return true;
    }

    protected _onDestroy() {
        super._onDestroy();
    }

    _cloneTo(dest: Component): void {
        super._cloneTo(dest);
    }

    _onMeshChange(mesh: Mesh): void {
        super._onMeshChange(mesh);
    }

    _revertBatchRenderUpdate(context: RenderContext3D): void {
        super._revertBatchRenderUpdate(context);
    }

    public loadCfg(path : string)
    {
        TreeTestRender.confFilePath = path;
    }

    saveCfg()
    {

    }
    
}