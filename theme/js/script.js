/** @var {Object} player Player class instance */
let player = {};

/** @constant {Integer} minFamilyN number of families in a game */
const minFamilyN = 7;

/** @var {Boolean} isMobile either the used device is a smartphone or not */
let isMobile = false;

/** @constant {Boolean} developping either we are in developping mode or not */
const developping = false;





// database
import {Player}         from './player.js';

// import for each section
import * as GENERAL     from './page_modules/general.js';
import * as CONNECTION  from './page_modules/connection.js';
import * as GAME        from './page_modules/game.js';
import {enableSwipe}    from './swipe.js';
import { changeSection } from './utils.js';







window.onload = async function() {
    isMobile = $(document).width() <= 1000;



    // enable swipe for mobiles
    if(isMobile) {
        enableSwipe();
    }



    // GAME DEV
    if(developping) {
        changeSection('game');

        $('footer').css('bottom', '-100px');

        player = new Player('dev');

        await player.recoverUserData();

        await GAME.initializeGame('a', 7);

        GAME.bindEvents();
    }


    // DEFAULT
    else {
        player = new Player();

        // reset the username input field
        $('#connection input').val('');
        
        verifyCreationDate();

        CONNECTION.bindEvents();

    }




    $('#loadScreen').delay(500).fadeOut(200);


    // -- listener --
    
    GENERAL.bindEvents();

    //
};





/**
 * VERIFY EVERYTHING THAT IS OUT OF DATE
 */
const verifyCreationDate = async function() {
    let lastVerificationDate = await player.get(`/lastVerificationDate`);
    let now = Date.now();

    if(now - lastVerificationDate >= 21600000) {
        // needs to filter OOD things each 6h

        player.refreshVerificationDate();

        // -- PLAYERS
        filterPlug('players', 21600000);
        // LOBBIES
        filterPlug('lobbies', 3600000);
        // -- GAMES
        filterPlug('games', 21600000);
    }
};





/**
 * IF THE PLUG IS OOD, REMOVE IT
 * @param {String} plug plug name
 * @param {Integer} ttl time to live of the plug
 */
const filterPlug = async function(plug, ttl) {
    let now = Date.now();
    let oPlug = await player.get(`/${plug}`);

    for(let id of Object.keys(oPlug)) {
        if(!oPlug[id].creationDate) continue;

        let timestamp = oPlug[id].creationDate;
        let isOutOfDate = (now-timestamp > ttl)? true : false;

        if(isOutOfDate) {
            player.database.ref(`/${plug}/${id}`).remove();
        }
    }
}




export {player, minFamilyN, isMobile};