/**
 * Created by aimozg on 19.07.2014.
 */
function updengine(j) {
	function eval_prefix(el) {
		var pfx = (el.getAttribute("eval-prefix") || "") + ';';
		$(el).parents("[eval-prefix]").each(function (id2, el2) {
			pfx = el2.getAttribute('eval-prefix') + ";" + pfx;
		});
		return pfx;
	}

	var queue = [];
	function escape(s) {
		return ('' + (s || '')).replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	function evaluate(el) {
		var pfx = eval_prefix(el);
		var ep = (el.getAttribute("foreach-prefix")||"")+";";
		if (el.hasAttribute('foreach-in')) {
			var vid = el.getAttribute("foreach-id");
			var vel = el.getAttribute("foreach-el");
			var ae = el.getAttribute("foreach-in");
			var c = el.getAttribute("foreach-if");
			var a = eval(pfx + ae);
			var s = el.getAttribute("foreach-separator") || null;
			el.removeAttribute("foreach-id");
			el.removeAttribute("foreach-el");
			el.removeAttribute("foreach-in");
			el.removeAttribute("foreach-if");
			el.removeAttribute("foreach-separator");
			var j = $(el);
			var f = true;
			var jis = [];
			for (var i in a) {
				var jipfx = "";
				if (vid) jipfx += "var " + vid + "='" + i + "';";
				if (vel) jipfx += "var " + vel + "=" + ae + "['" + i + "'];";
				if (c && !eval(jipfx+ep+c)) continue;
				var ji = $(el).clone();
				ji.attr("eval-prefix", jipfx+ep);
				ji.insertAfter(j);
				if (!f && s) j.after(s);
				f = false;
				jis.push($(ji));
				//updengine($(ji));
				j = ji;
			}
			for (i = 0; i < jis.length; i++) updengine(jis[i]);
			$(el).remove();
			return
		}
		if (el.hasAttribute("choose")) {
			el.removeAttribute("choose");
			var found = false;
			$(el).children("[when]").each(function (id2, el2) {
				if (found || !eval(pfx + ';' + el2.getAttribute("when"))) {
					$(el2).remove();
				} else {
					el2.removeAttribute("when");
					found = true;
				}
			});
			var el2 = $(el).children("[otherwise]")[0];
			if (!found) {
				if (el2) el2.removeAttribute("otherwise");
				$(el).children("[when]").remove();
			} else {
				$(el2).remove();
			}
		}
		if (el.hasAttribute('if')) {
			var elif = $(el).next("[else]")[0];
			if (!eval(pfx + el.getAttribute("if"))) {
				if (elif) elif.removeAttribute('else');
				$(el).remove();
				return
			} else {
				if (elif) $(elif).remove();
				el.removeAttribute("if");
			}
		}
		if (el.hasAttribute('html')) {
			el.innerHTML = escape(eval(pfx + el.getAttribute("html")));
			el.removeAttribute("html");
			updengine($(el));
		}
		if (el.hasAttribute('raw')) {
			el.innerHTML = eval(pfx + el.getAttribute("raw"));
			el.removeAttribute("raw");
			updengine($(el));
		}
		if (el.hasAttribute('textnode')) {
			$(el).before(escape(eval(pfx + el.getAttribute("textnode"))));
			$(el).remove();
			return
		}
		if (el.hasAttribute('attrs')) {
			var d = eval(pfx + '(' + el.getAttribute("attrs") + ')');
			el.removeAttribute("attrs");
			for (var k in d) {
				if (el.tagName == 'SELECT' && k == 'value') {
					queue.push((function (d, k) {
						return function () {
							$(el).val(d[k]).change()
						}
					})(d, k));
				} else if (el.tagName == 'INPUT' && k == 'checked') {
					if (d[k]) el.setAttribute(k, d[k]);
				} else el.setAttribute(k, d[k]);
			}
		}
		if (el.hasAttribute('addclass')) {
			$(el).addClass(eval(pfx + el.getAttribute("addclass")));
			el.removeAttribute("addclass");
            if (typeof(login) == "object" && login.logged) {
                if ($(el).hasClass('for-guest')) $(el).remove();
            } else if ($(el).hasClass('for-user')) $(el).remove();
		}
		if (el.hasAttribute('oncompile')) {
			eval(pfx + el.getAttribute('oncompile'));
			el.removeAttribute('oncompile');
		}
	}

	if (typeof(j) != "object") j = $("html");
	var locales = ["en", "ru"];
	for (var i in locales) {
		var l = locales[i];
		if (window.locale == l) {
			j.find("." + l).removeClass(l);
			j.find("[" + l + "]").each(function (id, el) {
				el.innerHTML = el.getAttribute(l);
				el.removeAttribute(l);
				updengine($(el));
			});
		} else j.find("." + l).remove();
	}
	if (typeof(login) == "object" && login.logged) j.find(".for-guest").remove();
	else j.find(".for-user").remove();
	var selector = "[preserved],[preserve],[foreach-in],[if],[choose],[html],[raw],[textnode],[attrs],[addclass],[oncompile]";
	j.find(selector).andSelf().filter(selector).each(function (id, el) {
		if (!$.contains(document, el)) return;
		if (el.hasAttribute('delayeval') || $(el).parents("[delayeval]").length > 0) return;
		if (el.hasAttribute('preserve')) {
			el.removeAttribute('preserve');
			el.setAttribute('preserved',true);
			$(el).data('engine-preserved',el.innerHTML);
		} else if (el.hasAttribute('preserved')) {
			el.innerHTML = $(el).data('engine-preserved');
			el.removeAttribute('preserved');
			el.setAttribute('preserve',true);
			updengine($(el));
		}
		try {
			evaluate(el);
		} catch (e) {
			console.log("eval-prefix = " + eval_prefix(el));
			console.log(el.outerHTML);
			console.error(e);
		}
	});
	for (i in queue) queue[i]();
}
$(updengine);
function range(n, base) {
	if (!base) base = 0;
	return Array.apply(null, new Array(n)).map(function (_, i) {
		return i + base;
	});
}