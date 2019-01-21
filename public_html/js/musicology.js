// https://spinditty.com/learning/chord-building-for-musicians
// http://www.ethanhein.com/wp/2015/making-chords-from-scales/
// https://www.guitarhabits.com/building-chords-and-progressions-of-the-minor-scale/
// https://www.starlandmusic.com/piano-lesson-tips/find-notes-chord-guest-blogger-eric-myers/
// https://www.piano-keyboard-guide.com/c-sharp-major-scale.html
 
const Musicology = (function(){
	
	const WHOLE = 2;
	const HALF = 1;
	const ONE_AND_HALF = 3;
	const NATURAL = '';
	const FLAT = 'b';
	const SHARP = '#';
	const notes = ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B'];
	const scale_patterns = {
		'major': [WHOLE, WHOLE, HALF, WHOLE, WHOLE, WHOLE, HALF],
		'ionian': [WHOLE, WHOLE, HALF, WHOLE, WHOLE, WHOLE, HALF],
		'natural minor': [WHOLE, HALF, WHOLE, WHOLE, HALF, WHOLE, WHOLE],
		'harmonic minor': [WHOLE, HALF, WHOLE, WHOLE, HALF, ONE_AND_HALF, HALF],
		'melodic minor asc': [WHOLE, HALF, WHOLE, WHOLE, WHOLE, WHOLE, HALF],
		'melodic minor desc': [WHOLE, WHOLE, HALF, WHOLE, WHOLE, HALF, WHOLE],
		'dorian': [WHOLE, HALF, WHOLE, WHOLE, WHOLE, HALF, WHOLE],
		'mixolydian': [WHOLE, WHOLE, HALF, WHOLE, WHOLE, HALF, WHOLE],
		'phrygian': [HALF, WHOLE, WHOLE, WHOLE, HALF, WHOLE, WHOLE],
		'aeolian': [WHOLE, HALF, WHOLE, WHOLE, HALF, WHOLE, WHOLE],
		'locrian': [HALF, WHOLE, WHOLE, HALF, WHOLE, WHOLE]
	};
	const chord_formulas = {
		'major': ['1', '3', '5'],
		'minor': ['1', 'b3', '5'],
		'7th': ['1', '3', '5', 'b7'],
		'major 7th': ['1', '3', '5', '7'],
		'minor 7th': ['1', 'b3', '5', 'b7'],
		'6th': ['1', '3', '5', '6'],
		'minor 6th': ['1', 'b3', '5', '6'],
		'diminished': ['1', 'b3', 'b5'],
		'diminished 7th': ['1', 'b3', 'b5', 'bb7'],
		'half diminished 7th': ['1', 'b3', 'b5', 'b7'],
		'augmented': ['1', '3', '#5'],
		'7th #5': ['1', '3', '#5', 'b7'],
		'9th': ['1', '3', '5', 'b7', '9'],
		'7th #9': ['1', '3', '5', 'b7', '#9'],
		'major 9th': ['1', '3', '5', '7', '9'],
		'added 9th': ['1', '3', '5', '9'],
		'minor 9th': ['1', 'b3', '5', 'b7', '9'], // C Eb G Bb D
		'minor add 9th': ['1', 'b3', '5', '9'],
		'11th': ['1', '3', '5', 'b7', '9', '11'],
		'minor 11th': ['1', 'b3', '5', 'b7', '9', '11'],
		'7th #11': ['1', '3', '5', 'b7', '#11'],
		'major 7th #11': ['1', '3', '5', '7', '9', '#11'],
		'13th': ['1', '3', '5', 'b7', '9', '11', '13'],
		'major 13th': ['1', '3', '5', '7', '9', '11', '13'],
		'minor 13th': ['1', 'b3', '5', 'b7', '9', '11', '13'],
		'suspended 4th': ['1', '4', '5'],
		'suspended 2nd': ['1', '2', '5'],
		'5th': ['1', '5']
	};
	
	function _getScaleAccidental(scale) {
		for (var i = 0; i < scale.length; i++) {
			if (~scale[i].indexOf(SHARP)) return SHARP;
			if (~scale[i].indexOf(FLAT)) return FLAT;
		}
		return NATURAL;
	}
	
	function _getNotesStartingWith(note='C'){
		var starting_idx = false;
		var accidental = NATURAL;
		for(var i=0; i<notes.length; i++){
			if(note === notes[i]){
				starting_idx = i;
				break;
			}else if(~note.indexOf(FLAT)||~note.indexOf(SHARP)){
				if(notes[i].indexOf(note) === 0){
					accidental = SHARP;
					starting_idx = i;
					break;
				}else if(notes[i].indexOf(note) === 3){
					accidental = FLAT;
					starting_idx = i;
					break;
				}
			}
		}
		if(starting_idx === false) return false;
		var n = [...notes.slice(starting_idx), ...notes.slice(0,starting_idx)];
		if(accidental) for(var i=0; i<n.length; i++) if(~n[i].indexOf("/")) n[i]=n[i].split("/")[accidental==FLAT?1:0];
		return {accidental: accidental, notes: n}
	}
	
	function getNotes(){
		return notes;
	}
	
	function transposeNote(note, difference, accidental='') {
		var n = _getNotesStartingWith(note);
		if (!n) return false;
		n = n.notes;
		if (difference < 0) difference = n.length + difference;
		var note = n[difference];
		if (accidental == SHARP && ~note.indexOf("/")) note = note.substr(0, 2);
		else if (accidental == FLAT && ~note.indexOf("/")) note = note.substr(3);
		return note;
	}
	
	function getModesNames(){
		return Object.keys(scale_patterns);
	}
	
	function getChordTypes(){
		return Object.keys(chord_formulas);
	}
	
	function getChord(root='C', type='major'){
		type = type.toLowerCase();
		if(!chord_formulas[type]) return false;
		var formula = chord_formulas[type]; 
		var scale = getScale(root); scale.pop();
		var acc = _getScaleAccidental(scale);
		const getNoteFromFormula = f => {
			var add = 0;
			while (f[0] == 'b') {add -= 1; f = f.substr(1)}
			while (f[0] == '#') {add += 1; f = f.substr(1)}
			f = parseInt(f); if(f >= scale.length) f = f-scale.length;
			if(f === 0) f = scale.length;
			var baseNote = scale[f-1];
			return transposeNote(baseNote, add, acc);
		};
		var chord = [];
		for (var i = 0; i < formula.length; i++) chord.push(getNoteFromFormula(formula[i]));
		chord = chord.map(n=>n.split("/")[0]);
		return chord;
	}
	
	function getScale(key='C', mode='major'){
		mode = mode.toLowerCase();
		if(!scale_patterns[mode]) return false;
		var scale = [];
		var n = _getNotesStartingWith(key);
		if(n) n = n.notes;
		else return false; 
		for(var i=0, x=0; i<notes.length; i+=scale_patterns[mode][x], x++) scale.push(n[i]);
		scale.push(key);
		scale = scale.map(n=>n.split("/")[0]);
		return scale;
	}
	
	return {
		getModesNames: getModesNames,
		getChordTypes: getChordTypes,
		getNotes: getNotes,
		getScale: getScale,
		transposeNote: transposeNote,
		getChord: getChord
	}
})();
