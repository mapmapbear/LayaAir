import { Config3D } from "Config3D";
import { Laya } from "Laya";
import { Animator } from "laya/d3/component/Animator";
import { Camera } from "laya/d3/core/Camera";
import { DirectionLight } from "laya/d3/core/light/DirectionLight";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Vector3 } from "laya/d3/math/Vector3";
import { Stage } from "laya/display/Stage";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Laya3D } from "Laya3D";
import { CameraMoveScript } from "../common/CameraMoveScript";
/**
 * ...
 * @author
 */
export class SkinAnimationPerformance {
    constructor() {
        this.curStateIndex = 0;
        this.clipName = ["idle", "fallingback", "idle", "walk", "Take 001"];
        var c = new Config3D();
        //c.debugFrustumCulling = true;
        Laya3D.init(0, 0, c);
        Laya.stage.scaleMode = Stage.SCALE_FULL;
        Laya.stage.screenMode = Stage.SCREEN_NONE;
        Stat.show();
        var scene = Laya.stage.addChild(new Scene3D());
        var camera = (scene.addChild(new Camera(0, 0.1, 1000)));
        camera.transform.translate(new Vector3(0, 1.5, 4));
        camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
        camera.addComponent(CameraMoveScript);
        var directionLight = scene.addChild(new DirectionLight());
        directionLight.transform.worldMatrix.setForward(new Vector3(-1.0, -1.0, -1.0));
        directionLight.color = new Vector3(1, 1, 1);
        Sprite3D.load("res/threeDimen/skinModel/Zombie/Plane.lh", Handler.create(null, function (plane) {
            scene.addChild(plane);
        }));
        //Sprite3D.load("test/Conventional/monkey.lh", Handler.create(null, function(zombie:Sprite3D):void {
        //Sprite3D.load("test/monkey.lh", Handler.create(null, function(zombie:Sprite3D):void {
        Sprite3D.load("res/threeDimen/skinModel/Zombie/Zombie.lh", Handler.create(null, function (zombie) {
            for (var i = 0; i < 200; i++) {
                zombie = zombie.clone();
                zombie.transform.localPosition = new Vector3(i * 0.04 - 4.0, 0, 0);
                scene.addChild(zombie);
                this.zombieAnimator = zombie.getChildAt(0).getComponent(Animator); //获取Animator动画组件
            }
        }));
    }
}
