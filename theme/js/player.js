import {rand, shuffle, copy, filterObj} from './utils.js';
import {config} from '../../_conf/config.js';
import {families, regions, championRegion} from './data/families.js';

class Player {
    // constructor
    constructor(player=null) {
        // firebase config
        firebase.initializeApp(config);
        this.database = firebase.database();

        this.game = {};

        this.dev = player == 'dev';


        // recover local player data
        if(this.dev) {
            this.key = 'a';
            this.name = 'Noxfly';
        }


        else if(player) {
            this.key = player.id;
            this.name = player.username;
        } else {
            this.genPlayer();
        }


        let ref = this.database.ref(`/players/${this.key}`);
        if(!this.dev) ref.onDisconnect().remove();
        ref.on('child_removed', () => {
            location.reload();
        });
    }

    // generate random key with 63 chars
    genKey() {
        return randomKey(63);
    }

    refreshVerificationDate() {
        let now = Date.now();
        this.database.ref('/lastVerificationDate').set(now);
    }







    /// -------------------------- USER

    // default player structure - generate a player
    genPlayer() {
        this.key 		    = this.genKey();
        this.name 		    = 'guest';
        this.bHosting 	    = false;
        this.bIngame 	    = false;
        this.iWins 		    = 0;
        this.iLosses 	    = 0;
        this.sLobby         = false;
        this.creationDate   = Date.now();
    }

    // create a new remote user
    async createUser(username) {
        this.name = username;
        return await this.database.ref('/players').child(this.key).set({
            id: 		    this.key,
            username: 	    this.name,
            ingame: 	    false,
            hosting: 	    false,
			wins:		    0,
            losses: 	    0,
            lobby:			false,
            creationDate:   this.creationDate
        }).then(() => true).catch(error => false);
    }

    // get/refresh remote data about the player
    async recoverUserData() {
        await this.database.ref(`/players/${this.key}`).once('value', data => {
            if(data) {
                data = data.val();
                this.name           = data.username;
                this.bIngame        = data.ingame;
                this.bHosting       = data.hosting;
                this.iWins          = data.wins;
                this.iLosses	    = data.losses;
                this.sLobby			= data.lobby;
                this.creationDate   = data.creationDate;
            }
        });
    }

    /// ------------------------







    /// ------------------------ LOBBIES

    // create a lobby remotly
    async createLobby() {
        this.bHosting = true;
        this.database.ref(`/lobbies`).child(this.key).set({
            host: {id: this.key, name: this.name},
            participants: {[this.key]:{id: this.key, name: this.name}},
            creationDate: Date.now(),
            launch: false
        }).then(() => {
            this.database.ref(`players/${this.key}/hosting`).set(this.bHosting);
		})
    }

    // remove the lobby remotly
    async stopHost(callback) {
        this.bHosting = false;
        this.database.ref(`/lobbies/${this.key}`).remove().then(() => {
            this.database.ref(`players/${this.key}/hosting`).set(this.bHosting);
            callback();
		});
    }

    // get real time changes - lobbies
    getLobbies(callback) {
        this.database.ref(`/lobbies`).on('child_added',   snapshot => {callback(snapshot.val(), 'add');});
        this.database.ref(`/lobbies`).on('child_removed', snapshot => {callback(snapshot.val(), 'remove');});
        this.database.ref(`/lobbies`).on('child_changed', snapshot => {callback(snapshot.val(), 'change');});
    }

    // off real time changes - lobbies
    stopSearchLobbies() {
        this.database.ref('/lobbies').off('child_added');
        this.database.ref('/lobbies').off('child_removed');
        this.database.ref('/lobbies').off('child_changed');
    }

    // join a lobby of another player
    async joinLobby(host, n, callback) {
        this.lobby = host.id;
        this.database.ref(`/players/${this.key}/lobby`).set(this.sLobby);

        let ref = this.database.ref(`/lobbies/${host.id}/participants`);

        let participants = await this.get(ref);

        ref.child(this.key).set({
            name: this.name, id: this.key
        })
        .then(() => {
            callback(participants)
        });
	}
    
    // quit the lobby the player is from
	async quitLobby(callback) {
        if(this.sLobby) {
            //await this.database.ref(`/lobbies/${this.sLobby}/participants/${this.key}`).remove();
            this.lobby = false;
            this.database.ref(`/players/${this.key}/lobby`).set(this.sLobby);
            callback();
        }
	}

    // get real time changes - current lobby
    async bindLobbyChanges(lobbyId, callback) {
        let lobby = this.database.ref(`/lobbies/${lobbyId}`);
        lobby.on('child_added',   snapshot => {callback(snapshot.val(), 'lobbyJoined')});
        lobby.on('child_removed', snapshot => {callback(snapshot.val(), 'lobbyDeleted')});
        lobby.on('child_changed', snapshot => {callback(snapshot.val(), 'lobbyChanged')});
    }

    // off real time changes - current lobby
    unbindLobbyChanges(lobbyId) {
        let lobby = this.database.ref(`/lobbies/${lobbyId}`);
        lobby.off('child_changed');
        lobby.off('child_added');
        lobby.off('child_removed')
    }

    /// ---------------------------












    /// ---------------------------


    async launchGame(participants, nFamilies) {
        if(this.ingame && !this.dev) return false;
        this.ingame = this.id;
        this.database.ref(`/players/${this.key}/ingame`).set(this.key);

        let families = randomFamilies(nFamilies);
        let deck = initDeck(families);
        let bundles = distributeCards(Object.keys(participants), deck);

        let completed = {};
        for(let p of Object.keys(participants)) completed[p] = false;

        this.game = {
            participants: participants,
            hoster: {id: this.key, name: this.username},
            current: this.key,
            bundles: bundles,
            deck: deck,
            families: families,
            completed: completed,
            news: false,
            creationDate: Date.now()
        };

        await this.database.ref(`/games`).child(this.key).set(this.game);

        this.database.ref(`/lobbies/${this.key}`).child('launch').set(true).then(() => {
			setTimeout(() => {
				this.database.ref(`/lobbies/${this.key}`).remove();
			}, 5000);
		});
		
		return true;
    }




	setGameState(bool) {
		if(bool) {
			this.ingame = this.lobby;
			this.lobby = false;
			this.database.ref(`/players/${this.key}/ingame`).set(this.ingame);
			this.database.ref(`/players/${this.key}/lobby`).set(false);
		} else {
			this.ingame = false;
			this.database.ref(`/players/${this.key}/ingame`).set(false);
		}
	}

	async getGameData(lobbyId) {
        this.ingame = lobbyId;
        this.game = await this.get(`/games/${this.ingame}`);

        if(this.game == null) return false;
        
        if(!this.game.bundles) this.game.bundles = {};

        for(let p of Object.keys(this.participants)) {
            if(!(p in this.game.bundles)) {
                this.game.bundles[p] = [];
            }
        }

        if(!this.game.deck) this.game.deck = [];


        return true;
    }

    steal(player, champion) {
        let bundle = this.getBundle(player);
        let i = bundle.indexOf(champion);
        if(i === -1) return false;
        this.bundle.push(bundle.splice(i, 1)[0]);
        return true;
    }

    draw() {
        if(this.deck.length == 0 || !this.deck) return null;
        let card = this.deck.splice(0, 1)[0];
        this.bundle.push(card);
        return card;
    }
    


    nextRound(result, replay) {
        let next = {id: this.key, name: this.username};

        if(!replay) {
            let participants = Object.keys(this.participants);
            let i = participants.indexOf(this.key);
            next = this.participants[participants[(i+1)%participants.length]];
        }

        // result:
        // {thiefId=this.key, stolenId, regionId, championName, championDrawnName=false, familyCompleted=false}

        this.game.news = result;
        this.game.current = next.id;

        this.database.ref(`/games/${this.ingame}`).set(this.game);

        return next;
    }

    async recoverBundles() {
        this.game.bundles = await this.get(`/games/${this.ingame}/bundles`);
        
        if(!this.game.bundles) this.game.bundles = {};

        for(let p of Object.keys(this.participants)) {
            if(!(p in this.game.bundles)) {
                this.game.bundles[p] = [];
            }
        }
    }

    async recoverDeck() {
        this.game.deck = await this.get(`/games/${this.ingame}/deck`);
        if(!this.game.deck) this.game.deck = [];
    }

    async recoverCurrent() {
        this.game.current = await this.get(`/games/${this.ingame}/current`);
    }

    async recoverCompleted() {
        this.game.completed = await this.get(`/games/${this.ingame}/completed`);
    }

    removeCard(card) {
        let i = this.bundle.indexOf(card);
        if(i !== -1) this.bundle.splice(i, 1);
    }

    completeFamily(family) {
        let f = families[family];
        let b = copy(this.bundle).filter(champion => f.indexOf(champion) !== -1);

        if(b.length == 6) {
            if(this.completeFamilies[this.key] == false) {
                this.completeFamilies[this.key] = [];
            }

            this.completeFamilies[this.key].push(family);

            return true;
        }

        return false;
    }


    bindGameChanges(callback) {
        let ref = this.database.ref(`/games/${this.ingame}`);

        ref.on('child_changed', snapshot => {if(snapshot.key == 'news') callback(snapshot.val(), 'newRound');});
        ref.on('child_removed', snapshot => {if(snapshot.key == 'hoster') callback(snapshot.val(), 'gameFinished');});
    }

    unbindGameChanges() {
        let ref = this.database.ref(`/games/${this.ingame}`);
        ref.off('child_changed');
        ref.off('child_removed');
    }

    gameFinished() {
        // no longer deck & every bundle is empty because every families are formed
        if((this.deck.length==0 || !this.deck) && (Object.keys(filterObj(this.game.bundles, (id, bundle) => bundle.length>0)) == 0)) {
            let winner = false;
            let maxFormed = 0;

            for(let p of Object.keys(this.participants)) {
                let formed = this.completeFamilies[p]? this.completeFamilies[p].length : 0;
                if(formed > maxFormed) {
                    maxFormed = formed;
                    winner = this.participants[p];
                }
            }

            winner = copy(winner);
            winner.formed = maxFormed;

            return winner;
        }

        return false;
    }

    getOutOfGame() {
        this.unbindGameChanges();

        this.ingame = false;
        let ref = `players/${this.key}`;
        this.database.ref(`${ref}/ingame`).set(this.ingame);
        this.database.ref(`${ref}/wins`).set(this.iWins);
        this.database.ref(`${ref}/losses`).set(this.iLosses);

        if(this.hosting) {
            this.hosting = false;
            this.database.ref(`${ref}/hosting`).set(this.bHosting);
            setTimeout(() => {
                this.database.ref(`/games/${this.key}`).remove();
            }, 3000);
        }
    }



    /// ---------------------------



	














    /// ---------------------------

    // recover remote data
    async get(path) {
        return await this.database.ref(path).once('value').then(snapshot => snapshot.val());
    }
    
    // getters / setters
    get username()  {return this.name;}
    get id()        {return this.key;}
    get ingame()    {return this.bIngame;}
    get hosting()   {return this.bHosting;}
    get wins()      {return this.iWins;}
    get losses()    {return this.iLosses;}
    get lobby()     {return this.sLobby;}

    set username(username)  {this.name = username;}
    set id(id)              {this.key = id;}
    set ingame(bool)        {this.bIngame = bool;}
    set hosting(bool)       {this.bHosting = bool;}
    set wins(int)           {this.iWins = int;}
    set losses(int)         {this.iLosses = int;}
    set lobby(val)          {this.sLobby = val;}


    // ingame getters / setters
    get bundle()        {return this.game.bundles[this.key];}
    getBundle(playerId) {return this.game.bundles[playerId];}
    get deck()          {return this.game.deck;}
    get current()       {return this.game.current;}
    get gameFamilies()	{return this.game.families;}
    get participants()  {return this.game.participants;}
    get completeFamilies()  {return this.game.completed;}


    // incr

    win()  {this.iWins++;}
    lose() {this.iLosses++;}
}










// utility
let charTable = 'abcdefghijklmnoprstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randomKey = len => {
    let key = '';
    for(let i=0; i < len; i++) key += charTable[rand(0, charTable.length-1)];
    return key;
};

const randomFamilies = n => {
	let f = copy(families);
	let familyNames = Object.keys(f);

	while(familyNames.length > n)
		familyNames.splice(rand(0, familyNames.length-1), 1);

	return familyNames;
};

const initDeck = familyNames => {
	let deck = [];
	for(let f of familyNames) deck.push(...families[f]);
	shuffle(deck);
	return deck;
};

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

export {Player};