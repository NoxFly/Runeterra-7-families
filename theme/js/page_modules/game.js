import {families, regions, championRegion, regionName} from '../data/families.js';
import {player, isMobile} from '../script.js';
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
let currentBdiv = 3;
let changingBundle = false;
let swipeP = 0;
let bdlClosed = true;

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
        $('#regions-summary, #participants').html('');
        removeBackground();

    });



	// PC only - keyboard shortcuts
	$(document).on('keyup', function(e) {
		if(!player.ingame) return; // player must be ingame to bind keys
		switch(e.key) {
			case 'a': previousBundle(); break;
			case 'z': toggleATH(); break;
			case 'e': nextBundle(); break;
		}
    });

    $('#previous-bundle').on('click', () => {rotateBundle(-1);});
    $('#next-bundle').on('click', () => {rotateBundle(1);});


    $(document).on('swipeleft', () => {rotateBundle(1)});
    $(document).on('swiperight', () => {rotateBundle(-1)});

    $(document).on('swipedown', () => {
        toggleBundle(0);
    });

    $(document).on('swipeup', () => {
        toggleBundle(1);
    });

    $('#close-bundle-phone').on('click', () => {
        toggleBundle(0);
    });
};


const unbindEvents = () => {
    $('body').off('mouseenter');
    $('body').off('mouseleave');
    $('#endofgame div button').off('click');
    $(document).off('keyup');
};


const toggleBundle = state => {
    if(state) {
        if(bdlClosed) {
            $('#pannel-bundle').show(0).css({
                transform: 'translateY(0)',
                opacity: 1
            });
            bdlClosed = false;
        }

        $('#message-center').css({
            transform: 'translate(-50%, -50%) scale(.8)',
            opacity: 0
        }).delay(200).fadeOut(0);
        $('#previous-bundle, #next-bundle, #close-bundle-phone').delay(100).fadeIn(100);
    } else {
        if(!bdlClosed) {
            $('#pannel-bundle').css({
                transform: 'translateY(40px)',
                opacity: 0
            }).delay(200).hide(0);
            bdlClosed = true;
        }

        setTimeout(() => {
            $('#message-center').fadeIn(0).css({
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1
            });
        }, 200);
        $('#previous-bundle, #next-bundle, #close-bundle-phone').fadeOut(100);
    }
};







const initializeGame = async function(lobbyId, nF) {
    let participants;

    if(player.dev) {
        participants = {a: {id: 'a', name: 'Noxfly'}, b: {id: 'b', name: 'illusion'}};
    } else {
        participants = copy(await player.get(`/lobbies/${lobbyId}/participants`));
    }
    

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
                newCooldown(40);
			});
		} else {
			$('#launch').addClass('active');
            $('#loadScreen').delay(1000).fadeOut(200);
            setTimeout(() => {_alert('An error occured');}, 500);
		}
	});
};

// useless
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

    for(let i in familyNames) {
        let family = familyNames[i];

        // ghost logo
        let logo = $('<div>');
        let left = (i < 3)? 0 : (i > 3)? 100 : 50;
        let opacity = (i != 3)? 0 : 1;

        logo.css({
            left: `${left}%`,
            backgroundImage: `url('asset/logo_real_regions/${family}.png')`,
            opacity: opacity
        });

        $('#region-big-ghost .inner').append(logo);

        // add to family-data
        let div = $('<div>');
        div.addClass(`family-frame`);
        div.attr('data-family-frame', family);
        div.html(`<img src='asset/logo_regions/${family}.png' ${family=='neant'?'style="transform: translate(-43%, -50%);"':''}>`);
        $('#regions-summary').append(div);

        for(let j in families[family]) {
            let champion = families[family][j];
            let card = $(`#pannel-bundle .bundle-${i} .card-${j}`);
            let inner = card.children('.inner');

            if(player.bundle.indexOf(champion) === -1) {
                card.addClass('disabled');
            }

            inner.children('span:nth-child(1)').css('background-image', `url('asset/icon_champions/${family}/${formatChampion(champion)}.png')`);
            inner.children('span:nth-child(2)').text(champion);
            inner.children('span:nth-child(3)').text(regionName(family));
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

        div = $('<div class="participant">');

        $('#pannel-participants').append(div);
    }
};



const previousBundle    = () => {rotateBundle(-1);};
const nextBundle        = () => {rotateBundle(1);};
const toggleATH         = () => {$('#participants, #regions-summary').toggleClass('closed')};

const rotateBundle = vec => {
    if(changingBundle || (isMobile && bdlClosed)) return;

    changingBundle = true;

    if(!isMobile) {

        let prev = currentBdiv;
        currentBdiv = Math.abs(currentBdiv + vec - ((prev==0 && vec<0)?5:0)) % 7;
        let newPos;


        let possLeft = ['-150px', 'calc(100% + 150px)'];
        let possLeft2 = ['0', '100'];
        let left;

        if(vec > 0) {
            left = 0;
            newPos = (currentBdiv < 6)? currentBdiv+1 : 0;
        } else {
            left = 1;
            newPos = (currentBdiv > 0)? currentBdiv-1 : 6;
        }

        $(`.bundle-${newPos}`).css('left', possLeft[1-left]);

        $(`.bundle-${prev}`).css({
            width: '0',
            top: '150%',
            left: possLeft[left]
        });

        $(`.bundle-${currentBdiv}`).css({
            width: '700px',
            top: '0',
            left: '50%'
        });

        $(`#region-big-ghost .inner div:nth-child(${prev+1})`).css({
            left: `${possLeft2[left]}%`,
            opacity: 0,
            transform: 'translate(-50%, -50%)'
        });

        $(`#region-big-ghost .inner div:nth-child(${currentBdiv+1})`).css({
            left: '50%',
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)'
        });
    } else {

        if(vec == 1 && swipeP < 6) {
            $('#pannel-bundle > .inner').css('transform', `translateX(-${(++swipeP)*100}vw)`);
        }
        
        else if(vec == -1 && swipeP > 0) {
            $('#pannel-bundle > .inner').css('transform', `translateX(-${(--swipeP)*100}vw)`);
        }

    }

    setTimeout(() => {changingBundle = false}, 400);
};



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
    
    $('#pannel-bundle > .inner').append(div);
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
        $(`#pannel-bundle > .inner .card[data-champion="${c}"]`).remove();
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

            if(b) $(`#pannel-bundle > .inner .card[data-champion="${champion}"]`).remove();
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

const forceRound = () => {
    alert();
};

const newCooldown = time => {
    $('#timer div')
        .css('animation', `cooldown ${time}s forwards linear`)
        .on('animationend', forceRound);
}




export {bindEvents, initializeGame, retrieveGame};