( function( document, window, config ) {

  if( typeof window.onYouTubeIframeAPIReady !== 'undefined' ) {

    var err = new Error( 'There is already a function defined at window.onYouTubeIframeAPIReady; aborting LunaMetrics Google Analytics YouTube Tracking', 'lunametrics-youtube.js' );
    throw err;

  }
  
  var _config     = config !== "OPT_CONFIG_OBJ" ? config : {};
  var forceSyntax = _config.forceSyntax || 0;
  var eventsFired = _config.events ||  {

    'Unstarted'   : false,
    'Watch to End': true,
    'Play'        : true,
    'Pause'       : true,
    'Buffering'   : false,
    'Cueing'      : false

  };

  // Set default events if they are unspecified
  if( typeof eventsFired[ 'Play' ] === 'undefined' ) {

    eventsFired[ 'Play' ] = true;

  }


  if( typeof eventsFired[ 'Pause' ] === 'undefined' ) {

    eventsFired[ 'Pause' ] = true;
    
  }

  if( typeof eventsFired[ 'Watch to End' ] === 'undefined' ) {

    eventsFired[ 'Watch to End' ] = true;
    
  }
  
  //*****//
  // DO NOT EDIT ANYTHING BELOW THIS LINE EXCEPT "OPT_CONFIG_OBJ" AT THE BOTTOM
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

    var stateIndex      = evt.data;
    var targetVideoUrl  = evt.target.getVideoUrl();
    var targetVideoId   = targetVideoUrl.match( /[?&]v=([^&#]*)/ )[ 1 ];  // Extract the ID    
    var currentState    = youTubeIframe.currentState;

    // Playlist edge-case handler
    if( stateIndex === -1 && currentState ) {

      // Don't fire unstarted events when we've got a previous state stored
      youTubeIframe.lockVideoId = true;
      return false;

    }

    // Playlist edge-case handler
    if( stateIndex === 3 && youTubeIframe.lockVideoId ) {

      // Don't fire a Buffering event when we're between videos
      return false;

    }

    if( !youTubeIframe.lockVideoId ) {

      // The API returns the next playlist video's ID prematurely, so we lock it
      youTubeIframe.videoId = targetVideoId;

    }

    if( stateIndex === 0 ) {

      youTubeIframe.lockVideoId = false;

    }

    fireAnalyticsEvent( youTubeIframe.videoId, stateIndex );

    // We store the current state for comparison later
    youTubeIframe.currentState = stateIndex;

  }

  // Fire an event to Google Analytics or Google Tag Manager
  function fireAnalyticsEvent( videoId, stateIndex ) {

    var playerStatesIndex = {

      '-1': 'Unstarted',
      '0' : 'Watch to End',
      '1' : 'Play',
      '2' : 'Pause',
      '3' : 'Buffering',
      '5' : 'Cueing'

    };

    var state = playerStatesIndex[ stateIndex ];
    var videoUrl = 'https://www.youtube.com/watch?v=' + videoId;

    if( typeof window.dataLayer !== 'undefined' && !forceSyntax ) { 

      window.dataLayer.push( {

        'event'     : 'youTubeTrack',
        'attributes': {

          'videoUrl': videoUrl,
          'videoAction': state

        }

      } );

    } else if( eventsFired[ state ] ) {

      if( typeof window.ga === 'function' && typeof window.ga.getAll === 'function' && forceSyntax !== 2 ) {

        window.ga( 'send', 'event', 'Videos', state, videoUrl, 0 );

      } else if( typeof window._gaq !== 'undefined' && forceSyntax !== 1 ) {

        window._gaq.push( [ '_trackEvent', 'Videos', state, videoUrl ] );

      }

    }

  }
    
} )( document, window, "OPT_CONFIG_OBJ" );
/*
 * "OPT_CONFIG_OBJ" can be replaced with an object
 * to modify default behavior, e.g.:
 *
 * {
 *   'events': {
 *     'Unstarted': true,
 *     'Watch to End': false;
 *   },
 *   forceSyntax: 1
 * }
 *
 * @property forceSyntax int 0, 1, or 2
 * Forces script to use Classic (2) or Universal(1)
 *
 * Default: 0
 *
 * @property events object
 * Defines which events emitted by YouTube API
 * will be turned into Google Analytics or GTM events
 * 
 * Defaults:
 * 'events': {
 *   'Unstarted'   : false,
 *   'Watch to End': true,
 *   'Play'        : true,
 *   'Pause'       : true,
 *   'Buffering'   : false,
 *   'Cued'        : false
 * }
 */
