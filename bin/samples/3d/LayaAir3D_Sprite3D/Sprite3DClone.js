import { Laya3D } from "Laya3D";
import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Vector3 } from "laya/d3/math/Vector3";
import { Stage } from "laya/display/Stage";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
export class Sprite3DClone {
    constructor() {
        //初始化引擎
        Laya3D.init(0, 0);
        Laya.stage.scaleMode = Stage.SCALE_FULL;
        Laya.stage.screenMode = Stage.SCREEN_NONE;
        //显示性能面板
        Stat.show();
        this.scene = Laya.stage.addChild(new Scene3D());
        this.scene.ambientColor = new Vector3(1, 1, 1);
        var camera = this.scene.addChild(new Camera(0, 0.1, 100));
        camera.transform.translate(new Vector3(0, 0.5, 1));
        camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
        Laya.loader.create("res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh", Handler.create(this, this.onComplete));
    }
    onComplete() {
        var layaMonkey = this.scene.addChild(Loader.getRes("res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh"));
        //克隆sprite3d
        var layaMonkey_clone1 = Sprite3D.instantiate(layaMonkey, this.scene, false, new Vector3(0.6, 0, 0));
        //克隆sprite3d
        var layaMonkey_clone2 = this.scene.addChild(Sprite3D.instantiate(layaMonkey, null, false, new Vector3(-0.6, 0, 0)));
    }
}
