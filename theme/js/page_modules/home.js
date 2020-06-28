import {setBackground, changeSection, setBackgroundBrightness} from '../utils.js';
import {player} from '../script.js';
import * as SEARCH from './research.js';
import * as LOBBY from './lobby.js';


/**
 * BIND EVENTS OF THE HOME SECTION
 */
const bindEvents = () => {

    // for mobiles
    $('body').on('click', '#home article', function() {
        if($(document).width() <= 1000) action($(this));
    });

    // for PCs
    $('body').on('click', '#home article span', function() {
        if($(document).width() > 1000) action($(this).parent());
    });


};



/**
 * UNBIND EVENTS OF THE HOME SECTION
 */
const unbindEvents = () => {
    $('#home article').off('click');
    $('#home article span').off('click');
};



/**
 * ACTION OF THE PLAYER CHOICE: CREATE OR JOIN LOBBY
 * @param {Object} el DOM element that's been clicked
 */
const action = async function(el) {
    unbindEvents();

    // create game - & join created lobby
    if(el.attr('id') == 'create-game') {
        // first, send data to say the player want to host a lobby
        player.createLobby().then(() => {
            LOBBY.bindEvents();
            LOBBY.bindLobbyChanges(player.id);
        });

        changeSection('lobby', () => {
            // then show him the lobby
            $('footer').css('bottom', '-150px');
            setBackground('lol_fond');
            $('#player-banner span').text(player.username);
            $('#lobby #player-banner').addClass('host');
        });

    }
   
    // join created lobby
    else {
        changeSection('research', () => {
            setBackground('piltover');
            setBackgroundBrightness(60);
            // search remote lobbies
            SEARCH.bindEvents();
            SEARCH.searchLobbies();
        }).then(() => {
            $('footer').css('bottom', '-150px');
        });
    }
    
}


export {bindEvents};