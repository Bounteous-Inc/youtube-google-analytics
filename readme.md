# YouTube Google Analytics & GTM Plugin

This is a plug-and-play tracking solution for tracking user interaction with YouTube videos in Google Analytics. It will detect if GTM, Universal Analytics, or Classic Analytics is installed on the page, in that order, and use the first syntax it matches unless configured otherwise. It include support for delivering hits directly to Universal or Classic Google Analytics, or for pushing Data Layer events to be used by Google Tag Manager.

Once installed, the plugin will fire events with the following settings:
- Event Category: Videos
- Event Action: *&lt;Action, e.g. Play, Pause&gt;*
- Event Label: *&lt;URL of the video&gt;*

## Installation

**Note:** This plugin relies on the window.onYouTubeIframeAPIReady namespace and will throw an error if it is currently in use by another script. Check the console for an error if it appears to not be working, and ensure you aren't already trying to track YouTube videos with other code.

### Universal or Classic Google Analytics Installation:

The plugin is designed to be plug-and-play. By default, the plugin will try and detect if you have Google Tag Manager, Universal Analytics, or Classic Google Analytics, and use the appropriate syntax for the event. If you are **not** using Google Tag Manager to fire your Google Analytics code, store the plugin on your server and include the lunametrics-youtube-v7.gtm.js script file somewhere on the page.

    <script src="/somewhere-on-your-server/lunametrics-youtube-v7.gtm.js"></script>

### Google Tag Manager Installation
Create a new Custom HTML tag and paste in the below:

    <script type="text/javascript" id="gtm-youtube-tracking">
      // script file contents go here
    </script>

In the space between the **&lt;script&gt;** and **&lt;/script&gt;** tags, paste in the contents of the lunametrics-youtube-v7.gtm.js script, found [here](https://raw.githubusercontent.com/lunametrics/youtube-google-analytics/master/lunametrics-youtube-v7.gtm.js).

**You need to add a Google Analytics Event tag that acts upon the pushes to the Data Layer the plugin executes.** Follow the steps in the [Google Tag Manager Configuration](#google-tag-manager-configuration) section for help on getting this set up.

## Configuration

### Universal or Classic Google Analytics Configuration

#### Configuring Which Events Fire
If you are **not** using Google Tag Manager to fire your Google Analytics code, you might want to configure the script to fire or not fire certain events. By default, it will fire:
- Play events
- Pause events
- Watch to End events

To change which events are fired, edit the events property of the configuration at the end of the script. For example, if you'd like to fire Buffering events:

    ( function( document, window, config ) {
    
       // ... the tracking code

    } )( document, window, {
      'events': {
        'Play': true,
        'Pause': true,
        'Watch to End': true,
        'Buffering': true
      }
    } );

The available events are **Play, Pause, Watch to End, Buffering, Unstarted, and Cueing**. An example configuration object is at the bottom of the script file.

#### Forcing Universal or Classic Analytics

By default, the plugin will try and fire Data Layer events, then fallback to Univeral Analytics events, then fallback to Classic Analytics events. If you want to force the script to use a particular syntax for your events, you can set the 'forceSyntax' property of the configuration object to an integer:
    
    ( function( document, window, config ) {
    
       // ... the tracking code

    } )( document, window, {
      'forceSyntax': 1
    } );

Setting this value to 0 will force the script to use Google Tag Manager events, setting it 1 will force it to use Universal Google Analytics events, and setting it to 2 will force it to use Classic Google Analytics events.

### Google Tag Manager Configuration

Once you've added the script to your container (see [Google Tag Manager Installation](#google-tag-manager-installation)), Data Layer events will occur for all of the following:

- Play
- Pause
- Watch to End
- Cueing
- Buffering
- Unstarted

Create the following Variables:

* Variable Name: videoUrl
    - Variable Type: Data Layer Variable
    - Data Layer Variable Name: attributes.videoUrl
    - This will be the URL of the video on YouTube

* Variable Name: videoAction
    - Variable Type: Data Layer Variable
    - Data Layer Variable Name: attributes.videoAction
    - This will be the action the user has taken, e.g. Play, Pause, or Watch to End

Create the following Triggers:

* Trigger Name: YouTube Video Event
    - Trigger Type: Custom Event
    - Event Name: youTubeTrack
    - Add Filters:
        - videoAction MATCHES REGEX *&lt;enter a pipe ('|') separated list of the actions you want to track, e.g. Play|Pause|Watch to End&gt;*

Create your Google Analytics Event tag

* Tag Type: Google Analytics
    - Choose a Tag Type: Universal Analytics (or Classic Analytics, if you are still using that)
    - Tracking ID: *&lt;Enter in your Google Analytics tracking ID&gt;*
    - Track Type: Event
    - Category: Videos
    - Action: {{videoAction}}
    - Label: {{videoUrl}}
    - Fire On: More
        - Choose from existing Triggers: YouTube Video Event

#### Configuring Which Events Fire

You can reconfigure the YouTube Video Event trigger anytime you'd like to track more of the events included, such as Cueing or Buffering. Remember that GTM events are not Google Analytics Events, and whether a GTM event sends data to Google Analytics is entirely up to how your Triggers are configured.

## License

Licensed under the Creative Commons 4.0 International Public License. Refer to the LICENSE.MD file in the repository for the complete text of the license.

## Acknowledgements

Created by the honest folks at [LunaMetrics](http://www.lunametrics.com/), a digital marketing & Google Analytics consultancy. For questions, please drop us a line here or [on our blog](http://www.lunametrics.com/blog/2015/05/11/updated-youtube-tracking-google-analytics-gtm/).

Written by [Sayf Sharif](https://twitter.com/sayfsharif) and updated by [Dan Wilkerson](https://twitter.com/notdanwilkerson).
