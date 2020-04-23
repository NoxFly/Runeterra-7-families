import {filterObj} from '../utils.js';

const families = {
    bandle:         ['Corki', 			'Lulu', 		'Rumble', 		'Teemo', 			'Tristana', 	'Veigar'],
    bilgewater:     ['Fizz', 			'Gangplank', 	'Illaoi', 		'Miss Fortune', 	'Nautilus', 	'Pyke'],
    demacia:        ['Fiora', 			'Garen', 		'Jarvan IV', 	'Lux', 				'Poppy', 		'Xin-Zhao'],
    freljord:       ['Anivia', 			'Ashe', 		'Braum', 		'Sejuani', 			'Trundle', 		'Tryndamere'],
    iles_obscures:  ['Hecarim', 		'Kalista', 		'Karthus', 		'Mordekaiser', 		'Thresh', 		'Yorick'],
    ionia:          ['Ahri', 			'Irelia', 		'Karma', 		'Kennen', 			'Shen', 		'Zed'],
    ixtal:          ['Malphite', 		'Neeko', 		'Nidalee', 		'Qiyana', 			'Rengar', 		'Zyra'],
    mont_targon:    ['Aurelion Sol', 	'Diana', 		'Leona', 		'Pantheon', 		'Taric', 		'Zoe'],
    neant:          ['Cho\'Gath', 		'Kai\'Sa', 		'Kha\'Zix', 	'Malzahar', 		'Rek\'Sai', 	'Vel\'Koz'],
    noxus:       	['Darius', 			'Draven', 		'Katarina', 	'Sion', 			'Swain', 		'Talon'],
    piltover:       ['Caitlyn', 		'Camille', 		'Heimerdinger', 'Jayce', 			'Orianna', 		'Vi'],
    shurima:        ['Amumu', 			'Azir', 		'Nasus', 		'Renekton', 		'Sivir', 		'Xerath'],
    zaun:           ['Ekko', 			'Jinx', 		'Singed', 		'Twitch', 			'Urgot', 		'Warwick']
};

const regions = ['Bandle', 'Bilgewater', 'Demacia', 'Freljord', 'Iles Obscures', 'Ionia', 'Ixtal', 'Mont Targon', 'Néant', 'Noxus', 'Piltover', 'Shurima', 'Zaun'];


const championRegion = champion => {
    let region = Object.keys(filterObj(families, (region, champList) => champList.indexOf(champion) !== -1));
    if(region.length == 1) return regions[Object.keys(families).indexOf(region[0])];
    return null;
};

const regionName = regionId => regions[Object.keys(families).indexOf(regionId)];

export {families, regions, championRegion, regionName};