/*
 * Jelikoz puvodni skript svoji velikosti presahuje limity browseru pro vlozeni bookmarkletu (viz http://subsimple.com/bookmarklets/rules.asp#CharLimit),
 * tak tento bookmarklet ma na startosti pouze naloadovani scriptu z externiho zdroje. 
 */
var radioJednaScript = document.createElement("script");
radioJednaScript.src = "http://michal.bernhard.cz/files/r1-final-script.js";
radioJednaScript.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(radioJednaScript);
