/**
 * Created by IntelliJ IDEA.
 * User: aimozg
 * Date: 17.08.2015
 * Time: 21:28
 */
var styleTextOnly = {
	point: {tag: 'circle', r: 5, stroke: 'none', fill: 'none'},
	anchor: {tag: 'circle', r: 5, stroke: 'none', fill: 'none'},
	hand: {tag: 'line', stroke: 'none'},
	helpers: true
};
var styleEmpty = $.extend(true, {}, styleTextOnly, {
	text: {fill: 'none'},
	helpers: false
});
function drawPath(g, p, style) {
	style = $.extend(true, {}, {
		point: {tag: 'circle', r: 5, stroke: 'grey', 'stroke-width': 2, fill: 'navy'},
		anchor: {tag: 'circle', r: 5, stroke: 'grey', 'stroke-width': 2, fill: 'white'},
		hand: {tag: 'line', stroke: 'grey', 'stroke-width': 1},
		text: {tag: 'text', fill: '#f00'},
		helpers: true
	}, style);
	g.html("");
	var h = SVGItem({tag: 'g'});
	if (p.clipPath) g.attr('clip-path', p.clipPath);
	if (p.id) g.attr('id',p.id);
	var spath = '';
	var xy = [0, 0];
	var hxy = [0, 0];
	for (var i in p.d) {
		var e = p.d[i].s;
		spath += ' ' + e.join(' ');
		switch (e[0]) {
			case 'M':
			case 'L':
			case 'm':
			case 'l':
				if (e[0] == 'm' || e[0] == 'l') {
					xy[0] += e[1];
					xy[1] += e[2];
				}
				else {
					xy[0] = e[1];
					xy[1] = e[2];
				}
				if (style.helpers) svgadd(h, $.extend({}, style.point, {cx: xy[0], cy: xy[1]}));
				break;
			case 'C':
			case 'c':
				if (e[0] == 'c') {
					var x = [e[0],
						xy[0] + e[1], xy[1] + e[2], xy[0] + e[3], xy[1] + e[4], xy[0] + e[5], xy[1] + e[6]];
				} else x = e;
				if (style.helpers) {
					svgadd(h, $.extend({}, style.hand, {x1: xy[0], y1: xy[1], x2: x[1], y2: x[2]}));
					svgadd(h, $.extend({}, style.hand, {x1: x[5], y1: x[6], x2: x[3], y2: x[4]}));
					svgadd(h, $.extend({}, style.anchor, {cx: x[1], cy: x[2]}));
					svgadd(h, $.extend({}, style.anchor, {cx: x[3], cy: x[4]}));
				}
				hxy[0] = x[3];
				hxy[1] = x[4];
				if (style.helpers) svgadd(h, $.extend({}, style.point, {cx: x[5], cy: x[6]}));
				xy[0] = x[5];
				xy[1] = x[6];
				break;
			case 'S':
			case 's':
				hxy = xyadd(xy, xysub(xy, hxy));
				if (e[0] == 's') {
					x = [e[0],
						xy[0] + e[1], xy[1] + e[2], xy[0] + e[3], xy[1] + e[4]];
				} else x = e;
				if (style.helpers){
					svgadd(h, $.extend({}, style.hand, {x1: xy[0], y1: xy[1], x2: hxy[0], y2: hxy[1]}));
					svgadd(h, $.extend({}, style.hand, {x1: x[3], y1: x[4], x2: x[1], y2: x[2]}));
					svgadd(h, $.extend({}, style.anchor, {cx: x[1], cy: x[2]}));
					svgadd(h, $.extend({}, style.anchor, {cx: hxy[0], cy: hxy[1]}));
					svgadd(h, $.extend({}, style.point, {cx: x[3], cy: x[4]}));
				}
				if (e[0] == 's') {
					hxy[0] = xy[0] + e[1];
					hxy[1] = xy[1] + e[2];
					xy[0] += e[3];
					xy[1] += e[4];
				} else {
					xy[0] = e[3];
					xy[1] = e[4];
					hxy[0] = e[1];
					hxy[1] = e[2];
				}
				break;
		}
		if (p.d[i].h && style.helpers) svgadd(h, $.extend({}, style.text, {x: xy[0], y: xy[1], text: p.d[i].h}));
	}
	svgadd(g, {
		tag: 'path',
		d: spath
	});
	g.append(h);
}
function reducePaths(p, order, trail) {
	var r = [];
	for (var i in order) {
		r.push(p[order[i]]);
	}
	if (trail) r = r.concat(trail);
	return r;
}
function reducePaths2(x, params) {
	function dolin(a, ds) {
		for (var j in ds) {
			if (ds[j][0]) {
				a[0] += lin(ds[j][1], ds[j][2], params[ds[j][0]]);
				a[1] += lin(ds[j][3], ds[j][4], params[ds[j][0]]);
			} else {
				a[0] += ds[j][1];
				a[1] += ds[j][2];
			}
		}
	}

	var r = {d:[],clipPath: x.clipPath,id:x.id};
	var xy = [0, 0];
	var d = x.d? x.d:x;
	for (var i in d) {
		var e = d[i];
		if (e == 'z') {
			r.d.push({s: ['z']});
			continue;
		}
		var p, a, b;
		switch (e.t) {
			case 'M':
			case 'L':
			case 'm':
			case 'l':
				p = (e.t == 'M' || e.t == 'L') ? xycp(e.p) : xyadd(xy, e.p);
				if (e.dp) dolin(p, e.dp);
				r.d.push({h: e.h, s: [(e.t == 'M' || e.t == 'm') ? 'M' : 'L', p[0], p[1]]});
				xy = xycp(p);
				break;
			case 'C':
			case 'c':
				p = (e.t == 'C') ? xycp(e.p) : xyadd(xy, e.p);
				if (e.dp) dolin(p, e.dp);
				a = xycp(e.a);
				if (e.da) dolin(a, e.da);
				b = xycp(e.b);
				if (e.db) dolin(b, e.db);
				r.d.push({h: e.h, s: ['C', xy[0] + a[0], xy[1] + a[1], p[0] + b[0], p[1] + b[1], p[0], p[1]]});
				xy = xycp(p);
				break;
			case 'S':
			case 's':
				p = (e.t == 'S') ? xycp(e.p) : xyadd(xy, e.p);
				if (e.dp) dolin(p, e.dp);
				b = xycp(e.b);
				if (e.db) dolin(b, e.db);
				r.d.push({h: e.h, s: ['S', p[0] + b[0], p[1] + b[1], p[0], p[1]]});
				xy = xycp(p);
				break;
			case 'z':
				r.d.push({h: e.h, s: ['z']});
				break;
		}
	}
	return r;
}
function resolve(obj) {
	function resolve1(s) {
		s = s.split(".");
		var x = obj[s[0]];
		for (var i in x) {
			var el = x[i];
			if (el.h && el.h == s[1]) {
				return xycp(el[s[2]]);
			}
		}
	}
	for (var i in obj) {
		var oi = obj[i].d||obj[i];
		for (var j in oi) {
			var el = oi[j];
			if (el.p && typeof(el.p) == 'string') el.p = resolve1(el.p);
			if (el.a && typeof(el.a) == 'string') el.a = resolve1(el.a);
			if (el.b && typeof(el.b) == 'string') el.b = resolve1(el.b);
		}
	}
}