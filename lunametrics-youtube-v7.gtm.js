;( function( document, window, config ) {

  'use strict';

  window.onYouTubeIframeAPIReady = (function() {
    
    var cached = window.onYouTubeIframeAPIReady;

    return function() {
        
      if(cached) {
        cached.apply(this, arguments);
      }

      init(); 

    }

  })();
  
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
  var percentageTracking = parseInt(_config.percentageTracking, 10) || 20; 

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
  function init() {

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

  function getMarks(player) {

    var number = 100 / percentageTracking;
    var duration = player.getDuration();
    var increments = duration / number;
    var marks = {}; 

    for(i = 1; i < number; i++) {
      
      var _mark = (i * percentageTracking) + '%';
      marks[_mark] = parseInt(increments * i, 10); 
      // Prevents event from firing on unconfigured Classic/Universal implementations
      if(_config.percentageTracking) {
        eventsFired[_mark] = true;
      }
    }   

    return marks;

  }

  function checkCompletion(player, marks, videoId) {

    var duration = player.getDuration();
    var currentTime = player.getCurrentTime();
    var playbackRate = player.getPlaybackRate();
    player.durationCache = player.durationCache || {};

    for( key in marks ) {

      if( marks[key] <= currentTime && !player.durationCache[key] ) {
        
        player.durationCache[key] = true;
        fireAnalyticsEvent( videoId, key );

      }

    }

  }

  // Event handler for events emitted from the YouTube API
  function onStateChangeHandler( evt, youTubeIframe ) {

    var stateIndex     = evt.data;
    var player         = evt.target;
    var targetVideoUrl = player.getVideoUrl();
    var targetVideoId  = targetVideoUrl.match( /[?&]v=([^&#]*)/ )[ 1 ];  // Extract the ID    
    var currentState   = youTubeIframe.currentState;
    var playerState = player.getPlayerState();
    var marks = getMarks(player);

    if(playerState === 1 && !youTubeIframe.timer) {

      clearInterval(youTubeIframe.timer);

      youTubeIframe.timer = setInterval(function() {
        checkCompletion(player, marks, youTubeIframe.videoId);
      }, 1000);

    } else {

      clearInterval(youTubeIframe.timer);
      youTubeIframe.timer = false;

    }

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

    var playerStatesIndex = {

      '-1': 'Unstarted',
      '0' : 'Watch to End',
      '1' : 'Play',
      '2' : 'Pause',
      '3' : 'Buffering',
      '5' : 'Cueing'

    };

    var state = playerStatesIndex[ stateIndex ];

    fireAnalyticsEvent( youTubeIframe.videoId, state );

    // We store the current state for comparison later
    youTubeIframe.currentState = stateIndex;

  }

  // Fire an event to Google Analytics or Google Tag Manager
  function fireAnalyticsEvent( videoId, state ) {

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

        window.ga( 'send', 'event', 'Videos', state, videoUrl );

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
 *   'events': {  // Don't fire the Watch To End event, but fire Unstarted events
 *     'Unstarted': true,
 *     'Watch to End': false;
 *   },
 *   forceSyntax: 1, // Force the script to use Universal Analytics
 *   percentageTracking: 20  // Every 20% increment viewed, fire an event
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
 *
 * @property percentageTracking number
 * Fires events every n% completed, where n
 * is an integer you specify
 *
 * Default: Disabled
 * 
 */
