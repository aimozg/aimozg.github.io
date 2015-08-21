/**
* Created by IntelliJ IDEA.
* User: aimozg
* Date: 17.08.2015
* Time: 21:29
*/
function drawEye(e,pars,options) {
	var showHelpers = options.showHelpers;
	var clip = options.clip;
	var prefix = options.prefix||"";
	var mirror = options.mirror?true:false;
	var p = [null].concat($.map(pars,function(el){return el?el/10:el;}));
	function L(i,a,b) { return lin(a,b,p[i]);	 }
	function S(i,a,b,c) { return sqin(a,b,c,p[i]);   }
	var S1 = L(1,-50,50);
	var S2 = L(2,-25,25);
	var S3 = L(3,0,100);
	var S4 = (mirror?-1:1)*L(4,-100,100);
	var S5 = L(5,-100,100);
	var S6 = L(6,1,2);
	var S7 = L(7,2/5,8/5);
	var S8 = L(8,1/3,5/3);
	var S10 = L(10,0,1);
	var S11I = L(11,1,0), S11O = L(11,1,2);
	var S13 = S(13,125,50,0);
	var S14 = L(14,0,100);
	var I0 = 50;
	var P0 = 30;
	var eye = {
		white: [
			{t:'M',p:'lid_u.a.p',dp:[[null,0,-1]]},
			{t:'C',p:'lid_u.b.p',dp:[[null,0,-1]],
				a:'lid_u.a.b',b:'lid_u.a.a'},
			{t:'C',p:[281,321+S2],
				a:[L(1,0,10),L(1,0,10)],
				b:[L(1,0,10),L(1,0,-20)]},
			{t:'C',p:[120,321+S2],
				a:[-20,6],b:[20,6]},
			{t:'C',p:'lid_u.a.p',dp:[[null,0,-1]],
				a:[L(1,-10,0),L(1,-20,0)],
				b:[L(1,-10,0),L(1,10,0)]}],
		white_light: {d:[
			{t:'M',p:'lid_u.a.p',dp:[[null,-20,S14]]},
			{t:'C',p:'lid_u.b.p',dp:[[null,20,S14]],
				a:'lid_u.a.b',b:'lid_u.a.a'},
			{t:'L',p:[300,400]},
			{t:'L',p:[100,400]},
			'z'
		],clipPath:"url(#eyeCp"+prefix+mirror+")"},
		lid_d: [
			{h:'A',t:'M',p:[120,320+S2]},
			{h:'B',t:'C',p:[280,320+S2],
				a:[20,5],b:[-20,5]},
			{h:'b',t:'L',p:[280,320+L(12,0,10)+S2]},
			{h:'a',t:'C',p:[120,320+L(12,0,10)+S2],
				a:[-20,5],b:[20,5]},
			'z'],
		lid_u: [
			{h:'A',t:'M',p:[110-20*S10*S11I,200-20*S10*S11I+S1-S2]},
			{h:'B',t:'C',p:[290+20*S10*S11O,200-20*S10*S11O-S1-S2],
				a:[S3*L(1,1,1/2),-2*S3*L(1,1/2,1)],
				b:[-S3*L(1,1/2,1),-2*S3*L(1,1,1/2)]},
			{h:'C',t:'C',p:[295-S(9,5,7,15),
				L(9,200-S1-S2,320+S2)],
				a:[L(9,0,10*L(1,0,1)),L(9,0,10*L(1,0,1))],
				b:[L(9,0,10*L(1,0,1)),L(9,0,-20*L(1,0,1))]},
			{h:'b',t:'C',p:[290,200-S1-S2],
				a:[L(9,0,10*L(1,0,1)),L(9,0,-20*L(1,0,1))],
				b:[L(9,0,10*L(1,0,1)),L(9,0,10*L(1,0,1))]},
			{h:'a',t:'C',p:[110,200+S1-S2],
				a:[-S3*L(1,1/2,1),-2*S3*L(1,1,1/2)],
				b:[S3*L(1,1,1/2),-2*S3*L(1,1/2,1)]},
			'z'],
		pupil: {d:[
			{t:'M',p:[200+S4,250+S5]},
			{h:'N',t:'m',p:[0,-P0*S6*S7*S8],
				dp:[[6,0,0,0,-20],[7,0,0,15,-15]]},
			{h:'E',t:'c',p:[30*S7*S8,30*S6*S7*S8],
				a:[15*S7*S8,0],b:[0,-15*S7*S8],
				da:[[6,0,5*S7*S8,0,0]],db:[[6,0,0,0,-10*S7*S8]]},
			{h:'S',t:'s',p:[-30*S7*S8,30*S7*S8*S6],
				b:[15*S7*S8,0],db:[[6,0,5*S7*S8,0,0]]},
			{h:'W',t:'s',p:[-30*S7*S8,-30*S7*S8*S6],
				b:[0,15*S7*S8],db:[[6,0,0,0,10*S7*S8]]},
			{t:'s',p:[30*S7*S8,-30*S7*S8*S6],
				b:[-15*S7*S8,0],db:[[6,0,-5*S7*S8,0,0]]}
			], clipPath:"url(#eyeCp"+prefix+mirror+")"},
		iris: {d:[
			{t:'M',p:[200+S4,250+S5]},
			{h:'n',t:'m',p:[0,-I0*S6*S7],
				dp:[[6,0,0,0,-20],[7,0,0,15,-15]]},
			{h:'e',t:'c',p:[50*S7,50*S7*S6],
				a:[30*S7,0],da:[[6,0,10*S7,0,0]],
				b:[0,-30*S7],db:[[6,0,0,0,-10*S7]]},
			{h:'s',t:'s',p:[-50*S7,50*S7*S6],
				b:[30*S7,0],db:[[6,0,10*S7,0,0]]},
			{h:'w',t:'s',p:[-50*S7,-50*S7*S6],
				b:[0,30*S7],db:[[6,0,0,0,10*S7]]},
			{t:'s',p:[50*S7,-50*S7*S6],
				b:[-30*S7,0],db:[[6,0,-10*S7,0,0]]}
			],clipPath:"url(#eyeCp"+prefix+mirror+")"},
		iris_light1: {d:[
			{t:'M',p:[200+S4,200+S5+50*S7+S7*S13]},
			{h:'N',t:'m',p:[0,-I0*S7],				
				dp:[[6,0,0,0,-20],[7,0,0,15,-15]]},
			{h:'E',t:'c',p:[100*S7,100*S7],
				a:[30*S7,0],da:[[6,0,10*S7,0,0]],
				b:[0,-60*S7],db:[[6,0,0,0,-10*S7]]},
			{h:'S',t:'s',p:[-100*S7,100*S7],
				b:[30*S7,0],db:[[6,0,10*S7,0,0]]},
			{h:'W',t:'s',p:[-100*S7,-100*S7],
				b:[0,30*S7],db:[[6,0,0,0,10*S7]]},
			{t:'c',p:[100*S7,-100*S7],
				a:[0,-30*S7],da:[[6,0,0,0,10*S7]],
				b:[-60*S7,0],db:[[6,0,-10*S7,0,0]]}
			],clipPath:"url(#irisCp"+prefix+mirror+")"},
		iris_light2: {d:[
			{t:'M',p:[200+S4,250+S5+50*S7+S7*S13]},
			{h:'N',t:'m',p:[0,-I0*S7],				
				dp:[[6,0,0,0,-20],[7,0,0,15,-15]]},
			{h:'E',t:'c',p:[100*S7,50*S7],
				a:[30*S7,0],da:[[6,0,10*S7,0,0]],
				b:[0,-30*S7],db:[[6,0,0,0,-10*S7]]},
			{h:'S',t:'s',p:[-100*S7,50*S7],
				b:[30*S7,0],db:[[6,0,10*S7,0,0]]},
			{h:'W',t:'s',p:[-100*S7,-50*S7],
				b:[0,30*S7],db:[[6,0,0,0,10*S7]]},
			{t:'c',p:[100*S7,-50*S7],
				a:[0,-30*S7],da:[[6,0,0,0,10*S7]],
				b:[-30*S7,0],db:[[6,0,-10*S7,0,0]]}
			],clipPath:"url(#irisCp"+prefix+mirror+")"}
	};
    resolve(eye);
	var eye_order = ['white','white_light',
		'iris','iris_light1','iris_light2','pupil',
		'lid_d','lid_u'];
	drawPath(svgadd(clip,{tag:'clipPath',id:'eyeCp'+prefix+mirror}),
		reducePaths2(eye.white,p,styleEmpty));
	drawPath(svgadd(clip,{tag:'clipPath',id:'irisCp'+prefix+mirror}),
		reducePaths2(eye.iris,p,styleEmpty));
	e.html("");
	var style = showHelpers?null:styleEmpty;
    for (var i in eye_order) {
        drawPath(svgadd(e, {tag: 'g', part: eye_order[i]}),
            reducePaths2(eye[eye_order[i]], p), style);
    }
}