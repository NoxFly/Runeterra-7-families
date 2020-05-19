// global vars
let player = {};
const minFamilyN = 7;
let isMobile = false;

// database
import {Player} from './player.js';

// import for each section
import * as GENERAL     from './page_modules/general.js';
import * as CONNECTION  from './page_modules/connection.js';
import * as GAME  from './page_modules/game.js';
import {lastSwipe, enableSwipe} from './swipe.js';


window.onload = async function() {
    isMobile = $(document).width() <= 1000;

    if(isMobile) {
        enableSwipe();
    }



    // -- check if user already logged --

    // not logged - starts new session - COOKIE REMOVED SO IN EVERY CASES YOU MUST CONNECT
    // -- that includes: if you refresh the page, if you quit it, or the navigator
    $('#game').show(0);
    $('footer').css('bottom', '-100px');

    player = new Player('dev');

    await player.recoverUserData();

    await GAME.initializeGame('a', 7);

    // reset the username input field
    //$('#connexion input').val('');

    GAME.bindEvents();

    //verifyMemberCreationDate();

    $('#loadScreen').delay(500).fadeOut(200);


    // -- listener --
    
    GENERAL.bindEvents();

    //
};



const verifyMemberCreationDate = async function() {
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