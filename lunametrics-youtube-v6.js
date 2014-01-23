//
//To Track Thy Youtube Upon Google Analytics
//Regardless the number of Players upon thy stage
//Revised and Revisioned to Version 3
//Harken version 3 was written during the Polar Vortex
//Which Struck our fair city lo in January of 2014
//
//Performed by LunaMetrics http://www.lunametrics.com @lunametrics 
//and Sayf Sharif @sayfsharif
//With help as noted by additional coders of note and fame
//inline below whereupon their input was recieved
//
//Tis code not the most triumphant
//Nor that of most efficiency
//but neither is the field of poppies
//stretch'd ere the distance
//it matches its purpose
//
//Forget thou not to subscribeth to our bloge: http://www.lunametrics.com/blog/
//
//CURTAIN
//
//Forsooth here doth we instantiate thy youtube player api 
//as it was written by the Google
var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
//Then as a drop of rain we create two heavenly arrays
//who may hold in thy endless bossom our value
//necessary they may be not, but what is love
//but the ample clevage of an array
var videoArray = new Array();
var playerArray = new Array();
//And a third, new to Part 3
//whereupon we now shall seek the title of our fair video
//with thanks to Alex Moore @almoo
//who is known by the Romanians
var videoTitle = new Array();
//and what is life without a magical switch
//for true we show the true title of the player
//unhindered by disguise or shadow
//for false we leave it obscured by darkness
//and the player id
//so rings the clock
//1 doth show the player title
//2 doth show the player id
//3 doth show both as concatenated by the hand of man
var showTitle = 3;
//and if you are not tracking
//even with this code
//try setting this line to 1
//for with it we force the youtube beast
//and reload the frames
//which oft works
var reloadFrames = 0;
//
//And Then Lo We Tracked The Frames
//with hounds ere the dark of knight
//we sought them to blood our first array
function trackYouTube()
{
	//What am i, but nothing?
	var i = 0;
	//Harken to the iframes of the page
	//thy loathesome demon gallavanting upon
	//our innocent sweet html
	jQuery('iframe').each(function() {
		//but what is this?
		//an iframe! Avast!
		if($(this).attr('src')){
			//it has a source!
			//Lo we can see it's innards
			//as Han was wont to slice the tauntaun
			var video = $(this);
			var vidSrc = video.attr('src');
			//by default we shant do the following
			//but if your tracking seems to suffer
			//adjust they variable above
			//and refresh the frames upon loading
			if(reloadFrames){
				//next some trickery
				//has it the foul stench of the demon parameter
				var regex1 = /(?:https?:)?\/\/www\.youtube\.com\/embed\/([\w-]{11})(\?)?/;
				var SourceCheckA = vidSrc.match(regex1);
				if(SourceCheckA[2]=="?"){
					//it has the beast
					//we must be cautious
					//has it been thus gifted for jsapi magic?
					var regex2 = /enablejsapi=1/;
					var SourceCheckB = vidSrc.match(regex2);
					if(SourceCheckB){
						//it has the gift
						//accept it and move on
					}else{
						//we shall embrace our foe 
						//and provide it with stardust
						vidSrc = vidSrc + "&enablejsapi=1";
					}
					//but has the beast an origin
					//where it pulled itself from its dank pit
					var regex2 = /origin=.*/;
					var SourceCheckC = vidSrc.match(regex2);
					if(SourceCheckC){
						for (j=0; j<SourceCheckC.length; j++) {
							//Ah but it has an origin and we shall change it
							//waving our hands we create a new origin
							//as there is no place like window.location.hostname
							newOrigin = "origin=" + window.location.hostname;
							var vidSrc = vidSrc.replace(regex2,newOrigin);
						}
					}else{
						//but nay it was homeless
						//sad and alone
						//we shall embrace it and drape it 
						//in our warm cloth
						vidSrc = vidSrc + "&origin=" + window.location.hostname;
					}
				}else{
					//It is missing the mark of the parameter entirely
					//this is not unexpected
					//we shall garb it in the clothing of our homeland
					//and provide it with it's magic for battle
					vidSrc = vidSrc + "?enablejsapi=1&origin=" + window.location.hostname;
				}
				//We reaffirm the source unto itself
				//tho it may cause a stutter
				//silence the next line should you incorporate 
				//no magic or origins
				video.attr('src', vidSrc);
			}
			//We shall check the source
			//lo ere the response incorrect
			//we shall ignore it.
			//Once we did this brutally
			//with the ham fist of strange logic
			//until Nicole did deliver this
			//upon the blog comments
			//http://www.lunametrics.com/blog/2012/10/22/automatically-track-youtube-videos-events-google-analytics/
			//the wonders of Reg Ex
			var regex = /(?:https?:)?\/\/www\.youtube\.com\/embed\/([\w-]{11})(?:\?.*)?/;
			var matches = vidSrc.match(regex);
			//Should the former reg provide a match
			//it shall appear in an array of matches
			if(matches && matches.length > 1){
				//we now place the beating heart of the youtube id
				//in our first heavenly array
				videoArray[i] = matches[1];
				//and then mark the vile iframe beast
				//with the id of this video so that all
				//may know it, and reference it
				video.attr('id', matches[1]);	
				//And Then Alex Moore came forth
				//and said 'lo this ID is a jumble
				//we should provide a more meaningful title
				//soas to tell the nobles from the brigands
				//as we now can through my faithful 
				//json. Attend and be amazed!				
				getRealTitles(i);
				//And for this, I am no longer nothing, I am more
				i++;			
			}
		}
	});	
}
//To obtain the real titles of our noble videos
//rather than the gibberish jumble
//as provided to by the wizard Alex Moore
function getRealTitles(j) {
	if(showTitle==2){
		playerArray[j] = new YT.Player(videoArray[j], {
		    videoId: videoArray[j],
		    events: {
			    'onStateChange': onPlayerStateChange
			}
		});	
	}else{
		//We pray into the ether
		//harken oh monster of youtube 
		//tell us the truth of this noble video
	    var tempJSON = $.getJSON('http://gdata.youtube.com/feeds/api/videos/'+videoArray[j]+'?v=2&alt=json',function(data,status,xhr){
			//and lo the monster repsonds
			//it's whispers flowing as mist
			//through the mountain crag
		    videoTitle[j] = data.entry.title.$t;
			//and we now knowning it's truth
			//the truth of it's birth
			//we annoit it and place it on it's throne
			//as is provided by the documentation
			playerArray[j] = new YT.Player(videoArray[j], {
			    videoId: videoArray[j],
			    events: {
				    'onStateChange': onPlayerStateChange
				}
			});
	    });
	}
}
//once we started our story with a document ready
//from the jquery
//but oft this caused problems
//as the youtube monster would instantiate too quickly
//in a rush, it would beat the jquery to completetion
//and instantiate it's elements prior to our array
//so we wait. for the page to load fully
//which may cause problems with thy pages
//should your other elements not comply and load quickly
//forsooth they are the problem not i
$(window).load(function() {
    trackYouTube();
});
//Should one wish our monstrous video to play upon load
//we could set that here. But for us. We shall let it
//sleep. Sleep video. Await thy time.
function onPlayerReady(event) {
	//event.target.playVideo();
}
//And lo did Chris Green say
//upon the blog comments
//http://www.lunametrics.com/blog/2012/10/22/automatically-track-youtube-videos-events-google-analytics/
//Why not a pause flag
//one to prevent the terrors of the spammy
//pause events when a visitor
//doth drag the slide bar
//cross't thy player
//and all said huzzah
//let us start by setting his flag to false
//so that we know it is not true
var pauseFlagArray = new Array();
//When our caged monster wishes to act
//we are ready to hold it's chains
//and enslave it to our will.
function onPlayerStateChange(event) { 
	//Let us accept the player which was massaged
	//by the mousey hands of woman or man
	var videoURL = event.target.getVideoUrl();
	//We must strip from it, the true identity
	var regex = /v=(.+)$/;
	var matches = videoURL.match(regex);
	videoID = matches[1];
	//and prepare for it's true title
	thisVideoTitle = "";
	//we look through all the array
	//which at first glance may seem unfocused
	//but tis the off kilter response
	//from the magical moore json
	//which belies  this approach
	//Tis a hack? A kludge?
	//These are fighting words, sir!
	for (j=0; j<videoArray.length; j++) {
		//tis the video a match?
	    if (videoArray[j]==videoID) {
			//apply the true title!
	        thisVideoTitle = videoTitle[j]||"";
			console.log(thisVideoTitle);
			//should we have a title, alas naught else
			if(thisVideoTitle.length>0){
				if(showTitle==3){
					thisVideoTitle = thisVideoTitle + " | " + videoID;
				}else if(showTitle==2){
					thisVideoTitle = videoID;
				}
			}else{
				thisVideoTitle = videoID;
			}
			//Should the video rear it's head
            if (event.data == YT.PlayerState.PLAYING) {
				_gaq.push(['_trackEvent', 'Videos', 'Play', thisVideoTitle]); 
        	    //ga('send', 'event', 'Videos', 'Play', thisVideoTitle);
				//thy video plays
				//reaffirm the pausal beast is not with us
        		pauseFlagArray[j] = false;
        	} 
			//should the video tire out and cease
        	if (event.data == YT.PlayerState.ENDED){
				_gaq.push(['_trackEvent', 'Videos', 'Watch to End', thisVideoTitle]); 
        		//ga('send', 'event', 'Videos', 'Watch to End', thisVideoTitle);
        	} 
			//and should we tell it to halt, cease, heal.
			//confirm the pause has but one head and it flies not its flag
			//lo the pause event will spawn a many headed monster
			//with events overflowing
        	if (event.data == YT.PlayerState.PAUSED && pauseFlagArray[j] != true){
				_gaq.push(['_trackEvent', 'Videos', 'Pause', thisVideoTitle]); 
        		//ga('send', 'event', 'Videos', 'Pause', thisVideoTitle);
				//tell the monster it may have
				//but one head
        		pauseFlagArray[j] = true;
        	}
			//and should the monster think, before it doth play
			//after we command it to move
        	if (event.data == YT.PlayerState.BUFFERING){
				_gaq.push(['_trackEvent', 'Videos', 'Buffering', thisVideoTitle]); 
        		//ga('send', 'event', 'Videos', 'Buffering', thisVideoTitle);
        	}
			//and should it cue
			//for why not track this as well.
        	if (event.data == YT.PlayerState.CUED){
				_gaq.push(['_trackEvent', 'Videos', 'Cueing', thisVideoTitle]); 
        		//ga('send', 'event', 'Videos', 'Cueing', thisVideoTitle);
        	}

	    }
	}
} 
//fin