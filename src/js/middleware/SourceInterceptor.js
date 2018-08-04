'use strict';

var _ = require('underscore'),
    events = require('../events');

module.exports = function(videojs) {

   videojs.use('*', function(player) {

      return {
        callPlay: function callPlay() {
          // Block play calls while waiting for an ad, only if this is an
          // ad supported player
          if (player.playlist && player.playlist.totalPlayedCount_ && player.playlist.totalPlayedCount_ != 0) {
            if (player.ads && player.ads._shouldBlockPlay === true) {
              player.ads.debug('Using playMiddleware to block content playback');
              player.ads._playBlocked = true;
              return videojs.middleware.TERMINATOR;
            }
          }
        },

        play: function play(terminated, value) {
          if (player.ads && player.ads._playBlocked && terminated) {
            player.ads.debug('Play call to Tech was terminated.');
            // Trigger play event to match the user's intent to play.
            // The call to play on the Tech has been blocked, so triggering
            // the event on the Player will not affect the Tech's playback state.
            player.trigger('play');
            // At this point the player has technically started
            player.addClass('vjs-has-started');
            // Reset playBlocked
            player.ads._playBlocked = false;
          }
        },

         setSource: function(playerSelectedSource, next) {
            var sources = player.currentSources(),
                userSelectedSource, chosenSource;

            if (player._qualitySelectorSafeSeek) {
               player._qualitySelectorSafeSeek.onPlayerSourcesChange();
            }

            // There are generally two source options, the one that videojs
            // auto-selects and the one that a "user" of this plugin has
            // supplied via the `selected` property. `selected` can come from
            // either the `<source>` tag or the list of sources passed to
            // videojs using `src()`.

            userSelectedSource = _.find(sources, function(source) {
               // Must check for both boolean and string 'true' as sources set
               // programmatically should use a boolean, but those coming from
               // a `<source>` tag will use a string.
               return source.selected === true || source.selected === 'true';
            });

            chosenSource = userSelectedSource || playerSelectedSource;

            player.trigger(events.QUALITY_SELECTED, chosenSource);

            // Pass along the chosen source
            next(null, chosenSource);
         },

      };

   });

};
