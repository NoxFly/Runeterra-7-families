/** @var {Integer} swipexDown|yDown vector of swipe */
let swipexDown, swipeyDown;

/** @var {String} lastSwipe the last swipe direction the player did */
let lastSwipe = null;

/**
 * Called when the user starts to pointer down
 * @param {Object} e event - default parameter
 */
function handleTouchStart(e) {
	let getTouches = e2 => e2.touches || [{clientX: e.clientX, clientY: e.clientY}, null];

	const firstTouch = getTouches(e)[0];
	swipexDown = firstTouch.clientX;
	swipeyDown = firstTouch.clientY;
}

/**
 * Called when the user moves his cursor / finger while he is pointer downed
 * @param {Object} e event - default parameter
 */
function handleTouchMove(e) {
	if(!swipexDown || !swipeyDown) {
		return;
	}

	let xUp, yUp;

	if(e.touches) {
		xUp = e.touches[0].clientX;
		yUp = e.touches[0].clientY;
	} else {
		xUp = e.clientX;
		yUp = e.clientY;
	}

	let xDiff = swipexDown - xUp;
	let yDiff = swipeyDown - yUp;

	let event, swipeDir;

	if(Math.abs(xDiff) > Math.abs(yDiff)) {
		if(xDiff > 0) 	(swipeDir = 'left')  && (event = new Event('swipeleft'));
		else 			(swipeDir = 'right') && (event = new Event('swiperight'));
	} else {
		if(yDiff > 0) 	(swipeDir = 'up')    && (event = new Event('swipeup'));
		else 			(swipeDir = 'down')  && (event = new Event('swipedown'));
	}

	document.dispatchEvent(event);
	lastSwipe = swipeDir;
	
	swipexDown = null;
	swipeyDown = null;
}

/**
 * Enable / Authorize the swipe
 */
const enableSwipe = () => {
    document.addEventListener('mousedown', handleTouchStart, false);
    document.addEventListener('mousemove', handleTouchMove, false);
};


export {lastSwipe, enableSwipe};