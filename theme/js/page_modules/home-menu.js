import {setBackground} from '../utils.js';
import {player} from '../script.js';
import * as SEARCH from './search-lobby.js';
import * as LOBBY from './lobby.js';

const bindEvents = () => {
    $('#menu-home article').on('click', function() {
        if($(document).width() <= 1000) action($(this));
    });

    $('#menu-home article span').on('click', function() {
        if($(document).width() > 1000) action($(this).parent());
    });
};

const unbindEvents = () => {
    $('#menu-home article').off('click');
    $('#menu-home article span').off('click');
};




const action = async function(el) {
    $('#menu-home').fadeOut(200);

    // create game - & join lobby
    if(el.attr('id') == 'create-game') {
        // first, send data to say the player want to host a lobby
        player.createLobby().then(() => {
            LOBBY.bindEvents();
            LOBBY.bindLobbyChanges(player.id);
        });

        // then show him the lobby
        $('#lobby').removeClass('not-hosting').delay(1000).fadeIn(200);
        $('footer').css('bottom', '-150px');
        setBackground('lol_fond');
        $('#lobby #player-banner').addClass('host');


    }
   
    // join created lobby
    else {
        // search remote lobbies
        SEARCH.bindEvents();
        SEARCH.searchLobbies();

        $('#join-lobby article .inner').html('<p>Aucun salon trouvé</p>');
        $('#join-lobby').delay(1000).fadeIn(200);
        $('footer').css('bottom', '-150px');
    }
}


export {bindEvents};