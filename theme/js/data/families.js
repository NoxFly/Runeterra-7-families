import {filterObj} from '../utils.js';

/** @constant {Object} families object of arrays that contains each families and each champions */
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

/** @constant {Array} regions real region names with uppercases, accents etc... */
const regions = ['Bandle', 'Bilgewater', 'Demacia', 'Freljord', 'Iles Obscures', 'Ionia', 'Ixtal', 'Mont Targon', 'Néant', 'Noxus', 'Piltover', 'Shurima', 'Zaun'];

/**
 * Return the region of a champion
 * @param {String} champion champion name (not formated)
 */
const championRegion = champion => {
    let region = Object.keys(filterObj(families, (region, champList) => champList.indexOf(champion) !== -1));
    if(region.length == 1) return regions[Object.keys(families).indexOf(region[0])];
    return null;
};

/**
 * Return the region name well formed
 * @param {String} regionId region name formated
 */
const regionName = regionId => regions[Object.keys(families).indexOf(regionId)];


export {families, regions, championRegion, regionName};