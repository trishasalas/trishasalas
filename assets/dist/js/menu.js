function init() {
	// Create the variables
	var toggleButton = document.getElementById( "menu-toggle" );
	var panel = document.getElementById( "menu-primary-navigation" );

	// Add an event listener
	toggleButton.addEventListener( "mouseenter", toggleButtonEventHandler );
	toggleButton.addEventListener( "keydown", toggleButtonEventHandler );

	toggleButton.setAttribute('aria-haspopup', 'true');
	toggleButton.setAttribute('aria-expanded', 'false');


	function toggleButtonEventHandler( event ) {
		var type = event.type;
		// Grab the keydown and click events
		if ( type === "keydown" ) {
			// If either enter or space is pressed, execute the funtion
			if ( event.keyCode === 13 || event.keyCode === 32 ) {
				toggleButtonState( event );
				togglePanelVisibility( event );
				togglePanelState( event );
				event.preventDefault();
			}

		} else if ( type === "mouseenter" ) {
			toggleButtonState( event );
			togglePanelVisibility( event );
			togglePanelState( event );
		}
	}

// toggle the button state for screen readers and other assistive devices
	function toggleButtonState( event ) {
		var toggleButton = event.target;
		var currentState = toggleButton.getAttribute( "aria-expanded" );
		var newState = "true";

		// If aria-pressed is set to true, set newState to false
		if ( currentState === "true" ) {
			newState = "false";
		}
		// Set the new aria-pressed state on the button
		toggleButton.setAttribute( "aria-expanded", newState );
	}

	function togglePanelState() {

		var currentPanelState = panel.getAttribute( "aria-hidden" );
		var newState = "false";

		// If aria-pressed is set to true, set newState to false
		if ( currentPanelState === "false" ) {
			newState = "true";
		}
		// Set the new aria-pressed state on the button
		panel.setAttribute( "aria-hidden", newState );
	}

// toggle panel visibility
	function togglePanelVisibility() {

		if ( isPanelVisible( panel ) ) {

			panel.style.display = "none";

		} else {

			panel.style.display = "block";
		}
	}

// is the panel hidden?
	function isPanelVisible( panel ) {
		return (
			window.getComputedStyle( panel, null ).getPropertyValue( "display" ) === "block"
		);
	}
}

window.onload = init;
