# YouTube Google Analytics & GTM Plugin

<strong>As of 9/12/17, Google Tag Manager offers native support for tracking YouTube videos (including proper titles!). If you're looking to use GTM to track YouTube videos, we'd recommend using their native integration over our script.</strong>

This is a plug-and-play tracking solution for tracking user interaction with YouTube videos in Google Analytics. It will detect if GTM, Universal Analytics, or Classic Analytics is installed on the page, in that order, and use the first syntax it matches unless configured otherwise. It include support for delivering hits directly to Universal or Classic Google Analytics, or for pushing Data Layer events to be used by Google Tag Manager.

Once installed, the plugin will fire events with the following settings:
- Event Category: Videos
- Event Action: *&lt;Action, e.g. Play, Pause&gt;*
- Event Label: *&lt;URL of the video&gt;*

By default, the plugin will track Play, Pause, Watch to End, and 10%, 25%, 50%, 75% , and 90% viewed events. The plugin can be configured to track whatever percentages are desired and/or not track Play, Pause, or Watch to End events.

The plugin will automatically bind to all videos on the page on DOMContentLoaded (window.load on IE8). The plugin will also bind to videos added inserted dynamically after DOMContentLoaded, as long as the following parameters are present in the <code>src</code> attribute of the <code>iframe</code>, e.g.:

    <iframe src="https://www.youtube.com/embed/M7lc1UVf-VE?enablejsapi=1&origin=http%3A%2F%2Fwww.example.com"></iframe>    

## Installation & Documentation

For installation instructions and complete documentation, visit [http://www.lunametrics.com/labs/recipes/youtube-tracking/#documentation](http://www.lunametrics.com/labs/recipes/youtube-tracking/#documentation).

## License

Licensed under the MIT License. For a complete copy of the license, please refer to the LICENSE.md file included with this repository.

## Acknowledgements

Created by the honest folks at [LunaMetrics](http://www.lunametrics.com/), a digital marketing & Google Analytics consultancy. For questions, please drop us a line here or [on our blog](http://www.lunametrics.com/blog/2015/05/11/updated-youtube-tracking-google-analytics-gtm/).

Written by [Dan Wilkerson](https://twitter.com/notdanwilkerson). Versions 1 - 6 written by [Sayf Sharif](https://twitter.com/sayfsharif).
