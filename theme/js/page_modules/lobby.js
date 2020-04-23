import {removeBackground, _alert} from '../utils.js';
import {player, minFamilyN} from '../script.js';
import * as GAME from './game.js';
import * as HOME from './home-menu.js';

const bindEvents = async function() {
    // stop hosting game / lobby
    $('#lobby .cancel').on('click', async function() {
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

    $('#launch').on('click', async function() {
        if(!$('#launch').hasClass('active')) return;
        $('#launch').removeClass('active');

        await player.unbindLobbyChanges();

        $('#loadScreen').fadeIn(200);

        GAME.bindEvents();
        GAME.initializeGame(player.id, minFamilyN);
    });
};

const unbindEvents = () => {
    $('#lobby .cancel').off('click');
    $('#launch').off('click');
};





const quitLobby = () => {
    unbindEvents();
    HOME.bindEvents();

    player.unbindLobbyChanges();
    $('#lobby').fadeOut(200);
    $('#launch').removeClass('active');
    removeBackground();
    setTimeout(() => {
        $('footer').css('bottom', '0');
        $('#menu-home').fadeIn(200);
        $('#lobby').removeClass('not-hosting');
        $('#lobby article').css('opacity', 0);
        $('#lobby #player-banner').removeClass('host').css('opacity', 1);
        $('#lobby #player-banner-2').removeClass('host');
    }, 200);
};

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


const prepareGame = lobbyId => {
    if(player.hosting) return;
    player.unbindLobbyChanges(lobbyId);

    $('#loadScreen').fadeIn(200);

    GAME.bindEvents();
    GAME.initializeGame(lobbyId, minFamilyN).then(() => {
        setTimeout(() => {
            $('#lobby').fadeOut(0);
            $('#game').fadeIn(0);
            $('#popup-box').css('top', '-100px');
            $('#loadScreen').delay(500).fadeOut(200);
        }, 1000);
    });
};


export {bindEvents, bindLobbyChanges, verifyMembers};