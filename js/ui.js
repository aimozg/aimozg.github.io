/**
 * Created by IntelliJ IDEA.
 * User: aimozg
 * Date: 17.08.2015
 * Time: 21:24
 */
function mkTrackBar(bar) {
	var t = bar.find("div");
	var d = $("#" + bar.attr("data-tgt"));
	var min = +bar.attr("min");
	var max = +bar.attr("max");

	function v2p(v) {
		return (v - min) / (max - min) * 84;
	}

	function p2v(p) {
		return p / 84 * (max - min) + min;
	}

	t.css("left", v2p(d.val()) + "px");
	t.on("mousedown", function (e) {
		t.addClass("drag").data("drag", true).
			data("ref", e.clientX).data("refp", v2p(d.val()));
	});
	bar.on("mousemove", function (e) {
		if (t.data("drag")) {
			var i = fit(0, (t.data("refp") + e.clientX - t.data("ref")), 84);
			d.val(p2v(i)).change();
			t.css("left", (i + "px"));
		}
	});
	bar.on("mouseup", function () {
		t.data("drag", false).removeClass("drag");
	});
	bar.on("val",function(){
		t.css("left", v2p(d.val()) + "px");
	});
}
function _CreateElement(dce, pre, prea) {
	function foo(attrs) {
		var tag = attrs.tag;
		delete attrs.tag;
		var parent = attrs.parent;
		delete attrs.parent;
		var items = attrs.items;
		delete attrs.items;
		var text = attrs.text;
		delete attrs.text;
		var i = dce(tag, {parent: parent, items: items, text: text});
		if (pre) pre(i, attrs);
		for (var a in attrs) i.setAttribute(a, attrs[a]);
		if (text) i.innerHTML = text;
		for (var j in items) {
			var item = foo(items[j]);
			if (prea) prea(item, i);
			i.appendChild(item);
		}
		if (parent) parent.appendChild(i);
		return i;
	}
	return foo;
}
var createElement = _CreateElement(
	function (tag) {
		return document.createElement(tag);
	},
	function (ele, attrs) {
		var style = attrs.style;
		delete attrs.style;
		if (style) for (var s in style) {
			ele.style[s] = style[s];
		}
	}
);
var SVGItem = _CreateElement(function (tag) {
	return document.createElementNS("http://www.w3.org/2000/svg", tag);
});
function svgadd(tgt,attrs) {
    var i = SVGItem(attrs);
    if (tgt.append) tgt.append(i);
    else tgt.appendChild(i);
    return $(i);
}
function inp2num(inp) {
	return $.map(inp,function(el){return el.val();});
}