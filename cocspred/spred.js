/*
 * Created by aimozg on 27.07.2017.
 * Confidential until published on GitHub
 */
///<reference path="typings/jquery.d.ts"/>
var spred;
(function (spred) {
    const basedir = window['spred_basedir'] || '../../';
    function RGBA(i) {
        let rgb = i.toRgb();
        return (((rgb.a * 0xff) & 0xff) << 24
            | (rgb.b & 0xff) << 16
            | (rgb.g & 0xff) << 8
            | (rgb.r & 0xff)) >>> 0;
    }
    spred.RGBA = RGBA;
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
    function paletteOptions(palette) {
        return Object.keys(palette).map(name => $new('option', name).attr('value', palette[name]));
    }
    spred.paletteOptions = paletteOptions;
    class Composite {
        constructor(model, visibleNames = [], zoom = 1) {
            this.model = model;
            this._layers = [];
            this.colormap = {};
            this.canvas = newCanvas(model.width * zoom, model.height * zoom);
            this.canvas.setAttribute('focusable', 'true');
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
            let p0 = new Promise((resolve, reject) => {
                resolve(ctx2d);
            });
            let cmap = [];
            for (let ck of this.model.colorkeys) {
                if (!(ck.base in this.colormap))
                    continue;
                let base = tinycolor(this.colormap[ck.base]);
                if (ck.transform)
                    for (let tf of ck.transform.split(',')) {
                        let m = tf.match(/^([a-z]+)\((\d+)\)$/);
                        if (m && m[1] in base)
                            base = base[m[1]].apply(base, [+m[2]]);
                    }
                cmap.push([RGBA(tinycolor(ck.src)), RGBA(base)]);
            }
            for (let a = this.model.layerNames, i = a.length - 1; i >= 0; i--) {
                let lname = a[i];
                if (this._layers.indexOf(lname) >= 0) {
                    let idata = this.model.layers[lname].ctx2d.getImageData(x, y, w, h);
                    idata = colormap(idata, cmap);
                    p0.then(ctx2d => {
                        return createImageBitmap(idata).then(bmp => {
                            ctx2d.drawImage(bmp, x, y, w, h, x * z, y * z, w * z, h * z);
                            return ctx2d;
                        });
                    });
                }
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
        updateUI() {
            let c2d = this.ui.find('canvas')[0].getContext('2d');
            c2d.drawImage(this.canvas, 0, 0, 32, 32);
        }
    }
    spred.Layer = Layer;
    function url2img(src) {
        return new Promise((resolve, reject) => {
            let img = document.createElement('img');
            img.onload = (e) => {
                resolve(img);
            };
            img.src = src;
        });
    }
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
                url2img(modeldir + x.attr('file')).then(img => {
                    Object.keys(positions)
                        .forEach(key => {
                        this.sprites[key] = new Layer(key, this.cellheight, this.cellwidth, img, positions[key][0], positions[key][1]);
                    });
                    this.img = img;
                    resolve(this);
                });
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
            this.colorProps = [];
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
                this.colorkeys.push({
                    src: e.getAttribute('src'),
                    base: e.getAttribute('base'),
                    transform: e.getAttribute('transform') || ''
                });
            });
            //noinspection CssInvalidHtmlTagReference
            xmodel.find('palette>common>color').each((i, e) => {
                this.palettes.common[e.getAttribute('name')] = e.textContent;
            });
            xmodel.find('property').each((i, e) => {
                let cpname = e.getAttribute('name');
                this.colorProps.push(cpname);
                let p = this.palettes[cpname] = {};
                $(e).find('color').each((ci, ce) => {
                    p[ce.getAttribute('name')] = ce.textContent;
                });
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
        })), $new('div', $new('.canvas', composite.canvas)), $new('div', $new('label', $new('span.fa.fa-caret-down'), 'Layers').click(e => {
            composite.ui.find('.LayerBadges').toggleClass('collapse');
        }), $new('.LayerBadges.collapse')), $new('div', $new('label', $new('span.fa.fa-caret-down'), 'Colors').click(e => {
            composite.ui.find('.Colors').toggleClass('collapse');
        }), $new('.Colors.collapse', ...spred.g_model.colorProps.map(cpname => $new('.row.control-group', $new('label.control-label.col-4', cpname), $new('select.form-control.col-8', ...[
            $new('option', '--none--').attr('selected', 'true')
        ].concat(paletteOptions(spred.g_model.palettes['cpname'] || {}), paletteOptions(spred.g_model.palettes['common']))).change(e => {
            let s = e.target;
            if (s.value) {
                composite.colormap[cpname] = s.value;
            }
            else {
                delete composite.colormap[cpname];
            }
            composite.redraw();
        })))))
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
        $('#SelLayerCanvas').html('').append(l.canvas);
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
    function colormap(src, map) {
        let dst = new ImageData(src.width, src.height);
        let sarr = new Uint32Array(src.data.buffer);
        let darr = new Uint32Array(dst.data.buffer);
        for (let i = 0, n = darr.length; i < n; i++) {
            darr[i] = sarr[i];
            for (let j = 0, m = map.length; j < m; j++) {
                if (sarr[i] === map[j][0]) {
                    darr[i] = map[j][1];
                    break;
                }
            }
        }
        return dst;
    }
    spred.colormap = colormap;
    function grabData(blob) {
        let mask = $('#ClipboardMask').val();
        let i32mask = mask ? RGBA(tinycolor(mask)) : 0;
        url2img(URL.createObjectURL(blob)).then(img => {
            switch ($("input[name=clipboard-action]:checked").val()) {
                case 'replace':
                    let layer = getSelLayer();
                    if (!layer)
                        return;
                    layer.ctx2d.clearRect(0, 0, layer.width, layer.height);
                    layer.ctx2d.drawImage(img, 0, 0);
                    if (i32mask != 0) {
                        let data = layer.ctx2d.getImageData(0, 0, layer.width, layer.height);
                        data = colormap(data, [[i32mask, 0]]);
                        layer.ctx2d.clearRect(0, 0, layer.width, layer.height);
                        layer.ctx2d.putImageData(data, 0, 0);
                    }
                    layer.updateUI();
                    redrawAll();
                    break;
            }
        });
    }
    $(() => {
        $.ajax(basedir + 'res/model.xml', {
            dataType: 'xml',
        }).then((data) => {
            spred.g_model = new Model(data);
            spred.g_model.whenLoaded.then((model) => {
                console.log("Model = ", model);
                for (let ln of model.layerNames) {
                    let layer = model.layers[ln];
                    if (!layer) {
                        console.warn("Non-existing layer " + ln + " refered");
                        continue;
                    }
                    layer.ui = $new('div.LayerListItem', $new('label', ln), newCanvas(32, 32)).click(e => selLayer(ln));
                    layer.updateUI();
                }
                $('#SelLayerCanvas')
                    .css('min-width', model.width + 'px')
                    .css('min-height', model.height + 'px');
                $('#lmb-color').html('').append(model.colorkeys.map(ck => $new('option', ck.base + (ck.transform ? ' ' + ck.transform : '')).attr('value', ck.src)));
                showLayerList(model);
                selLayer(model.layerNames[0]);
                addCompositeView(spred.defaultLayerList, 3);
                addCompositeView(spred.defaultLayerList, 2);
                addCompositeView(spred.defaultLayerList, 1);
                addCompositeView(spred.defaultLayerList, 1);
                $('#ClipboardGrabber').on('paste', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    let cd = e.originalEvent.clipboardData;
                    for (let i = 0, n = cd.items.length; i < n; i++) {
                        let item = cd.items[i];
                        if (item.type.indexOf('image/') == 0) {
                            grabData(item.getAsFile());
                            return;
                        }
                        else {
                            console.log('skip ' + item.kind + ' ' + item.type);
                        }
                    }
                    alert("Please paste 1 image data or file");
                });
            });
        });
    });
})(spred || (spred = {}));
