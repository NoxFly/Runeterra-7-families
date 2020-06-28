import {removeBackground, _alert, changeSection} from '../utils.js';
import {player, minFamilyN} from '../script.js';
import * as GAME from './game.js';
import * as HOME from './home.js';


/**
 * BIND EVENTS OF THE LOBBY SECTION
 */
const bindEvents = async function() {

    // stop hosting game / lobby
    $('body').on('click', '#lobby .cancel', async function() {
        await player.unbindLobbyChanges();

        // the hoster left
        if(player.hosting) {
            await player.stopHost(quitLobby);
        }

        // a participant left
        else {
            await player.quitLobby(quitLobby);
        }
    });


    // launch the game
    $('body').on('click', '#launch', async function() {
        if(!$('#launch').hasClass('active')) return;
        $('#launch').removeClass('active');

        await player.unbindLobbyChanges();

        $('#loadScreen').fadeIn(200);

        GAME.bindEvents();

        changeSection('game', () => {
            GAME.initializeGame(player.id, minFamilyN);
        });

        
    });

};



/**
 * UNBIND EVENTS OF THE LOBBY SECTION
 */
const unbindEvents = () => {
    $('#lobby .cancel').off('click');
    $('#launch').off('click');
};




/**
 * QUI THE LOBBY
 */
const quitLobby = () => {
    unbindEvents();
    HOME.bindEvents();

    player.unbindLobbyChanges();

    changeSection('home', () => {
        $('#launch').removeClass('active');
        removeBackground();
        $('footer').css('bottom', '0');
    });
};



/**
 * BIND EVENTS OF THE LOBBY THE PLAYER ARE IN
 */
const bindLobbyChanges = lobbyId => {
    player.bindLobbyChanges(lobbyId, async function(lobby, type) {
        let action = checkLobbyChanges(lobbyId, lobby, type);

        if(action) {

            switch(type) {
                case 'lobbyJoined': break;
                
                case 'lobbyDeleted':
                    player.unbindLobbyChanges();
                    player.quitLobby(quitLobby);
                    _alert("L'hôte a quitté le salon");
                    break;

                case 'lobbyChanged':
                    if(action == 'gameLaunched') prepareGame(lobbyId);
                    else verifyMembers(lobby);
                    break;

                default:
                    break;
            }

        }
    });
};



/**
 * ACTION OF THE BINDLOBBYCHANGES FUNCTION
 */
function checkLobbyChanges(lobbyId, lobby, type) {
    if(type == 'lobbyJoined') {
        if(typeof lobby != 'object') return false;

        let participant = 'id' in lobby;
        let last = participant? null : lobby[Object.keys(lobby)[Object.keys(lobby).length-1]];

        if(participant) {
            if(lobby.id == player.id || lobby.id == player.lobby) return false;
        }

        else {
            if(last.id == player.id || last.id == player.lobby) return false;
        }

    }

    else if(type == 'lobbyDeleted') {
        if(typeof lobby != 'number' || player.id == lobbyId) return false;
    }

    else if(type == 'lobbyChanged') {
        if(typeof lobby == 'boolean') return 'gameLaunched';
    }


    return true;
}



/**
 * REFRESH THE PLAYER'S BANNERS
 * @param {Integer} lobby lobby id
 */
const verifyMembers = lobby => {
    let participantsId = Object.keys(lobby);

    participantsId.splice(participantsId.indexOf(player.id), 1);

    let n = participantsId.length + 1;

    for(let i = 2; i<=5; i++) {
        if(i <= n) $(`#player-banner-${i}`).css('opacity', 1).children('span').text(lobby[participantsId[i-2]].name);
        else $(`#player-banner-${i}`).css('opacity', 0);
    }

    if(player.hosting) {
        if(n == 1) $('#launch').removeClass('active');
        else $('#launch').addClass('active');
    }
};


/**
 * LAUNCH THE GAME
 * @param {Integer} lobbyId lobby id
 */
const prepareGame = lobbyId => {
    if(player.hosting) return;
    player.unbindLobbyChanges(lobbyId);

    $('#loadScreen').fadeIn(200);

    GAME.bindEvents();

    changeSection('game', () => {
        GAME.initializeGame(lobbyId, minFamilyN);
    });

    
};


export {bindEvents, bindLobbyChanges, verifyMembers};