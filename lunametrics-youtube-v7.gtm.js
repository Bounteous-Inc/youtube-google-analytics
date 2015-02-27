/**
* LunaMetrics Google Analytics YouTube Tracking
* Uses the YouTube Iframe API to fire events
* to Google Analytics. Supports Google Tag Manager
* and IE8+ and tracks all YouTube videos available 
* on the page at the time of loading.
* 
* WARNING: Overwrites older <embed> style players
* and reloads improperly formatted <iframe> players
*/

// Put everything into an IIFE to prevent scope pollution
// and run the script automatically.
( function( document, window ) {

  // Check if something else already has bound to the onYouTubeIframeAPIReady callback
  // If it has, throw an error so we can see something's wrong
  if( typeof window.onYouTubeIframeAPIReady !== 'undefined' ) {

    var err = new Error( 'There is already a function defined at window.onYouTubeIframeAPIReady; aborting LunaMetrics Google Analytics YouTube Tracking', 'gtm-yt-tracker.js', '14' );
    throw err;

  }

  // This method is invoked by the YouTube API once it has
  // finished loading
  window.onYouTubeIframeAPIReady = function() {

    var iframes = document.getElementsByTagName( 'iframe' );
    var embeds  = document.getElementsByTagName( 'embed' );

    digestPotentialVideos( iframes );
    digestPotentialVideos( embeds );

  }

  // Load the YouTube API; If it is already loaded, browser will reference that
  var tag            = document.createElement( 'script' );
  tag.src            = '//www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName( 'script' )[0];
  firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

  // This object maps the numbers emitted by events from the API to string 'states'
  var playerStatesIndex = {

    '-1': 'Unstarted',
    '0' : 'Watch to End',
    '1' : 'Play',
    '2' : 'Pause',
    '3' : 'Buffering',
    '5' : 'Cueing'

  }

  /**
  * Process list of potential videos and hand qualified
  * objects to be uniformly formatted and attach
  * our events to them
  *
  * @param potentialVideos array objects
  */
  function digestPotentialVideos( potentialVideos ) {

    for( var i = 0; i < potentialVideos.length; i++ ) {

      // Returns true if the HTML elements src attribute indicates a YouTube video
      var isYouTubeVideo = checkIfYouTubeVideo( potentialVideos[ i ] );

      if( isYouTubeVideo ) {

        var normalizedYouTubeIframe = normalizeYouTubeIframe( potentialVideos[ i ] );
        addYouTubeEvents( normalizedYouTubeIframe );

      }

    }

  }

  /**
  * Checks if the object has an href that a 
  * YouTube video would have, and returns
  * true or false if it finds a match
  *
  * @param potentialYouTubeVideo object
  * @return true or false
  */
  function checkIfYouTubeVideo( potentialYouTubeVideo ) {

    // Fallback to '' if there is no src attribute, so our test
    // won't fail because src is undefined
    var potentialYouTubeVideoSrc = potentialYouTubeVideo.src || '';

    // If the video or embed src attribute references the URLs for
    // YouTube embeds, return true, otherwise return false
    if( potentialYouTubeVideo.src.indexOf( 'youtube.com/embed/' ) > -1 || 
        potentialYouTubeVideo.src.indexOf( 'youtube.com/v/' ) > -1 ) {

      return true;

    }

    return false;

  }

  /**
  * Checks if the YouTube video has all the required parameters for tracking,
  * and if it does not, it reloads it with the appropriate parameters. It will
  * reload videos that do not have the correct parameters and destroy old-style
  * <object> embeds and replace them with an <iframe>
  * WARNING: This may cause the video to briefly flicker on the page
  *
  * @param video iframe or embed
  * @return video object reference
  */
  function normalizeYouTubeIframe( youTubeVideo ) {

    // Create a fake <a> element to use the HREF apis and extract
    // our pathname, protocol, et. al.
    var a           = document.createElement( 'a' );
        a.href      = youTubeVideo.src;
        a.hostname  = 'www.youtube.com'
        a.protocol  = document.location.protocol;
        tmpPathname = a.pathname.charAt( 0 ) === '/' ? a.pathname : '/' + a.pathname;  // IE10 shim
    // For security reasons, YouTube wants an origin parameter set that matches our hostname
    var origin = window.location.protocol + '%2F%2F' + window.location.hostname

    // If enablejsapi=1 isn't present in our URL, we need to add it,
    // otherwise the YouTube iframe script won't try and track the video
    if( a.search.indexOf( 'enablejsapi' ) === -1 ) {

      a.search = a.search.length > 0 ? a.search + '&enablejsapi=1' : a.search = 'enablejsapi=1&origin=' + origin;

    }

    // If the origin= parameter isn't set to document.hostname, the
    // YouTube tracking script will throw origin errors
    if( a.search.indexOf( 'origin' ) === -1 ) {

      a.search = a.search + '&origin=' + origin;;

    }

    // If our video is actually a flash object, transform it to an iframe
    if( youTubeVideo.type === 'application/x-shockwave-flash' ) {

      var newIframe     = document.createElement( 'iframe' );
      newIframe.height  = youTubeVideo.height;
      newIframe.width   = youTubeVideo.width;

      tmpPathname = '/embed/' + youTubeVideo.videoId;

      // Replace our old <object> in the DOM with our new iframe
      youTubeVideo.parentNode.parentNode.replaceChild( newIframe, youTubeVideo.parentNode );

      youTubeVideo = newIframe;

    }

    // Put it all together and send it back
    a.pathname = tmpPathname;
    youTubeVideo.src        = a.href + a.hash;
    youTubeVideo.pauseFlag  = false;

    // Playlists will emit extra events we don't want to
    // track between videos. These properties are added
    // when we detect a playlsit parameter and used later
    // in the checkIfEventShouldFire function
    if( a.search.indexOf( 'playlist=' ) > -1 ) {

      youTubeVideo.playlist = true;
      youTubeVideo.watchToEndCount = 0;

    }

    // Send back our retrofitted video object
    // to be decorated with events
    return youTubeVideo;

  }

  /**
  * Creates a new Player object for each video
  * detected on the page and binds to the onStateChange
  * event emitted  by the YouTube API and checks if we
  * should emit the event to Google Analytics.
  * 
  * @param iframe object
  */
  function addYouTubeEvents( youTubeIframe ) {
    
    // Create a locally scoped new YT.Player for each iframe
    var player = new YT.Player( youTubeIframe, {

      events: {

        onStateChange: function( evt ) {

          // Create a closure with our handler, event, and youTubeIframe
          onStateChangeHandler( evt, youTubeIframe );

        }

      }

    } );

  };

  /**
  * Function we bind to the onStateChange event from the YouTube API
  *
  * @param evt object
  * @param iframe object
  */
  function onStateChangeHandler( evt, youTubeIframe ) {

    var state          = playerStatesIndex[ evt.data ];  // Determine state text from event number
    var targetVideoUrl = evt.target.getVideoUrl();       // Get the URL that the event targes
    var targetVideoId  = targetVideoUrl.match( /[?&]v=([^&#]*)/ )[ 1 ];  // Extract the ID    
    // Determine if we should fire an event at all
    var shouldEventFire = checkIfEventShouldFire( evt.data, youTubeIframe );
    // Update flags depending on current state
    interpretState( evt.data, youTubeIframe );  

    if( shouldEventFire ) {

      // Fetch the Video Title, or fallback to the Video ID
      getVideoTitle( youTubeIframe, targetVideoId, function( videoTitle ) {          
  
        // Reassign our title and ID, in case they change
        youTubeIframe.videoTitle = videoTitle;
        youTubeIframe.videoId    = targetVideoId;

        fireAnalyticsEvent( youTubeIframe, state )
        
      } );

    }

  }

  /**
  * Function that fires our event to Google Analytics
  *
  * @param iframe object
  * @param state number
  */
  function fireAnalyticsEvent( youTubeIframe, state ) {

    // Send an event to the dataLayer with our event info
    window.dataLayer.push( {

      'event'     : 'youTubeTrack',
      'attributes': {

        'videoName'  : youTubeIframe.videoTitle,
        'videoAction': state

      }

    } );

  }

  /**
  * Fetch the video title from the YouTube data API,
  * then invoke the callback function passed in as an
  * argument, passing it the videos title. If the AJAX 
  * request fails, we pass back the video ID instead.
  * Timeout is set at 5 seconds to prevent getting
  * stuck waiting for the response to come back.
  *
  * @param video object
  * @param targetVideoId string
  * @param callback object
  */
  function getVideoTitle( video, targetVideoId, callback ) {

    // Playlists reference the ID of the NEXT video in the list
    // when firing the Watch To End event. We use video.lockVideoTitle
    // to prevent accidentally switching titles. We set the lock in our
    // interpretState function.
    if( video.videoId !== targetVideoId && !video.lockVideoTitle ) {

      // Fallback timer in case something goes wrong with our AJAX request
      var timeoutCounter = setTimeout( function( targetVideoId ) { 

        callback( targetVideoId ); 

      }, 5000 );

      // If we detect the videoTitle is still the videoId,
      // try and get the title instead, then call our callback function
      ajax( "//gdata.youtube.com/feeds/api/videos/" + targetVideoId + "?v=2&alt=json", function( responseText ) {
  
        var data = eval( '[' + responseText + ']' );

        // Let's make sure we've got actual data, not garbage
        if( typeof data === 'object' && data.length > 0 ) {

          // Clear our fallback timer
          clearTimeout( timeoutCounter );
          callback( data[0].entry.title.$t );

        }

      } );

    } else {

      // If we're still on the same title, proceed to our callback
      callback( video.videoTitle );

    }

  }

  /**
  * Function that checks the state of our iframes attributes
  * and the latest event emitted by the API to determine
  * whether we want to fire an event or not. Handles many
  * wrinkles in YouTube iframe API.
  *
  * @param stateIndex number
  * @param iframe object
  * @return true or false
  */
  function checkIfEventShouldFire( stateIndex, youTubeIframe ) {

    if( stateIndex === 0 ) {

      // Edge case for playlists; playlists emit
      // Unstarted, Buffering, Watch To End
      // between video loads
      if( youTubeIframe.playlist ) {
        
        youTubeIframe.watchToEndCount++

      }

    }

    // Edge case handler for playlists
    // Playlists emit Unstarted, Buffering, Watch to End
    // Between videos. This counts the number of watch to ends
    // within the iframe and only fires events on odd counts
    if( youTubeIframe.playlist && youTubeIframe.watchToEndCount % 2 === 1 ) {

      return false;

    }

    // If we see a PAUSE event, but the video wasn't
    // playing, ignore it. This prevents event spam
    // from moving the scrobbler along the video
    if( stateIndex === 2 && youTubeIframe.pauseFlag ) {

      return false;

    }
    
    return true;

  }

  /**
  * Adjusts the iframes playback attributes
  * depending on the state of the player and
  * the event emitted from the YouTube API
  *
  * @param stateIndex number
  * @param iframe object
  */
  function interpretState( stateIndex, youTubeIframe ) {
  
    // Playlists reference NEXT video in the playlist
    // when firing the Watch To End event, so we lock
    // it before the getVideoTitle function fires to
    // keep our title the same. On any other hit type,
    // we can unlock the title so that it will change
    if( youTubeIframe.lockVideoTitle ) {

      youTubeIframe.lockVideoTitle = false;

    }
  
    // Playlists reference NEXT video in the playlist
    // when firing the Watch To End event, so we lock
    // it before the getVideoTitle function fires to
    // keep our title the same
    if( stateIndex === 0 ) {
  
      youTubeIframe.lockVideoTitle = true; 

    }

    // Users can accidentally fire pause events
    // so we set a flag when a Pause event is fired
    if( stateIndex === 2 ) {

      youTubeIframe.pauseFlag = true;

    }

    // Users can accidentally fire pause events
    // so we set a flag when a Play event is fired
    // We won't fire a pause event unless the
    // play event was set
    if( stateIndex === 1 ) {

      youTubeIframe.pauseFlag = false;

    }

  }

  /**
  * Utility: IE 8+, Firefox, Opera, Chrome, Safari XDR object
  *
  * modified from code courtesy github user xeoncross
  * https://gist.github.com/Xeoncross/7663273 
  * @param string url
  * @param object callback
  * @param mixed data
  * @param null x
  */
  // Modified to remove headers causing CORS errors
  // Modified to use XDomainRequest
  // IE>8 does not support XDomainRequests
  function ajax(url, callback, data, x) {

    try {
      // Cross-browser hoop for IE8 & IE9
      if( 'XDomainRequest' in window && window.XDomainRequest !== null ) {

        var x = new XDomainRequest();
            x.open('GET', url, 1);
            x.onload = function() {

              callback(x.responseText, x);

            };
            x.send();

      } else {
        // Cross-Browser hoop for IE8 & IE9
        var x = new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
            x.open('GET', url, 1);
            x.onreadystatechange = function () {

              x.readyState > 3 && callback && callback(x.responseText, x);

            };
            x.send(data)

      }

    } catch (e) {
      // If we can't invoke our call, log it to console
      window.console && console.log(e.message);

    }

  };
    
} )( document, window );