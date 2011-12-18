/*
 * Pouzijte toto jako bookmarklet.(CTRL+D, do policka "url" : "javascript:<tady obsah tohoto souboru>" bez uvozovek)
 *
 * Jelikoz puvodni skript svoji velikosti presahuje limity browseru pro vlozeni bookmarkletu (viz http://subsimple.com/bookmarklets/rules.asp#CharLimit),
 * tak tento bookmarklet ma na startosti pouze naloadovani scriptu z externiho zdroje. 
 */
var radioJednaScript = document.createElement("script");
radioJednaScript.src = "https://raw.github.com/michalbcz/radio1-hitparada-add-youtube-player-script/master/r1-add-youtube-player-script.js";
radioJednaScript.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(radioJednaScript);
void(0); 
