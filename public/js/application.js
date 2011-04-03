// # SoundCloud Premiere

// ## Set Default Options

// ### Basic Default Variables

// Declare some default variables that will be used in the application.

var consumer_key = "ePT3qXXTOjw4ZoZcN7ALQ",
		page_title = document.title,
		messageTimer = 0;

// ### SoundManager2 Default Options

// Set a few default options for SoundManager2

soundManager.url = soundmanager_url;
soundManager.flashVersion = 9;
soundManager.useFlashBlock = false;
soundManager.useHighPerformance = true;
soundManager.wmode = 'transparent';
soundManager.useFastPolling = true;

// ## Begin Initializing Player

// Wait for jQuery to load

$(function(){
	
	// Ping Bit.ly
	
	ping = new Image();
	
	ping.src = "http://bit.ly/sc-premiere-stats";
	
	// ## Create Player
	
	// Create Player, Header, and Message divs
	
	$("<div class='player'><div class='panel right'><div class='avatar'><img /></div><div class='description'></div><ol class='tracks'></ol></div><div class='panel left'><div class='artwork'><img /><div class='button'><div class='play'></div></div></div></div></div>").prependTo('body');
	
	$("<div class='header'><div class='time'><div class='track'></div><div class='buffer'></div><div class='played'></div><canvas id='waveform'></canvas><div class='waveform'><img /></div><div class='seekhead'></div></div><div class='comments'></div></div>").prependTo('body');
	
	$("<div class='message'></div>").appendTo('body');
	
	// Lock ideas
	
	var login_info = "To unlock the full stream please login below first.",
			share_info = "Click below to share a message<br>and unlock Wasting Light.";
	
	$(".button").hide();
	
	//$('<div class="lock"><div class="instructions">' + login_info + '</div><a class="login" href="#">Twitter</a></div>').appendTo('.artwork');
	
	twttr.anywhere(function (T) {
		
		$('<div class="lock"><div class="instructions"></div><a href="#"></a></div>').appendTo('.artwork');
		
		if (T.isConnected()) {
			
			$('.instructions').html(share_info);
			$('.lock a').addClass('unlock').text('Share & Unlock');
			
		} else {
		
			$('.instructions').text(login_info);			
			$('.lock a').addClass('login').bind('click', function(){ T.signIn(); });
			
		}
		
		T.bind("authComplete", function (e, user) {
			
			$('.instructions').text(share_info);
			
      $('.login').unbind('click').removeClass('login').addClass('unlock').text('Share & Unlock');

    });

  });
	
	// Center Player & Share buttons on page
	
	$(window).resize(function(){
		
		var $player = $('.player'),
				$share = $('.share');

		$player.css({
			left: ($(window).width() - $player.outerWidth()) / 2,
			top: ($(window).height() - $player.outerHeight()) / 2
		});
		
		$share.css({
			left: ($(window).width() - $share.outerWidth()) / 2
		});

	});

	$(window).resize();
	
	// Wait for SoundManager2 to load
	
	soundManager.onready(function() {
		
		// ## Get SoundCloud Data
		
		// Resolve the playlist and get its data from SoundCloud
		
		$.getJSON('http://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + consumer_key + '&callback=?', function(playlist){
			
			// Once playlist data is loaded, apply the artwork, user avatar, and user username to the player.
			
			if(playlist.artwork_url) {
				
				$('.artwork img').attr('src', playlist.artwork_url.replace('-large', '-crop'));

				$('.artwork').css('background-image', 'url(' + playlist.artwork_url.replace('-large', '-crop') + ')');
				
			} else {
				
				$('.artwork').css('background-color', 'black');
				
			}
			
			$('.artwork').fadeIn('slow');
			
			$('.avatar img').attr('src', playlist.user.avatar_url.replace('-large', '-badge'));
			
			$('.avatar').css('background-image', 'url(' + playlist.user.avatar_url.replace('-large', '-badge') + ')');
			
			$('.description').html(playlist.title + '<br>by ' + playlist.user.username);
			
			// Loop through each track in the playlist
				
			$.each(playlist.tracks, function(index, track) {
				
				// Create a list item for track, associate it's data, and append it to the track list.
				
				var $li = $('<li class="track_' + track.id + '">' + (index + 1) + '. ' + track.title + '</li>').data('track', track).appendTo('.tracks');
				
				// Find the appropriate stream url depending on whether the track has a secret_token or is public.
				
				url = track.stream_url;
				
				(url.indexOf("secret_token") == -1) ? url = url + '?' : url = url + '&';
				
				url = url + 'consumer_key=' + consumer_key;
				
				// ## Create the Sound
				
				var s = soundManager.createSound({
					
					// ### Sound Defaults		
								
					// * Auto load the first track
					// * Add an id in the format *track_123456*
					// * Set multiShot to false to make sure track can't play more than once simultaneously 
					// * Add the SoundCloud stream url created above

					autoLoad: (index == 0),
					id: 'track_' + track.id,
					multiShot: false,
					url: url,
					volume: 100,
					
					// ### Sound Functions
					
					// **While Loading** get the percentage buffered and adjust the buffer width
					
					whileloading: function() {
						
						percent = this.bytesLoaded / this.bytesTotal * 100;

						$('.buffer').css('width', percent + '%');
						
					},
					
					// **While Playing** get the percentage played and adjust the played width
					
					whileplaying: function() {
						
						percent = this.position / track.duration * 100;

						$('.played').css('width', percent + '%');
						
					},
					
					// **On Play** swap the waveform image, change the page title, and adjust the buffer if it's fully loaded.
					
					onplay: function() {
						
						if( $li.hasClass('preloaded') ) {
							
							$li.removeClass('preloaded');
							
						} else {
							
							loadWaveform(track);

							loadComments(track);
							
							if(this.loaded == true){ $('.buffer').css('width', '100%'); }	
							
						}
						
						document.title = '\u25B6 ' + track.title;
						
					},
					
					// **On Resume** change the page title, and adjust the buffer if it's full loaded.
					
					onresume: function() {
						
						document.title = '\u25B6 ' + track.title;
						
						if(this.loaded == true){ $('.buffer').css('width', '100%'); }	
						
					},
					
					// **On Stop** revert the page title to default and set buffer and played's width to 0
					
					onstop: function() {
						
						document.title = page_title;
						
						$('.message').hide();
						
						$('.buffer, .played').width(0);						
						
					},
					
					// **On Pause** revert the page title
					
					onpause: function() {
						
						document.title = page_title;
						
					},
					
					// **On Finish** jump to the next track

					onfinish: function() { 
						
						nextTrack(); 
						
					}

				});
				
				// Load first track
				
				if(index == 0){
				
					// Load the first track's waveform using the *loadWaveform* function declared later.

					loadWaveform(track);

					// Load the first track's comments using the *loadComments* function declared later.

					loadComments(track);
					
					// Make the first track active because it has been loaded automagically
					
					$li.addClass('active').addClass('preloaded');
					
				}
				
			});
			
			// ## ScrollPane
			
			// Initialize a jScrollPane for track list
			// Included in the main index as *jquery.jscrollpane.min.js*
			
			$('.tracks').jScrollPane({
				
				showArrows: false
				
			});
			
		});
	
	});
	
	// ## GUI Events
	
	// ### List Item Click
	
	// Bind a *click* event to each list item in the track list

	$('.tracks li').live('click', function(){
		
		// Create variables for the track, its data, and whether or not it's playing
		
		var $track = $(this),
				data = $track.data('track'),
				playing = $track.is('.playing');
				
		// If is it playing, pause it.
				
		if (playing) {
			
			soundManager.pause('track_' + data.id);	
			
		// If not, stop all other sounds that might be playing, and play the clicked sound.			
			
		} else {
			
			if ($track.siblings('li').hasClass('playing')) { soundManager.stopAll(); }
			
			$track.addClass('active').siblings('li').removeClass('active');
			
			soundManager.play('track_' + data.id);
			
		}
		
		// Toggle the playing class and remove it from any other list items.
		
		$track.toggleClass('playing').siblings('li').removeClass('playing');
		
	});
	
	// ### Play Button Click
	
	// Bind a *click* event to the play button
	
	$('.button').live('click', function() {
		
		// Fade out the play button
		
		$(this).fadeOut();
		
		// Unlock the player
		
		unlockPlayer();
		
	});
	
	// ### Lock
	
	// Bind a *click* event to the lock
	
	$('.unlock').live('click', function() {
		
		// Fade out the lock
		
		$('.lock').fadeOut('slow');
		
		// Unlock the player
		
		unlockPlayer();
		
	});

	// ## Functions
	
	// ### Unlock Player
	
	// This function animates the player open and adds a bind event to the header area
	
	var unlockPlayer = function(){
		
		// Click/Play the first track
		
		$('li.active').click();
		
		// Declare basic animation variables
		
		var duration = 4000, easing = 'swing';
				
		// Animate the left & right panels to swing open
		
		$('.left').animate({
			left: 0,
			BorderTopRightRadius: 0,
			BorderBottomRightRadius: 0,
			WebkitBorderTopRightRadius: 0,
			WebkitBorderBottomRightRadius: 0,
			MozBorderRadiusTopright: 0,
			MozBorderRadiusBottomright: 0
		}, {
			duration: duration,
			easing: easing
		});

		$('.right').animate({
			left: $('.player').width() / 2,
			BorderTopLeftRadius: 0,
			BorderBottomLeftRadius: 0,
			WebkitBorderTopLeftRadius: 0,
			WebkitBorderBottomLeftRadius: 0,
			MozBorderRadiusTopleft: 0,
			MozBorderRadiusBottomleft: 0
		}, {
			duration: duration,
			easing: easing
		});
		
		// Bind a *click* event to the time div

		$('.header').live('click', function(event) {

			if(event.pageY > $('.comments').height()) {

				// Call the scrub function, handing over the clicks x position

				scrub(this, event.pageX);

			} else {

				if (event.target.className == 'comments') {

					track = $('li.active').data('track');

					relative = Math.round(event.pageX / $(window).width() * track.duration);

					window.open(track.permalink_url + '#new-timed-comment-at-' + relative, "New Timed Comment");

				} else {

					// comment clicked...

				}

			}

		  return false;

		});
		
	}
	
	// ### Load Waveform
	
	// This function adds the waveform to the page.
	// It attempts to color it using canvas, if available, using the time div background color.
	// If canvas is not available, the waveform will be added as an image instead.
	// I use the following libraries to pull this off: modernizr, jquery.color, and jquery.getimagedata.
	
	var loadWaveform = function(track){
		
		// #### Canvas Available
		
		if( $('html').hasClass('canvas') ) {
			
			// Declare a few variables
			
			var waveform_color = $.Color( $('.time').css('background-color') ),
					canvas = document.getElementById("waveform"),
					context = canvas.getContext("2d");
					
			// Clear the Canvas

			context.clearRect(0, 0, context.canvas.width, context.canvas.height);
					
			if (track.waveform_data) {
				
				// If waveform data already exists, put it on Canvas

				context.putImageData(track.waveform_data, 0, 0);
				
			} else {
				
				// If not, get the data and change each pixel color to match background
				
				$.getJSON('http://premiere.heroku.com/waveform?callback=?', { url: track.waveform_url }, function(data){

					var image = new Image;

					image.src = data.data;

					image.onload = function(){

						image.width = data.width;
						image.height = data.height;

						context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);

						var imgd = context.getImageData(0, 0, context.canvas.width, context.canvas.height);

						var pix = imgd.data;

						for (var i = 0, n = pix.length; i < n; i += 4) {

							pix[i] = waveform_color[0]; // red
							pix[i+1] = waveform_color[1]; // green
							pix[i+2] = waveform_color[2]; // blue

						}

						track.waveform_data = imgd;

						context.putImageData(track.waveform_data, 0, 0);

					}

				});
				
			}
			
		// #### Canvas Not Available
			
		} else {
			
			$('.waveform').show();
			
			$('.waveform img').attr('src', track.waveform_url);
			
		}	
		
	}
	
	// ### Load Comment
	
	// Loads a single comment in the comments div and positions it accordingly.
	
	var loadComment = function(track, comment){
		
		// Only add if the comment has a timestamp
		
		if(comment.timestamp){
			
			// Calculate the relative position of where the comment should be played on the comments timeline.

			position = comment.timestamp / track.duration * 100;
			
			// Create the comment, position it, and append it to *.comments*.

			var $comment = $('<div class="comment_' + comment.id + ' comment"></div>').css('left', position + "%").appendTo('.comments');
			
			// Create the user avatar and append it to the newly created comment.

			$('<div class="avatar"><img src="' + comment.user.avatar_url + '"></div>')
				.css('background-image', 'url(' + comment.user.avatar_url + ')')
				.appendTo($comment);
			
		}
		
	}
	
	// ### Load Comments
	
	// Loops all of a track's comments
	
	var loadComments = function(track){
		
		// Set a data variable for the current track
		
		var data = $('.track_' + track.id).data('track'),
				s = soundManager.getSoundById('track_' + track.id);
				
		// If the track is public...
				
		if (track.sharing == "public") {

			// Remove all existing comments

			$('.comments').empty();

			// If the track has comments

			if (track.comment_count != 0) {

				if (data.comments) {

					// Loop through each comment and call the **loadComment** function above

					$.each(data.comments, function(index, comment) {

						loadComment(track, comment);

					});

				} else {

					// Initialize a new array called *comments* in the list item data

					data.comments = new Array();

					// Loop until *comment_count* is reached

					for(offset = 0; offset <= track.comment_count; offset += 50) {

						// Get track comments from SoundCloud

						$.getJSON("http://api.soundcloud.com/tracks/" + track.id + "/comments.json?offset=" + offset + "&consumer_key=" + consumer_key + '&callback=?', function(comments){

							// Loop through each comment

							$.each(comments, function(i, comment) {													

								// Only do something if the comment is timestamped														

								if(comment.timestamp){

									// Push the timestamped comment into the comments array

									data.comments.push(comment);

									// Load the comment into view

									loadComment(track, comment);

									// Create a SoundManager2 **On Position** listener event for the comment

									s.onposition(comment.timestamp, function(eventPosition) {

										clearTimeout(messageTimer);

										messageTimer = setTimeout( function() { $('.message').fadeOut(); }, 3000);

										position = comment.timestamp / track.duration * $('.time').width();

										$('.message').text(comment.body).fadeIn();
										
										if ( position < ( $('.time').width() - $('.message').width() ) ) {
											
											$('.message').css({
												left: position,
												right: 'auto'
											});
											
										} else {
											
											$('.message').css({
												left: 'auto',
												right: $('.time').width() - position
											});
											
										}

									});

								}

							});

						});

					}

				}

			}
			
		}
		
	}
	
	// ### Next Track
	
	// Loads the next track or first if there isn't a next track
	
	var nextTrack = function(){
		
		soundManager.stopAll();

		if ( $('li.active').next().click().length == 0 ) {
			$('.tracks li:first').click();
		}
		
	}
	
	// ### Scrub
	
	// Calculate relative position before calling the Seek function
	
	var scrub = function(node, xPos) {
		
		// Calculate the relative position and make sure it doesn't exceed the buffer's current width.
		
		relative = Math.min( $('.buffer').width(), (xPos - $('.time').offset().left) / $('.time').width() );
		
		// Pass the relative position to the *onSeek* function.
		
		onSeek(relative);

  };
	
	// ### Seek
	
	// Seek the currently playing track
	
	var onSeek = function(relative){
		
		// Get the current active track
		
		$track = $('li.active').data('track');
		
		// Calculate a new position given the click's relative position and the track's duration.
		
		position = $track.duration * relative;
		
		// Set the position in SoundManager2
		
		soundManager.setPosition('track_' + $track.id, position).play();
		
	}
	
});