/* 
 * Skript pro stranku hitparady ceskeho radio1 (http://www.radio1.cz/hitparada/), ktery vlozi
 * pod hitparadu youtube player a umozni si hezky snadno prehrat celou hitparadu.
 * 
 * (c) Michal Bernhard 2011 michal.bernhard.cz/blog
 * 
 * TODO: 
 * 
 *  - detekce, ze youtube video opravdu sedi k dane pisnicce a pokud ne tak vyrazeni z playlistu
 *  - oznaceni pisnicek, ktere nemaji zadne youtube video
 *  - odkaz na stazeni jako mp3
 *  - odkaz na koupi pisnicky na amazonu / itunes 
 *  - sdilet konkretni video na facebooku/google+/twitteru
 *  - vlastni jmenny prostor
 *  - hezke ikonky pro prehravac
 *  - growl notifikace v OS (html5?) pri prehravani pisnicky
 *  - stazeni lyrics k pisnicce
 *  - odkaz na last.fm
 *  - mini info ke kapele primo ve strance
 *  - moznost jednoduse hlasovat (odeslani mailu) s odpocitavanim, do kdy je mozne hlasovat 
 *  - vynechavani pisnicek, ktere se nepovede nacist a ktere nelze prehravat v embedded forme
 *  - repeating pisnicky je takove divne - nejdriv se de na dalsi pisnicku v playlistu a pak az
 *    teprve zpet na tu pisnicku, kterou chceme opakovat
 *  - ODSTRANIT BUG - kdyz je REPEAT na songu tak nelze jit dopredu ani dozadu
 *  - ovladaci prvky by meli mit ovladani klavesnici
 *  - prehravani i nove nasazenych pisnicek a retro skladby
 */

if (document.getElementById('playerContent') != undefined) {
	console.debug("Radio1 Hitparada Enhancer is already loaded.");
}
else {
	/* inject jquery */
	var jqueryScript = document.createElement("script");
	jqueryScript.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js";
	jqueryScript.type = "text/javascript";
	jqueryScript.onload = function() { runMachinery(); };
	document.getElementsByTagName("head")[0].appendChild(jqueryScript);

	/* inject custom style */
	var style = document.createElement("style");
	style.type = "text/css";
	document.getElementsByTagName("head")[0].appendChild(style);
	style.innerHTML = 
				"tr.playing { background-color:yellow; }" +
				"table tr.playing td { background-color:yellow !important; }" +
				".playButton { padding-left: 10px; }";	

	/* global variables */

	var videos = [];
	var songs = []; 
	var currentSongIndex = null;
	var videoToBeRepeatedInPlaylistIndex = null;
	var areVideosShuffled = false;
	
	var $songRows = $('table.chartPage:eq(0) tr:has(".interpret")');

	function runMachinery() {
		
		console.debug("Starting machinery..");
		
		console.debug("add html structure on the page");
		$('table.chartPage:eq(0)').after('<div id="playerContent" style=".class { display: inline; margin-right:20px; }"></div>');
		$("#playerContent").append('<div id="ytapiplayer">You need Flash player 8+ and JavaScript enabled to view this video.</div>');
		
		console.debug("inject swfobject to page");
		var swfObjectScript = document.createElement("script");
		swfObjectScript.src = "http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js";
		swfObjectScript.type = "text/javascript";
		swfObjectScript.onload = function () {
				loadYoutubePlayer();
		}; 
		document.getElementsByTagName("head")[0].appendChild(swfObjectScript);
		
		 
		console.debug("extract band and song name from page's topten table ");
		$songRows.each( function(index, value) {
				var $this = $(this)
				var band = $this.find(".interpret").text();
				var song = $this.find(".song").eq(0).text();        
				console.log("band:", band, "song:", song)
				var songMetadata = { position: index, band: band, song: song }
				songs.push(songMetadata)
		});
			
		console.debug("Parsed songs are:", songs);

		/* for each song in top ten find appropriate youtube video  */
		console.debug("Get youtube video ids for parsed songs...");
		songs.forEach(function(it) {
			
			var band = it.band;
			var song = it.song;    
			var position = it.position;
			
			$.ajax({
			  url: "https://gdata.youtube.com/feeds/api/videos?q="+ band + " " + song + "&alt=json-in-script&v=2&key=AI39si5pjOKyRdCdoBHtkwk78TLvnnBTxb7gD69R4eUeV8EEDtSw0RlUuF8Dq33oe3VcjIh4QbXdBgwssMBD6hknltcrx_VqYA",
			  context: document.body,
			  success: function(data){           
				  console.debug("For ", band, " and song ", song, " we obtained this: ", data);
				  var url = data.feed.entry[0].media$group.media$player.url;
				  var videoId =  url.substring(url.indexOf("?v") + 3, url.indexOf("&feature"));
				  var extractedData = {position: position, band: band, song: song, videoId: videoId};
				  console.debug("Extracted data: ", extractedData);
				  videos.push(extractedData);
			  },
			  dataType: "jsonp"
			});             
				
		}); //songs foreach end

		

	}

	function extract(object, property) {
			
			var extracted = [];
			
			object.forEach(function(it) {
				extracted.push(it[property]);
			})
			
			return extracted;
	};

	function loadYoutubePlayer() {
		console.debug("Loading Youtube player on the page...");
		var params = { allowScriptAccess: "always" };
		var atts = { id: "r1HitparadaPlayer" };
		var playerWidth = "400";
		var playerHeight = "279";
		var replaceElemIdStr = "ytapiplayer";
		var minFlashVersion = "8";
		swfobject.embedSWF(
					"http://www.youtube.com/e/eQA6cF3W7A0?enablejsapi=1&version=3",
					replaceElemIdStr, 
					playerWidth, playerHeight,
					minFlashVersion, null, null, params, atts);
	};

	/* this function is called by YouTube Player - it's just convention. See more at https://developers.google.com/youtube/js_api_reference */
	function onYouTubePlayerReady(playerId) {
		console.debug("Youtube player is ready..");
		
		console.debug("Adding custom player controls...");
		addPlayerCustomControls();
		
		var player = $("#r1HitparadaPlayer").get(0);
		console.debug("Videos: ", videos);   
		
		console.debug("Videos before sort: ", videos);
		videos = videos.sort(function(a,b) { return a.position - b.position; });
		console.debug("Videos after sort: ", videos);
			
		var videosId = extract(videos, "videoId");
		console.debug("Extracted just videos ids: ", videosId);
		
		/* add play button next each song to let user easily play just some song */
		console.debug("Adding play buttons to each song..")
		videosId.forEach(function(value, index) {
			var $songTableRows = $songRows;
			var $songRow = $songTableRows.eq(index );
			var $songName = $songRow.find("td").eq(1) 
			var songPlayButtonHtmlSnippet =
								'<span class="ubaControls playButton">' +
								'   <span id="playVideo' + index + '" class="audioButton">Přehrát</span>' +
								'</span>';
			$playVideoButton = $songName.prepend(songPlayButtonHtmlSnippet);

			$playVideoButton.click(function() {
						
				var $player = $("#r1HitparadaPlayer");
				var youtubePlayer = $player.get(0);
				
				var $playButton = $(this).find(".audioButton");
				
				var playing = youtubePlayer.getPlayerState() === 1;
				var thisSongIsSameAsPlayingSong = youtubePlayer.getPlaylistIndex() == index;
					
				$(".playButton .audioButton").toggleClass("playing", false); // removes playing from all buttons 	
					
				if(playing && thisSongIsSameAsPlayingSong) {
					youtubePlayer.pauseVideo();	
					$playButton.toggleClass("playing", false); 				
				} else {
					youtubePlayer.playVideoAt(index);					
					$playButton.toggleClass("playing", true);
				}
				
				/* prave hrajici pisnicka se v hitparade zvyrazni */
				$('table.chartPage:eq(0) tr:has(".interpret")').removeClass("playing"); // restartovat tabulku
				$('table.chartPage:eq(0) tr:has(".interpret")').eq(index).toggleClass("playing"); // nastavit styl
				
			})
		})
		
		console.debug("Setting playlist and start to play videos...");
		player.loadPlaylist(videosId);
		player.setLoop(true);
		player.addEventListener("onStateChange", "onYouTubePlayerStateChange");
		player.playVideo();	
	};
	
	function addPlayerCustomControls() {
		$("#playerContent").append('<div id="play" accesskey="p" class="button">PAUSE</div>');
		$("#playerContent").append('<div id="previous" accesskey="b" class="button">PREVIOUS</div>');
		$("#playerContent").append('<div id="next" accesskey="f" class="button">NEXT</div>');
		$("#playerContent").append('<div id="repeat" class="button">REPEAT CURRENT SONG</div>');
		$("#playerContent").append('<div id="shuffle" class="button">SHUFFLE</div>');
		
		$("#play").click(function() {
			var player = $("#r1HitparadaPlayer").get(0);
			var PLAYING = 1;
			var PAUSED = 2;
			if (player.getPlayerState() == PLAYING) {
				player.pauseVideo();
				jQuery(this).text("PLAY");
			} else if (player.getPlayerState() == PAUSED) {
				player.playVideo();
				jQuery(this).text("PAUSE");
			}
			
		});
		
		$("#next").click(function() {
			var player = $("#r1HitparadaPlayer").get(0);
			player.nextVideo();
		});
		
		$("#previous").click(function() {
			var player = $("#r1HitparadaPlayer").get(0);
			player.previousVideo();
		});
		
		$("#repeat").click(function() {
			var player = $("#r1HitparadaPlayer").get(0);
			/* toggle repeat mode of currently playing video */
			if (videoToBeRepeatedInPlaylistIndex == null) {
				videoToBeRepeatedInPlaylistIndex = player.getPlaylistIndex();
				jQuery(this).text("STOP REPEATING CURRENT SONG");
			} else {
				videoToBeRepeatedInPlaylistIndex = null;
				jQuery(this).text("REPEAT CURRENT SONG");
				
			}
			
			console.debug("Song repetition is: ", videoToBeRepeatedInPlaylistIndex ? "on" : "off");
		});
		
		$("#shuffle").click(function() {
			var player = $("#r1HitparadaPlayer").get(0);
			if (areVideosShuffled) {
				jQuery(this).text("SHUFFLE");
				player.setSuffle(false);
				areVideosShuffled = false;
			}
			else {
				player.setSuffle(true);
				areVideosShuffled = true;
			}
			
			console.debug("Shuffle is: ", player.getShuffle());
			
		});
	};

	function onYouTubePlayerStateChange(currentState) {
		var player = $("#r1HitparadaPlayer").get(0);
		console.debug("onYouTubePlayerStateChange -> state: ", currentState);
				
		if (currentState == 1) { // playing
						
			var i = player.getPlaylistIndex();
			
			if (!currentSongIndex) {
				console.debug("YouTube player started for the first time.");
			}
			
			currentSongIndex = i;
			
			if(videoToBeRepeatedInPlaylistIndex 
					&& (currentSongIndex != videoToBeRepeatedInPlaylistIndex) /* anti-loop condition */ ) {
				currentSongIndex = videoToBeRepeatedInPlaylistIndex;
				player.playVideoAt(videoToBeRepeatedInPlaylistIndex);
			}
			
			/* prave hrajici pisnicka se v hitparade zvyrazni */
			$('table.chartPage:eq(0) tr:has(".interpret")').removeClass("playing"); // restartovat tabulku
			$('table.chartPage:eq(0) tr:has(".interpret")').eq(currentSongIndex).toggleClass("playing"); // nastavit styl
		}
		
	};
}
