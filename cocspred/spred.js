/*
 * Created by aimozg on 27.07.2017.
 * Confidential until published on GitHub
 */
///<reference path="typings/jquery.d.ts"/>
var spred;
(function (spred) {
    const basedir = window['spred_basedir'] || '../../';
    /*
    function mkimg(colors: string[][]): HTMLCanvasElement {
        const hex     = {a: 10, b: 11, c: 12, d: 13, e: 14, f: 15, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15};
        let canvas    = document.createElement('canvas');
        let w         = colors[0].length;
        let h         = colors.length;
        canvas.width  = w;
        canvas.height = h;
        let c2d       = canvas.getContext('2d');
        let id        = c2d.getImageData(0, 0, w, h);
        let px        = id.data;
        let i         = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let rgb    = colors[y][x];
                let r: any = rgb.charAt(0), g: any = rgb.charAt(1), b: any = rgb.charAt(2);
                r          = hex[r] || +r;
                g          = hex[g] || +g;
                b          = hex[b] || +b;
                px[i++]    = (r << 4) | r;
                px[i++]    = (g << 4) | g;
                px[i++]    = (b << 4) | b;
                px[i++]    = 0xff;
            }
        }
        c2d.putImageData(id, 0, 0);
        return canvas;
    }
    */
    function $new(selector = 'div', ...content) {
        let ss = selector.split(/\./);
        let tagName = ss[0] || 'div';
        let d = document.createElement(tagName);
        d.className = ss.slice(1).join(' ');
        if (tagName == 'button')
            d.type = 'button';
        if (tagName == 'a')
            d.href = 'javascript:void(0)';
        return $(d).append(content);
    }
    spred.$new = $new;
    function newCanvas(width, height, code = () => { }) {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        code(canvas.getContext('2d'));
        return canvas;
    }
    spred.newCanvas = newCanvas;
    class Composite {
        constructor(model, visibleNames = [], zoom = 1) {
            this.model = model;
            this._layers = [];
            this.canvas = newCanvas(model.width * zoom, model.height * zoom);
            this.layers = visibleNames.slice(0);
            this.redraw();
        }
        get layers() {
            return this.model.layerNames.filter(ln => this._layers.indexOf(ln) >= 0);
        }
        set layers(value) {
            this._layers.splice(0, this._layers.length);
            this._layers.push(...value.filter(l => l in this.model.layers));
        }
        redraw(x = 0, y = 0, w = this.model.width, h = this.model.height) {
            let ctx2d = this.canvas.getContext('2d');
            ctx2d.imageSmoothingEnabled = false;
            let z = this.zoom;
            ctx2d.clearRect(x * z, y * z, w * z, h * z);
            for (let a = this.model.layerNames, i = a.length - 1; i >= 0; i--) {
                let lname = a[i];
                if (this._layers.indexOf(lname) >= 0)
                    ctx2d.drawImage(this.model.layers[lname].canvas, x, y, w, h, x * z, y * z, w * z, h * z);
            }
        }
        hideAll(name) {
            this._layers.splice(0, this._layers.length);
        }
        isVisible(layerName) {
            return this._layers.indexOf(layerName) >= 0;
        }
        setVisible(layerName, visibility) {
            let i = this._layers.indexOf(layerName);
            if (visibility && i == -1)
                this._layers.push(layerName);
            else if (!visibility && i >= 0)
                this._layers.splice(i, 1);
        }
        get zoom() {
            return this.canvas.width / this.model.width;
        }
        set zoom(value) {
            value = Math.max(1, value | 0);
            this.canvas.width = this.model.width * value;
            this.canvas.height = this.model.height * value;
            this.redraw();
        }
    }
    spred.Composite = Composite;
    class Layer {
        constructor(name, width, height, src, srcX, srcY) {
            this.name = name;
            this.width = width;
            this.height = height;
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.ctx2d = this.canvas.getContext('2d');
            this.ctx2d.drawImage(src, srcX, srcY, width, height, 0, 0, width, height);
        }
    }
    spred.Layer = Layer;
    class Spritesheet {
        constructor(modeldir, src) {
            this.sprites = {};
            let x = $(src);
            this.cellwidth = +x.attr('cellwidth');
            this.cellheight = +x.attr('cellheight');
            this.sprites = {};
            this.whenLoaded = new Promise((resolve, reject) => {
                let positions = {};
                x.children("row").each((i, row) => {
                    let names = row.textContent.split(',');
                    for (let j = 0; j < names.length; j++) {
                        if (names[j])
                            positions[names[j]] = [this.cellwidth * j, this.cellheight * i];
                    }
                });
                let img = document.createElement('img');
                img.onload = (e) => {
                    Object.keys(positions)
                        .forEach(key => {
                        this.sprites[key] = new Layer(key, this.cellheight, this.cellwidth, img, positions[key][0], positions[key][1]);
                    });
                    this.img = img;
                    resolve(this);
                };
                img.src = modeldir + x.attr('file');
            });
        }
        isLoaded() {
            return this.img != null;
        }
    }
    spred.Spritesheet = Spritesheet;
    class Model {
        constructor(src) {
            this.layers = {};
            this.layerNames = [];
            this.colorkeys = [];
            let xmodel = $(src).children('model');
            this.name = xmodel.attr('name');
            this.dir = basedir + xmodel.attr('dir');
            this.width = parseInt(xmodel.attr('width'));
            this.height = parseInt(xmodel.attr('height'));
            this.spritesheets = [];
            this.palettes = {
                common: {}
            };
            xmodel.find('colorkeys>key').each((i, e) => {
                this.colorkeys[e.getAttribute('src')] = {
                    src: e.getAttribute('src'),
                    base: e.getAttribute('base'),
                    transform: e.getAttribute('transform') || ''
                };
            });
            //noinspection CssInvalidHtmlTagReference
            xmodel.find('palette>common>color').each((i, e) => {
                this.palettes.common[e.getAttribute('name')] = e.textContent;
            });
            xmodel.find('spritesheet').each((i, x) => {
                let spritesheet = new Spritesheet(this.dir, x);
                this.spritesheets.push(spritesheet);
            });
            xmodel.find('layer').each((i, x) => {
                let ln = x.getAttribute('file');
                if (this.layerNames.indexOf(ln) < 0)
                    this.layerNames.push(ln);
            });
            this.whenLoaded =
                Promise.all(this.spritesheets.map(p => p.whenLoaded)).then(() => {
                    for (let ss of this.spritesheets) {
                        for (let sname in ss.sprites) {
                            this.layers[sname] = ss.sprites[sname];
                        }
                    }
                    return this;
                });
        }
        putPixel(x, y, color) {
            let l = getSelLayer();
            if (!l)
                return;
            let ctx = l.ctx2d;
            if (!color) {
                ctx.clearRect(x, y, 1, 1);
            }
            else {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        isLoaded() {
            return this.spritesheets.every(s => s.isLoaded());
        }
    }
    spred.Model = Model;
    spred.g_composites = [];
    spred.g_sellayer = '';
    spred.defaultLayerList = [
        'eyes2M', 'hair0f', 'ears0', 'face0',
        'breasts0', 'arm0f', 'legs0', 'torso0', 'arm0b'
    ];
    function updateCompositeLayers(composite) {
        let j = composite.ui.find('.LayerBadges').html('');
        for (let ln of composite.model.layerNames) {
            let b = $new('button.badge' +
                (composite.isVisible(ln) ? '.badge-primary' : '.badge-default'), ln);
            b.click(() => {
                b.toggleClass('badge-primary');
                b.toggleClass('badge-default');
                composite.setVisible(ln, !composite.isVisible(ln));
                composite.redraw();
            });
            j.append(b, ' ');
        }
    }
    spred.updateCompositeLayers = updateCompositeLayers;
    function addCompositeView(layers, zoom = 1) {
        let composite = new Composite(spred.g_model, layers, zoom);
        $('#ViewList').append(composite.ui = $new('.card.card-secondary.d-inline-flex', $new('.card-block', $new('h5.card-title', $new('button.ctrl.text-danger.pull-right', $new('span.fa.fa-close')).click(() => {
            removeCompositeView(composite);
        }), $new('button.ctrl', $new('span.fa.fa-search-plus')).click(() => {
            composite.zoom++;
        }), $new('button.ctrl', $new('span.fa.fa-search-minus')).click(() => {
            composite.zoom--;
        })), $new('div', $new('.canvas', composite.canvas)), $new('label', 'Layers:'), $new('.LayerBadges')
        /*$new('textarea.col.form-control'
        ).val(layers.join(', ')
        ).on('input change', e => {
            composite.layers = (e.target as HTMLTextAreaElement).value.split(/, *!/);
            composite.redraw();
        })*/
        )));
        let drawing = false;
        let dirty = false;
        let x0 = spred.g_model.width, y0 = spred.g_model.height, x1 = -1, y1 = -1;
        let color = null;
        function putPixel(cx, cy) {
            let x = (cx / composite.zoom) | 0;
            let y = (cy / composite.zoom) | 0;
            dirty = true;
            spred.g_model.putPixel(x, y, color);
            composite.redraw(x, y, 1, 1);
            if (x < x0)
                x0 = x;
            if (x > x1)
                x1 = x;
            if (y < y0)
                y0 = y;
            if (y > y1)
                y1 = y;
        }
        $(composite.canvas).mousedown(e => {
            let action = $('[name=lmb-action]:checked').val();
            let keycolors = $('#lmb-color');
            switch (action) {
                case 'nothing':
                    return;
                case 'erase':
                    color = null;
                    break;
                case 'keycolor':
                    color = keycolors.val();
                    break;
            }
            drawing = true;
            putPixel(e.offsetX, e.offsetY);
        }).mousemove(e => {
            if (drawing) {
                putPixel(e.offsetX, e.offsetY);
            }
        }).on('mouseup mouseout', e => {
            drawing = false;
            if (dirty)
                redrawAll(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
            dirty = false;
        });
        spred.g_composites.push(composite);
        updateCompositeLayers(composite);
        return composite;
    }
    spred.addCompositeView = addCompositeView;
    function removeCompositeView(composite) {
        let i = spred.g_composites.indexOf(composite);
        if (i < 0)
            return;
        spred.g_composites.splice(i, 1);
        composite.ui.remove();
    }
    spred.removeCompositeView = removeCompositeView;
    function redrawAll(x = 0, y = 0, w = spred.g_model.width, h = spred.g_model.height) {
        for (let obj of spred.g_composites) {
            obj.redraw(x, y, w, h);
        }
    }
    spred.redrawAll = redrawAll;
    function swapLayers(a, b) {
        let l0 = spred.g_model.layerNames[a];
        spred.g_model.layerNames[a] = spred.g_model.layerNames[b];
        spred.g_model.layerNames[b] = l0;
        showLayerList(spred.g_model);
        redrawAll();
    }
    spred.swapLayers = swapLayers;
    function showLayerList(model) {
        let list = $('#LayerList');
        for (let ln of model.layerNames)
            model.layers[ln].ui.detach().appendTo(list);
    }
    function getSelLayer() {
        return spred.g_model.layers[spred.g_sellayer];
    }
    spred.getSelLayer = getSelLayer;
    function selLayer(name) {
        spred.g_sellayer = name;
        $('#SelLayerName').html(name);
        $('.LayerListItem').removeClass('selected');
        let l = getSelLayer();
        if (l)
            l.ui.addClass('selected');
    }
    spred.selLayer = selLayer;
    function selLayerUp() {
        let i = spred.g_model.layerNames.indexOf(spred.g_sellayer);
        if (i > 0)
            swapLayers(i, i - 1);
    }
    spred.selLayerUp = selLayerUp;
    function selLayerDown() {
        let i = spred.g_model.layerNames.indexOf(spred.g_sellayer);
        if (i >= 0 && i < spred.g_model.layerNames.length - 1)
            swapLayers(i, i + 1);
    }
    spred.selLayerDown = selLayerDown;
    $(() => {
        $.ajax(basedir + 'res/model.xml', {
            dataType: 'xml',
        }).then((data) => {
            spred.g_model = new Model(data);
            spred.g_model.whenLoaded.then((model) => {
                console.log("Model = ", model);
                for (let ln of model.layerNames) {
                    model.layers[ln].ui = $new('div.LayerListItem', $new('label', ln).click(e => selLayer(ln)), newCanvas(32, 32, (ctx2d) => {
                        ctx2d.drawImage(model.layers[ln].canvas, 0, 0, 32, 32);
                    }));
                }
                showLayerList(model);
                addCompositeView(spred.defaultLayerList, 3);
                $('#ClipboardGrabber');
            });
        });
    });
})(spred || (spred = {}));
