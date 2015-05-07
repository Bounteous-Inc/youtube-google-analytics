( function( document, window, config ) {

  if( typeof window.onYouTubeIframeAPIReady !== 'undefined' ) {

    var err = new Error( 'There is already a function defined at window.onYouTubeIframeAPIReady; aborting LunaMetrics Google Analytics YouTube Tracking', 'lunametrics-youtube.js' );
    throw err;

  }
  
  var config             = typeof config === 'object' ? config : {};
  var gaTypeOverride     = config.gaTypeOverride || 0;
  var defaultEventsFired = config.defaultEventsFired ||  {

    'Unstarted'   : false,
    'Watch to End': true,
    'Play'        : true,
    'Pause'       : true,
    'Buffering'   : false,
    'Cueing'      : false

  };
  
  //*****//
  // DO NOT EDIT ANYTHING BELOW THIS LINE EXCEPT "OPT_CONFIG_OBJ"
  //*****//

  // Invoked by the YouTube API when it's ready
  window.onYouTubeIframeAPIReady = function() {

    var iframes = document.getElementsByTagName( 'iframe' );
    var embeds  = document.getElementsByTagName( 'embed' );

    digestPotentialVideos( iframes );
    digestPotentialVideos( embeds );

  };

  var tag            = document.createElement( 'script' );
  tag.src            = '//www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName( 'script' )[0];
  firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

  var playerStatesIndex = {

    '-1': 'Unstarted',
    '0' : 'Watch to End',
    '1' : 'Play',
    '2' : 'Pause',
    '3' : 'Buffering',
    '5' : 'Cueing'

  };

  // Take our videos and turn them into trackable videos with events
  function digestPotentialVideos( potentialVideos ) {

    for( var i = 0; i < potentialVideos.length; i++ ) {

      var isYouTubeVideo = checkIfYouTubeVideo( potentialVideos[ i ] );

      if( isYouTubeVideo ) {

        var normalizedYouTubeIframe = normalizeYouTubeIframe( potentialVideos[ i ] );
        addYouTubeEvents( normalizedYouTubeIframe );

      }

    }

  }

  // Determine if the element is a YouTube video or not
  function checkIfYouTubeVideo( potentialYouTubeVideo ) {

    var potentialYouTubeVideoSrc = potentialYouTubeVideo.src || '';

    if( potentialYouTubeVideoSrc.indexOf( 'youtube.com/embed/' ) > -1 || 
        potentialYouTubeVideoSrc.indexOf( 'youtube.com/v/' ) > -1 ) {

      return true;

    }

    return false;

  }

  // Turn <embeds> into <iframes> and ensure they have the right parameters
  function normalizeYouTubeIframe( youTubeVideo ) {

    var a           = document.createElement( 'a' );
        a.href      = youTubeVideo.src;
        a.hostname  = 'www.youtube.com';
        a.protocol  = document.location.protocol;
    var tmpPathname = a.pathname.charAt( 0 ) === '/' ? a.pathname : '/' + a.pathname;  // IE10 shim
    
    // For security reasons, YouTube wants an origin parameter set that matches our hostname
    var origin = window.location.protocol + '%2F%2F' + window.location.hostname;

    if( a.search.indexOf( 'enablejsapi' ) === -1 ) {

      a.search = a.search.length > 0 ? a.search + '&enablejsapi=1' : a.search = 'enablejsapi=1&origin=' + origin;

    }

    if( a.search.indexOf( 'origin' ) === -1 ) {

      a.search = a.search + '&origin=' + origin;

    }

    if( youTubeVideo.type === 'application/x-shockwave-flash' ) {

      var newIframe     = document.createElement( 'iframe' );
      newIframe.height  = youTubeVideo.height;
      newIframe.width   = youTubeVideo.width;

      tmpPathname = '/embed/' + youTubeVideo.videoId;

      youTubeVideo.parentNode.parentNode.replaceChild( newIframe, youTubeVideo.parentNode );

      youTubeVideo = newIframe;

    }

    a.pathname       = tmpPathname;
    youTubeVideo.src = a.href + a.hash;

    return youTubeVideo;

  }

  // Add event handlers for events emitted by the YouTube API
  function addYouTubeEvents( youTubeIframe ) {

    youTubeIframe.pauseFlag  = false;

    // Playlists event garbage events; this handles those
    if( youTubeIframe.src.indexOf( 'playlist=' ) > -1 ) {

      youTubeIframe.playlist = true;
      youTubeIframe.watchToEndCount = 0;

    }
    
    new YT.Player( youTubeIframe, {

      events: {

        onStateChange: function( evt ) {

          onStateChangeHandler( evt, youTubeIframe );

        }

      }

    } );

  }

  // Event handler for events emitted from the YouTube API
  function onStateChangeHandler( evt, youTubeIframe ) {

    var state           = playerStatesIndex[ evt.data ];
    var targetVideoUrl  = evt.target.getVideoUrl();
    var targetVideoId   = targetVideoUrl.match( /[?&]v=([^&#]*)/ )[ 1 ];  // Extract the ID    
    var shouldEventFire = checkIfEventShouldFire( evt.data, youTubeIframe );
    interpretState( evt.data, youTubeIframe );  

    if( shouldEventFire ) {

      getVideoTitle( youTubeIframe, targetVideoId, function( videoTitle ) {          
  
        youTubeIframe.videoTitle = videoTitle;
        youTubeIframe.videoId    = targetVideoId;

        fireAnalyticsEvent( youTubeIframe, state );
        
      } );

    }

  }

  // Fire an event to Google Analytics or Google Tag Manager
  function fireAnalyticsEvent( youTubeIframe, state ) {

    var videoName = youTubeIframe.videoTitle;

    if( typeof window.dataLayer !== 'undefined' && !gaTypeOverride ) { 

      window.dataLayer.push( {

        'event'     : 'youTubeTrack',
        'attributes': {

          'videoName'  : videoTitle,
          'videoAction': state

        }

      } );

    } else if( defaultEventsFired[ state ] ) {

      if( typeof window.ga === 'function' && typeof window.ga.getAll === 'function' && gaTypeOverride !== 2 ) {

        window.ga( 'send', 'event', 'Videos', state, videoTitle, 0, false );

      } else if( typeof window._gaq !== 'undefined' && gaTypeOverride !== 1 ) {

        window._gaq.push( [ '_trackEvent', 'Videos', state, videoTitle ] );

      }

    }

  }

  // Get the title of our video
  function getVideoTitle( video, targetVideoId, callback ) {

    if( video.videoId !== targetVideoId && !video.lockVideoTitle ) {

      var timeoutCounter = setTimeout( function( targetVideoId ) { 

        callback( targetVideoId ); 

      }, 5000 );

      ajax( "//gdata.youtube.com/feeds/api/videos/" + targetVideoId + "?v=2&alt=json", function( responseText ) {
  
        var data = eval( '[' + responseText + ']' );

        if( typeof data === 'object' && data.length > 0 ) {

          clearTimeout( timeoutCounter );
          callback( data[0].entry.title.$t );

        }

      } );

    } else {

      callback( video.videoTitle );

    }

  }

  // Determine if we should fire a Google Analytics/GTM event when a YouTube 
  // event is emitted
  function checkIfEventShouldFire( stateIndex, youTubeIframe ) {

    if( stateIndex === 0 ) {

      // Edge case for playlists
      if( youTubeIframe.playlist ) {
        
        youTubeIframe.watchToEndCount++;

      }

    }

    // Edge case handler for playlists
    if( youTubeIframe.playlist && youTubeIframe.watchToEndCount % 2 === 1 ) {

      return false;

    }

    // If we see a PAUSE event, but the video wasn't playing, ignore it
    if( stateIndex === 2 && youTubeIframe.pauseFlag ) {

      return false;

    }
    
    return true;

  }

  // Interpret the state passed by the YouTube event
  function interpretState( stateIndex, youTubeIframe ) {
  
    // Playlists edge case handler
    if( youTubeIframe.lockVideoTitle ) {

      youTubeIframe.lockVideoTitle = false;

    }
  
    // Playlist edge case handler
    if( stateIndex === 0 ) {
  
      youTubeIframe.lockVideoTitle = true; 

    }

    if( stateIndex === 2 ) {

      youTubeIframe.pauseFlag = true;

    }

    if( stateIndex === 1 ) {

      youTubeIframe.pauseFlag = false;

    }

  }

  // Utility for making AJAX calls
  function ajax(url, callback, data, x) {

    try {

      if( 'XDomainRequest' in window && window.XDomainRequest !== null ) {

        var x = new XDomainRequest();
            x.open('GET', url, 1);
            x.onload = function() {

              callback(x.responseText, x);

            };
            x.send();

      } else {

        var x = new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
            x.open('GET', url, 1);
            x.onreadystatechange = function () {

              x.readyState > 3 && callback && callback(x.responseText, x);

            };
            x.send(data);

      }

    } catch (e) {

      window.console && console.log(e.message);

    }

  }
    
} )( document, window, "OPT_CONFIG_OBJ" );
/**
 * "OPT_CONFIG_OBJ" can be replaced with an object
 * to modify default behavior
 *
 * @property gaTypeOverride number
 * Forces script to use Classic (2) or Universal(1)
 * Default: 0
 *
 * @property defaultEventsFired object
 * Defines which events emitted by YouTube API
 * will be turned into Classic or Universal events
 * Default: {
 *   'Unstarted'   : false,
 *   'Watch to End': true,
 *   'Play'        : true,
 *   'Pause'       : true,
 *   'Buffering'   : false,
 *   'Cued'        : false
 * }
 */
