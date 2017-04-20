/**
	* Created by IntelliJ IDEA.
	* User: aimozg
	* Date: 17.08.2015
	* Time: 21:27
	*/
function fit(a,x,b) { return (x<a)?+a:(x>b)?+b:+x; }
function xyadd(p1,p2) { return [p1[0]+p2[0],p1[1]+p2[1]]; }
function xysub(p1,p2) { return [p1[0]-p2[0],p1[1]-p2[1]]; }
function xycp(p,i) { return i?[p[i],p[i+1]]:[p[0],p[1]]; }
function lin(a,b,p) { return a*(1-p)+b*p; }
function sqin(a,b,c,p) { 
	return (2*c+2*a-4*b)*p*p+(4*b-3*a-c)*p+a;
}
function dolin(x,a,p) {
    for (var i in a) {
        var j = a[i];
        x[j[0]] = x[j[0]] + lin(j[1],j[2],p);
    }
}
function rndnorm(m,d) { 
	if (m==null) m = 0;
	if (d==null) d = 1;
	return (function() {
  		var vals = [];
		function calc() {
    		var alpha = Math.random(),
        		beta = Math.random();
    		return [
      			Math.sqrt(-2 * Math.log(alpha)) * 
      			Math.sin(2 * Math.PI * beta),
      			Math.sqrt(-2 * Math.log(alpha)) * 
      			Math.cos(2 * Math.PI * beta)
    		];
  		}
  		return function() {
    		vals = vals.length == 0 ? calc() : vals;
    		return vals.pop();
  		}})()()*d+m
}