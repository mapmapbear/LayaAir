import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { Box } from "laya/ui/Box";
import { List } from "laya/ui/List";
import { Handler } from "laya/utils/Handler";
import { WebGL } from "laya/webgl/WebGL";
export class UI_List {
    constructor(maincls) {
        this.Main = null;
        this.Main = maincls;
        // 不支持WebGL时自动切换至Canvas
        Laya.init(800, 600, WebGL);
        Laya.stage.alignV = Stage.ALIGN_MIDDLE;
        Laya.stage.alignH = Stage.ALIGN_CENTER;
        Laya.stage.scaleMode = Stage.SCALE_SHOWALL;
        Laya.stage.bgColor = "#232628";
        this.setup();
    }
    setup() {
        var list = new List();
        list.itemRender = Item;
        list.repeatX = 1;
        list.repeatY = 4;
        list.x = (Laya.stage.width - Item.WID) / 2;
        list.y = (Laya.stage.height - Item.HEI * list.repeatY) / 2;
        // 使用但隐藏滚动条
        list.vScrollBarSkin = "";
        list.scrollBar.elasticBackTime = 0;
        list.scrollBar.elasticDistance = 0;
        list.selectEnable = true;
        list.selectHandler = new Handler(this, this.onSelect);
        list.renderHandler = new Handler(this, this.updateItem);
        this.Main.box2D.addChild(list);
        //			list.mouseHandler = new Handler(this,onMuseHandler);
        // 设置数据项为对应图片的路径
        var data = [];
        for (var i = 0; i < 10; ++i) {
            data.push("res/ui/listskins/1.jpg");
            data.push("res/ui/listskins/2.jpg");
            data.push("res/ui/listskins/3.jpg");
            data.push("res/ui/listskins/4.jpg");
            data.push("res/ui/listskins/5.jpg");
        }
        list.array = data;
        this._list = list;
    }
    onMuseHandler(type, index) {
        console.log("type:" + type.type + "ddd--" + this._list.scrollBar.value + "---index:" + index);
        var curX, curY;
        if (type.type == "mousedown") {
            this._oldY = Laya.stage.mouseY;
            var itemBox = this._list.getCell(index);
            this._itemHeight = itemBox.height;
        }
        else if (type.type == "mouseout") {
            curY = Laya.stage.mouseY;
            var chazhiY = Math.abs(curY - this._oldY);
            var tempIndex = Math.ceil(chazhiY / this._itemHeight);
            console.log("----------tempIndex:" + tempIndex + "---_itemHeight:" + this._itemHeight + "---chazhiY:" + chazhiY);
            var newIndex;
            //				if(curY > _oldY)
            //				{
            //					//向下
            //					newIndex = index + tempIndex;
            //					_list.tweenTo(newIndex);
            //				}else
            //				{
            //					//向上
            //					newIndex = index - tempIndex;
            //					_list.tweenTo(newIndex);
            //				}
        }
    }
    updateItem(cell, index) {
        cell.setImg(cell.dataSource);
    }
    onSelect(index) {
        console.log("当前选择的索引：" + index);
    }
}
import { Image } from "laya/ui/Image";
class Item extends Box {
    constructor(maincls) {
        super();
        this.size(Item.WID, Item.HEI);
        this.img = new Image();
        this.addChild(this.img);
    }
    setImg(src) {
        this.img.skin = src;
    }
}
Item.WID = 373;
Item.HEI = 85;
