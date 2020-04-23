import {families, regions, championRegion, regionName} from '../data/families.js';
import {player} from '../script.js';
import * as HOME from './home-menu.js';

// import utils
import {
    setBackground,
    setBackgroundBrightness,
    copy,
    rand,
    formatChampion,
    formatRegion,
    _alert,
    removeBackground
} from '../utils.js';

let selectedPlayer = null;
let selectedRegion = null;
let selectedChampion = null;

const bindEvents = () => {

    // toggle deck pannel
    $('#close-pannel-bundle').on('click', function() {
        $('#pannel-bundle').toggleClass('closed');
        $(this).toggleClass('closed');
        $('#message-center').toggleClass('middle-screen');
    });

    $('#complete-family > div div').on('click', () => {
        $('#family-hover, #complete-family').fadeOut(200);
    });


    // watch region's champions
    $('body').on({
        mouseenter: function() {
            let regionId = $(this).data('family-frame');
            let region = regions[Object.keys(families).indexOf(regionId)];
            $('#popup-region-summary h3').text(region);
            $('#popup-region-summary').css({
                top: $(this).offset().top + $(this).height() / 2
            });

            let b = $(this).hasClass('completed');

            for(let i=0; i<6; i++) {
				let champion = families[regionId][i];
				let el = $(`#popup-region-summary div span:nth-child(${i+1})`);
				if(player.bundle.indexOf(champion) !== -1 || b) el.removeClass('disabled');
				else el.addClass('disabled');
                el.css('background-image', `url('asset/icon_champions/${regionId}/${formatChampion(champion)}.png')`);
            }

            $('#popup-region-summary').fadeIn(0);
        },
        mouseleave: function() {
            $('#popup-region-summary').fadeOut(0);
        }
    }, '.family-frame');


    // select which champion we want to steal
    $('body').on('click', '#pannel-participants .participant', function() {
        selectedPlayer = $(this).data('playerid');
        $('#pannel-participants').fadeOut(200);
        $('#pannel-regions').fadeIn(200);
    });

    $('body').on('click', '#pannel-regions .region', function() {
		selectedRegion = $(this).data('region');

		$('#pannel-champions .champion').each((idx, champDiv) => {
			let champion = families[selectedRegion][idx];
			if(player.bundle.indexOf(champion) !== -1) $(champDiv).addClass('disabled');
			else $(champDiv).removeClass('disabled');
			$(champDiv).children('.inner').css('background-image', `url('asset/icon_champions/${selectedRegion}/${formatChampion(champion)}.png')`);
			$(champDiv).attr('data-champion', champion);
		});	

        $('#pannel-regions').fadeOut(200);
        $('#pannel-champions').fadeIn(200);
	});

	$('#pannel-champions .cancel').on('click', function() {
		selectedRegion = null;
		$('#pannel-champions').fadeOut(200);
        $('#pannel-regions').fadeIn(200);
	});
	
	$('#pannel-champions .champion').on('click', function() {
        if($(this).hasClass('disabled') || player.id != player.current) return;
        
		selectedChampion = $(this).attr('data-champion');
        $('#pannel-champions').fadeOut(200);
        
        stealChampion();
    });
    

    // quit the game
    $('#endofgame div button').on('click', () => {
        unbindEvents();

        // return to menu
        HOME.bindEvents();
        $('#endofgame').fadeOut(100);
        $('#game').fadeOut(200);
        $('#menu-home').delay(200).fadeIn(200);

        // clean the game place
        $('.closed').removeClass('closed');
        $('#pannel-bundle .inner, #regions-summary, #participants, #pannel-regions .inner').html('');
        $('#pannel-participants').html('<p>A qui souhaites-tu voler un champion ?</p>');
        removeBackground();

    });



	// PC only - keyboard shortcuts
	$(document).on('keyup', function(e) {
		if(!player.ingame) return; // player must be ingame to bind keys
		switch(e.key) {
			case 'a': openLeftMenu(); break;
			case 'z': openBottomMenu(); break;
			case 'e': openRightMenu(); break;
		}
	});
};


const unbindEvents = () => {
    $('#close-pannel-bundle').off('click');
    $('body').off('mouseenter');
    $('body').off('mouseleave');
    $('body').off('click', '#pannel-participants .participant');
    $('body').off('click', '#pannel-regions .region');
    $('#pannel-champions .cancel').off('click');
    $('#pannel-champions .champion').off('click');
    $('#endofgame div button').off('click');
    $(document).off('keyup');
};







const initializeGame = async function(lobbyId, nF) {
    const participants = copy(await player.get(`/lobbies/${lobbyId}/participants`));
    await initializeRemote(lobbyId, participants, nF).then(function(success) {
		if(success) {
			initializeDOM(participants).then(() => {
                player.bindGameChanges((news, type) => {
                    newsTreatment(news, type);
                });
				$('#lobby').fadeOut(0);
				$('#game').fadeIn(0);
				$('#popup-box').css('top', '-100px');
                $('#loadScreen').delay(500).fadeOut(200);
			});
		} else {
			$('#launch').addClass('active');
            $('#loadScreen').delay(1000).fadeOut(200);
            setTimeout(() => {_alert('An error occured');}, 500);
		}
	});
};


const retrieveGame = async function(lobbyId, nF) {
    let exists = await player.getGameData(lobbyId);

    if(!exists) return false;

    initializeDOM(player.participants).then(() => {
        player.bindGameChanges((news, type) => {
            newsTreatment(news, type);
        });
    });

    return true;
};




const initializeRemote = async function(lobbyId, participants, nF) {
	if(player.hosting) {
		return await player.launchGame(participants, nF);
	} else {
        await getGameDataInf(lobbyId);
		await player.setGameState(true);
		return true;
	}
};


// try to recover game data while it's equal to null
const getGameDataInf = async function(lobbyId) {
    if(!(await player.getGameData(lobbyId))) {
        await getGameDataInf(lobbyId);
    }
}




const initializeDOM = async function(players) {

	if(player.current != player.id) {
		$('#pannel-participants').fadeOut(0);
		message("C'est au tour de", player.participants[player.current].name, "de voler un champion");
	}


    setBackground(`regions/${Object.keys(families)[rand(0, Object.keys(families).length-1)]}`);
    setBackgroundBrightness(50);

    let familyNames = player.gameFamilies;

    let complF = player.completeFamilies;

    let completed = complF[player.id]? complF[player.id] : [];
    let allCompleted = [];
    for(let c of Object.keys(complF)) {
        if(complF[c]) allCompleted.push(...complF[c]);
    }

    for(let family of familyNames) {
        let golden = (completed.indexOf(family)!==-1)? ' completed' : '';

        // add to family-data
        let div = $('<div>');
        div.addClass(`family-frame${golden}`);
        div.attr('data-family-frame', family);
        div.html(`<img src='asset/logo_regions/${family}.png' ${family=='neant'?'style="transform: translate(-43%, -50%);"':''}>`);
        $('#regions-summary').append(div);

        // add pannel-region's regions
        if(allCompleted.indexOf(family) === -1) {
            div = $('<div>');
            div.addClass('region');
            div.css('background-image', `url('asset/logo_real_regions/${family}.png')`);
            div.attr('data-region', family);
            $('#pannel-regions .inner').append(div);
        }
    }


    for(let pId in players) {
		let p = players[pId];
        // for right side menu
        let div = $('<div class="participant">');
        if(pId == player.id) div.addClass('me');
        div.append($('<div>'));
        div.append($('<span>'));
        div.children('span').text(p.name);
        $('#participants').append(div);

        // for pannel choice
		if(pId != player.id) {
			div = $('<div class="participant">');
			div.append($('<div>'));
			div.append($('<span>'));
			div.attr('data-playerId', pId).children('span').text(p.name);
			$('#pannel-participants').append(div);
		}
    }



	for(let card of player.bundle) appendCard(card);

    if($('.card').length > 0) {
        let cardMargin = parseInt($('.card').css('margin-right').replace('px',''));
        let cardSize = $('.card').width() + cardMargin;
        $('#pannel-bundle .inner').css('width', cardSize * (player.bundle.length) + cardMargin);
    }
};



const openLeftMenu      = () => {$('#regions-summary').toggleClass('closed');};
const openBottomMenu    = () => {$('#close-pannel-bundle').click();};
const openRightMenu     = () => {$('#participants').toggleClass('closed')};


const appendCard = champion => {
    let regionId = formatRegion(championRegion(champion));

    let div = $('<div>');
    div.addClass('card');
    div.attr('data-champion', champion);
    div.css('background-image', `url('asset/icon_champions/${regionId}/${formatChampion(champion)}.png')`);

    let infos = $('<span>');
    infos.addClass('infos');
    infos.html(`<img src="asset/logo_regions/${regionId}.png" width="40"><span class="champion-infos">${champion}</span>`);

    div.append(infos);
    
    $('#pannel-bundle .inner').append(div);
}


const message = (p1, h2, p2) => {
	$('#message-center').children('.first-p').text(p1);
	$('#message-center').children('h2').text(h2);
	$('#message-center').children('.second-p').text(p2);
	$('#message-center').fadeIn(0);
};


const stealChampion = () => {
    let stolen = false,
        replay = false,
        drawnCard,
        nextPlayer,
        txt = [`${player.game.participants[selectedPlayer].name} n'a pas ce champion. Vous piochez`, '', ''],
        result = {
            thiefId:        player.id,
            stolenId:       selectedPlayer,
            regionId:       selectedRegion,
            championName:   selectedChampion,
            draw:           false,
            complete:       false
        };

    if(player.steal(selectedPlayer, selectedChampion)) {

        // steal

        stolen = true;
        replay = true;
        
        txt = ['Vous avez volé', selectedChampion, ''];

        appendCard(selectedChampion);

        if(player.completeFamily(selectedRegion)) {
            result.complete = selectedRegion;
            messageFamilyCompleted(selectedRegion);
        }
    }
    
    
    else {

        // doesn't steal - draw

        drawnCard = player.draw();
        if(drawnCard) {
            txt[1] = drawnCard;

            appendCard(drawnCard);

            result.draw = drawnCard;
            let region = formatRegion(championRegion(drawnCard));

            if(player.completeFamily(region)) {
                result.complete = region;
                messageFamilyCompleted(region);
            }
        } else {
            result.draw = 'empty';
        }
    }

    message(txt[0], txt[1], txt[2]);

    if(drawnCard == selectedChampion) replay = true;

    setTimeout(() => {
        $('#message-center').fadeOut(200);

        
        nextPlayer = player.nextRound(result, replay);

        let winner = player.gameFinished();

        if(winner) {
            announceWinner(winner);
        } else {
            setTimeout(() => {
                if(!replay) message("C'est au tour de", nextPlayer.name, 'de voler un champion');
                else {
                    $('#message-center').fadeOut(200);
                    $('#pannel-participants').delay(200).fadeIn(200);
                }
            }, 800);
        }

        
    }, 2000);
};

const messageFamilyCompleted = region => {
    for(let c of families[region]) {
        player.removeCard(c);
        $(`#pannel-bundle .inner .card[data-champion="${c}"]`).remove();
    }

    $(`.family-frame[data-family-frame="${region}"]`).addClass('completed');
    $(`.region[data-region="${region}"]`).remove();

    $('#complete-family > div p span').text(regionName(region));
    $('#complete-family > span').css('background-image', `url('asset/logo_real_regions/${region}.png')`);

    $('#family-hover, #complete-family').fadeIn(200);
};



const newsTreatment = async function(news, type) {
    if(type == 'newRound') {
        if(news.thiefId == player.id) return;

        let thiefId = news.thiefId;
        let stolenId = news.stolenId;
        let regionId = news.regionId;
        let champion = news.championName;
        let draw = news.draw;
        let completed = news.complete;
        let thiefName = player.participants[thiefId].name;
        let stolenName = player.participants[stolenId].name;

        let b = player.id == stolenId;
        let txtCplt = '';
        let txtRpl = '';

        await player.recoverBundles();
        await player.recoverDeck();
        await player.recoverCurrent();
        await player.recoverCompleted();

        $('#message-center').fadeOut(100);

        if(completed) {
            txtCplt = `et a complété une région: ${completed}`;
            $(`.region[data-region="${completed}"]`).remove();
        }

        if(thiefId == player.current) txtRpl = draw? "car il a pioché ce qu'il a demandé" : "car il a obtenu le champion demandé";
        
        if(draw) {
            message(
                '',
                `${thiefName} a essayé de ${b?'vous':''} voler ${champion} ${b?'':`à ${stolenName}`} ${draw=='empty'?'':'mais a dû piocher'} ${txtCplt}`,
                '');
        } else {
            message(`${thiefName} ${b?'vous':''} a volé`, champion, `${b?'':`à ${stolenName}`} ${txtCplt}`);

            if(b) $(`#pannel-bundle .inner .card[data-champion="${champion}"]`).remove();
        }
        

        setTimeout(() => {

            $('#message-center').fadeOut(100);

            let winner = player.gameFinished();

            // game finished
            if(winner) {

                announceWinner(winner);

            } else {
                if(player.current == player.id) {
                    $('#pannel-participants').fadeIn(200);
                } else {
                    message("C'est au tour de", player.participants[player.current].name, `de voler un champion ${txtRpl}`);
                }
            }

        }, 4000);

    }


    else {

    }

};



const announceWinner = winner => {
    $('#pannel-participants, #participants, #pannel-bundle, #regions-summary, #message-center, #close-pannel-bundle').fadeOut(100);

    let state = 'defeat';

    // you won - or you lost
    if(winner.id == player.id) {
        state = 'victory';
        player.win();
    } else {
        player.lose();
    }

    $('#endofgame').removeClass().addClass(state).children('span').text(`${winner.id==player.id?'Vous avez':winner.name+' a'} gagné avec ${winner.formed} familles`);
    $('#endofgame').fadeIn(200);

    player.getOutOfGame();
};





export {bindEvents, initializeGame, retrieveGame};