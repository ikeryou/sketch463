import { Mesh, Object3D, PlaneGeometry, ShaderMaterial, Vector2 } from "three";
import { Canvas, CanvasConstructor } from "../webgl/canvas";
import { Util } from "../libs/util";
import { Func } from "../core/func";
import { Capture } from "../webgl/capture";
import { ImgEffectShader } from "../glsl/imgEffectShader";
import { Conf } from "../core/conf";
import { Item } from "./item";
import Delaunator from "delaunator";
import { MousePointer } from "../core/mousePointer";

export class ImgEffect extends Canvas {
  private _con: Object3D
  private _mesh: Array<Mesh> = []

  // ベース映像作成用
  private _blockCon: Object3D
  private _item: Array<Item> = []

  private _texNum:number = Func.val(50, 100)
  private _cap: Array<Capture> = []
  private _renderCnt: number = 0

  constructor(opt: CanvasConstructor) {
    super(opt)

    this._con = new Object3D()
    this.mainScene.add(this._con)

    this._blockCon = new Object3D()

    for(let i = 0; i < this._texNum; i++) {
      this._cap.push(new Capture())
    }

    const sw = 1
    const sh = 1

    const t:Array<Array<number>> = [];
    // t.push([-sw * 0.5, sh * 0.5]);
    // t.push([sw * 0.5, sh * 0.5]);
    // t.push([sw * 0.5, -sh * 0.5]);
    // t.push([-sw * 0.5, -sh * 0.5]);

    const triNum = 100;
    for(let l = 0; l < triNum; l++) {
      t.push([Util.random(-sw * 0.5, sw * 0.5), Util.random(-sh * 0.5, sh * 0.5)]);
    }
    const r = Delaunator.from(t);

    const tri = r.triangles
    let i = 0
    while(i < tri.length) {
      const a = tri[i + 0]
      const b = tri[i + 1]
      const c = tri[i + 2]
      const item = new Item(
        i / 3,
        new Vector2(t[a][0], t[a][1]),
        new Vector2(t[b][0], t[b][1]),
        new Vector2(t[c][0], t[c][1]),
      );
      this._blockCon.add(item);
      this._item.push(item);
      i += 3
    }

    this._renderCnt = 0
    this._makeMesh()
    this._resize()
  }


  private _makeMesh(): void {
    for(let i = 0; i < this._texNum; i++) {
      const m = new Mesh(
        new PlaneGeometry(1, 1),
        new ShaderMaterial({
          vertexShader:ImgEffectShader.vertexShader,
          fragmentShader:ImgEffectShader.fragmentShader,
          transparent:true,
          uniforms:{
            range:{value:new Vector2(i * (1 / this._texNum), (i + 1) * (1 / this._texNum))},
            size:{value:2},
            time:{value:0},
            ang:{value:0},
            tex:{value:this._cap[(i + this._renderCnt) % this._texNum].texture()},
          }
        })
      )
      this._con.add(m)
      this._mesh.push(m)
    }
  }


  protected _update(): void {
    super._update()

    this._mesh.forEach((m:any, i:number) => {
      const s = Math.max(this.renderSize.width, this.renderSize.height) * Func.val(1, 1)
      m.scale.set(s, s, 1)

      this._setUni(m, 'size', 9)
      this._setUni(m, 'time', this._c * 0.5)

      this._setUni(m, 'ang', Util.radian(0))
      this._setUni(m, 'tex', this._cap[(((this._texNum - 1) - i) + this._renderCnt) % this._texNum].texture())
    })

    this._con.add(this._blockCon)


    const s = Math.min(Func.sw(), Func.sh()) * Func.val(1, 0.85)
    this._blockCon.scale.set(s, s, 1)

    let mx = MousePointer.instance.easeNormal.x * -50
    let my = MousePointer.instance.easeNormal.y * 50

    const radian = Util.radian(this._c * 2)
    const radius = Math.max(Func.sh(), Func.sw()) * 0.075
    mx += Math.sin(radian) * radius
    my += Math.cos(radian * -1.2) * radius

    this._blockCon.position.x = mx
    this._blockCon.position.y = my

    const kake = 1
    this._blockCon.rotation.y = Util.radian(mx * -kake)
    this._blockCon.rotation.z = Util.radian(my * kake)


    // ベース映像のレンダリング
    if(this._c % 1 == 0) {
      const cap = this._cap[this._renderCnt % this._texNum]
      cap.add(this._blockCon)

      this.renderer.setClearColor(0x000000, 1)
      cap.render(this.renderer, this.cameraPers)
      if(this._c % 1 == 0) this._renderCnt++
    }

    this.renderer.setClearColor(0x000000, 1)
    this.renderer.render(this.mainScene, this.cameraPers)
  }


  protected _resize(): void {
    super._resize()

    if(Conf.IS_SP) {
      if(Func.sw() === this.renderSize.width) {
        return
      }
    }

    const w = Func.sw()
    const h = Func.sh()

    this.renderSize.width = w
    this.renderSize.height = h

    let pixelRatio: number = window.devicePixelRatio || 1
    this._cap.forEach((c:Capture) => {
      c.setSize(w * 1, h * 1, pixelRatio)
    })

    this.cameraPers.fov = Func.val(30, 30)

    this._updateOrthCamera(this.cameraOrth, w, h)
    this._updatePersCamera(this.cameraPers, w, h)

    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(w, h)
    // this.renderer.clear()
  }
}
