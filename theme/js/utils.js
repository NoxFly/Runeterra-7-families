import {families} from './data/families.js';

// set an alternative background
/**
 * SET AN ALTERNATIVE BACKGROUND
 * @param {String} path path of the background
 * @param {Boolean} darker either a transparent black filter have to be applied to
 */
const setBackground = (path, darker=true) => {
    let el = $('#background');
    el.fadeIn(200);

    // either the background should be darker or not
    $('#background').addClass('darker');
    if(!darker) $('#background').removeClass('darker');

    // change the background of the child which is hidden
    el.children('div').css('background-image', `url('asset/splash_backgrounds/${path}.jpg')`);
    // then fade it during one second
    el.children('div').fadeIn(200);
    

    // when it finish to appear
    setTimeout(() => {
        // change the real background image
        el.css('background-image', `url('asset/splash_backgrounds/${path}.jpg')`);
        // then hide its child
        el.children('div').fadeOut(0);
    }, 250);
};

/**
 * REMOVE THE CURRENT ALTERNATIVE BACKGROUND
 */
const removeBackground = () => {
    $('#background').fadeOut(200);
    setTimeout(() => {
        $('#background').css('background-image', 'url("")');
        $('#background').children('div').css('background-image', 'url("")');
    }, 220);
};

/**
 * SET THE BACKGROUND BRIGHTNESS
 * @param {Integer} percentage background brightness percentage
 */
const setBackgroundBrightness = percentage => {
    let alpha = Math.max(0, Math.min(percentage, 100)) / 100;
    $('#background-darkness').css('opacity', alpha);
};


/**
 * COPY WITHOUT REFERENCE A GIVEN OBJECT
 * @param {Object} obj object to be copied
 */
const copy = obj => JSON.parse(JSON.stringify(obj));

/**
 * RETURN A RANDOM INTEGER IN A GIVEN RANGE
 * if the max parameter isn't given, then min parameter becomes the max one and the min is 0
 * @param {Integer} min the minimum value range
 * @param {Integer} max the maximum value range
 * @returns {Integer}
 */
const rand = (min, max=0) => Math.floor(Math.random()*Math.max(min, max) - Math.min(min, max)) + Math.min(min, max);

/**
 * ALERT WITH DOM PERSONALIZED TAG
 * @param {String} msg message to be displayed
 */
const _alert = msg => {
    $('#message-alert span').text(msg).parent().fadeIn(0);
    $('#hover').fadeIn(0);
};



// format region names | champion names for filenames
const formatRegion = region => region.toLowerCase().replace(' ', '_').replace('é', 'e');
const formatChampion = champion => champion.toLowerCase().replace(/('|\s)/g, '');




/**
 * SHUFFLE AN ARRAY RANDOMLY BY REFERENCE
 * @param {Array} array the array to be shuffled
 */
const shuffle = array => {
    for(let i=array.length-1; i>0; i--) {
        let j = Math.floor(Math.random() * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

/**
 * FILTER AN OBJECT AND RETURNS ITS RESULT
 * @param {Object} obj object to be filtered
 * @param {Function} predicate the condition of the filter
 * @returns {Object}
 */
const filterObj = (obj, predicate) => {
    let result = {};

    for(let key in obj) {
        if(obj.hasOwnProperty(key) && predicate(key, obj[key])) {
            result[key] = obj[key];
        }
    }

    return result;
};

/**
 * CHECK IF THE LETTER IS A VOWEL
 * @param {String} letter letter to be checked
 * @returns {Boolean}
 */
const isVowel = letter => 'aeiouy'.includes(letter.toLowerCase());



/** @constant {String} charTable a string that contains each characters of a generated key */
const charTable = 'abcdefghijklmnoprstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * GENERATE A RANDOM KEY
 * @param {Integer} len the length of the key
 * @returns {String}
 */
const randomKey = len => {
    let key = '';
    for(let i=0; i < len; i++) key += charTable[rand(0, charTable.length-1)];
    return key;
};

/**
 * Returns an array of random selected n families
 * @param {Integer} n Number of families to be selected
 * @returns {Array}
 */
const randomFamilies = n => {
	let f = copy(families);
	let familyNames = Object.keys(f);

	while(familyNames.length > n)
		familyNames.splice(rand(0, familyNames.length-1), 1);

	return familyNames;
};

/**
 * Returns a deck randomly generated with given families
 * @param {Array} familyNames array of selected families
 * @returns {Array}
 */
const initDeck = familyNames => {
	let deck = [];
	for(let f of familyNames) deck.push(...families[f]);
	shuffle(deck);
	return deck;
};

/**
 * Returns the randomly generated bundle for each players depending of the given deck
 * @param {Array} participants participant's ids
 * @param {Array} deck deck of champion cards
 */
const distributeCards = (participants, deck) => {
	let n = participants.length;
	let m = n*6;

	let bundles = {};
	for(let p of participants) bundles[p] = [];

	if(m > deck.length) return bundles;

	for(let i=0; i<n; i++) {
		for(let j=0; j<6; j++) {
			bundles[participants[i]].push(deck.splice(0, 1)[0]);
		}
	}

	return bundles;
};




/**
 * POST METHOD TO RECOVER PHP DATA
 * @param {Object} params parameters to be passed as post method
 */
const post = async function(params) {
    return await $.post("", params).done(data => data);
};



/**
 * Load a new section, and remove the current one from the DOM
 * @param {String} sectionName the name of the section to be loaded
 */
const changeSection = async function(sectionName, halfCallback=null) {
    const data = $(await post({section: sectionName})).find('section');

    if(data.length == 0) return;

    const content = `<section id="${data.attr('id')}">${data.html()}</section>`;

    $('#content').fadeOut(500);

    

    setTimeout(() => {
        let time = 0;
        $('#content').html(content);

        if(halfCallback) {
            halfCallback();
            time = 400;
        }

        setTimeout(() => {
            $('#content').fadeIn(500);
        }, time);


    }, 600);
}





















export {
    setBackground,
    removeBackground,
    setBackgroundBrightness,
    formatChampion,
    formatRegion,
    copy,
    rand,
    _alert,
    shuffle,
    filterObj,
    isVowel,
    randomKey,
    randomFamilies,
    initDeck,
    distributeCards,
    post,
    changeSection
};