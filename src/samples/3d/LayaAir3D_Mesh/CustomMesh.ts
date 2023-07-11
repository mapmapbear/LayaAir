import { Laya, render } from "Laya";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { DirectionLight } from "laya/d3/core/light/DirectionLight";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { PixelLineSprite3D } from "laya/d3/core/pixelLine/PixelLineSprite3D";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Event } from "laya/events/Event";
import { Color } from "laya/maths/Color";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Vector3 } from "laya/maths/Vector3";
import { Button } from "laya/ui/Button";
import { Browser } from "laya/utils/Browser";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Laya3D } from "Laya3D";
import Client from "../../Client";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { Tool } from "../common/Tool";
import { RenderTexture } from "laya/resource/RenderTexture";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { Utils3D } from "laya/d3/utils/Utils3D";
import { DepthTextureMode } from "laya/d3/depthMap/DepthPass";
import { TreeTestRender } from "laya/d3/component/Volume/TreeRender/TreeTestRender";

/**
 * ...
 * @author
 */
export class CustomMesh {

	private sprite3D: Sprite3D;
	private lineSprite3D: Sprite3D;

	/**实例类型*/
	private btype:any = "CustomMesh";
	/**场景内按钮类型*/
	private stype:any = 0;
	private changeActionButton:Button;

	constructor() {
		Laya3D.init(0, 0);
		Laya.stage.scaleMode = Stage.SCALE_FULL;
		Laya.stage.screenMode = Stage.SCREEN_NONE;
		Stat.show();

		var scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));

		var camera: Camera = (<Camera>scene.addChild(new Camera(0, 0.1, 100)));
		camera.transform.translate(new Vector3(0, 2, 5));
		camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
		camera.addComponent(CameraMoveScript);
		camera.clearColor = new Color(0.2, 0.2, 0.2, 1.0);

		var box = (<MeshSprite3D>scene.addChild(new MeshSprite3D(PrimitiveMesh.createBox(0.75, 0.75, 0.75))));

		var directionLight: DirectionLight = (<DirectionLight>scene.addChild(new DirectionLight()));
		//设置平行光的方向
		var mat: Matrix4x4 = directionLight.transform.worldMatrix;
		mat.setForward(new Vector3(-1.0, -1.0, -1.0));
		directionLight.transform.worldMatrix = mat;

		this.sprite3D = (<Sprite3D>scene.addChild(new Sprite3D()));
		this.lineSprite3D = (<Sprite3D>scene.addChild(new Sprite3D()));

		var spr = (<Sprite3D>scene.addChild(new Sprite3D()));
		var render = spr.addComponent(TreeTestRender);
		render.loadCfg("res/tree/tree.json");
		
		this.lineSprite3D.active = false;
		this.loadUI();
	}

	private curStateIndex: number = 0;

	private loadUI(): void {

		Laya.loader.load(["res/threeDimen/ui/button.png"], Handler.create(this, function (): void {

			this.changeActionButton = Laya.stage.addChild(new Button("res/threeDimen/ui/button.png", "正常模式"));
			this.changeActionButton.size(160, 40);
			this.changeActionButton.labelBold = true;
			this.changeActionButton.labelSize = 30;
			this.changeActionButton.sizeGrid = "4,4,4,4";
			this.changeActionButton.scale(Browser.pixelRatio, Browser.pixelRatio);
			this.changeActionButton.pos(Laya.stage.width / 2 - this.changeActionButton.width * Browser.pixelRatio / 2, Laya.stage.height - 100 * Browser.pixelRatio);
			this.changeActionButton.on(Event.CLICK, this, this.stypeFun0);
		}));
	}

	stypeFun0(label:string = "正常模式"): void {
		if (++this.curStateIndex % 2 == 1) {
			this.sprite3D.active = false;
			this.lineSprite3D.active = true;
			this.changeActionButton.label = "网格模式";
		} else {
			this.sprite3D.active = true;
			this.lineSprite3D.active = false;
			this.changeActionButton.label = "正常模式";
		}
		label = this.changeActionButton.label;
		Client.instance.send({type:"next",btype:this.btype,stype:0,value:label});	
	}
}

