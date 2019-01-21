const Voicings = (function(){
	var noteMap = ['C',['C#','Db'],'D',['D#','Eb'],'E','F',['F#','Gb'],'G',['G#','Ab'],'A',['A#','Bb'],'B'];
	
	function normalizeNote(note){
		note = note.toUpperCase();
		for(var i=0; i<noteMap.length; i++){
			if(Array.isArray(noteMap[i])){
				if(note === noteMap[i][0].toUpperCase() || note === noteMap[i][1].toUpperCase()) return noteMap[i][0];
			}else{
				if(note === noteMap[i].toUpperCase()) return noteMap[i];
			}
		}
		throw new Error("invalid note: "+note);
	}
	
	function getNextNote(note){
		idx=false;
		note = note.toUpperCase();
		for(var i=0; i<noteMap.length; i++){
			if(Array.isArray(noteMap[i])){
				if(note === noteMap[i][0].toUpperCase() || note === noteMap[i][1].toUpperCase()){
					idx = i; break;
				}
			}else{
				if(note === noteMap[i].toUpperCase()){
					idx = i; break;
				}
			}
		}
		idx++;
		if(idx==noteMap.length) idx=0;
		return Array.isArray(noteMap[idx])?noteMap[idx][0]:noteMap[idx];
	}
	
	function allCombos(arr) {
		if (arr.length == 1) {
			return arr[0];
		} else {
			var result = [];
			var allCasesOfRest = allCombos(arr.slice(1));  // recur with the rest of array
			for (var i = 0; i < allCasesOfRest.length; i++) {
				for (var j = 0; j < arr[0].length; j++) {
					result.push(arr[0][j] + ',' + allCasesOfRest[i]);
				}
			}
			return result;
		}
	}
	
	function arrayContainsArray(superset, subset) {
		if (0 === subset.length) {
			return false;
		}
		return subset.every(function (value) {
			return (superset.indexOf(value) >= 0);
		});
	}
	
	class Voicings{
		constructor(){
			this.strings=null;
			this.tuning=null;
			this.frets=null;
			this.chord=[];
			this.fretboard=[];
		}
		
		getAllOccurencesOfNote(note){
			note = normalizeNote(note);
			var occurences = [];
			for(var string=0; string<this.fretboard.length; string++){
				var str = [];
				for(var fret=0; fret<this.fretboard[string].length; fret++){
					if(this.fretboard[string][fret] == note) str.push(fret);
				}
				occurences.push(str);
			}
			return occurences;
		}
		
		getAllVoicings(maxFretDistance){
			var stringNotes = [], countXes, x1, x2, fretDistance, n, i, o, combos, chord, voicings=[], ca, min, max, avgHeight, filter, ah, bh, ad, bd;
			fretDistance = f=>{
				min = f.reduce((a,c)=>c=='x'?a:a!=null&&a<c?a:c,null);
				max = f.reduce((a,c)=>c=='x'?a:a!=null&&a>c?a:c,null);
				return max-min;
			};
			countXes=a=>a.reduce((a,c)=>c=='x'?a+1:a,0);
			filter = f=>{
				if(undefined==maxFretDistance) return true;
				return maxFretDistance>=fretDistance(f);
			};
			avgHeight = f=>f.reduce((a,c)=>c=='x'?a:a+parseInt(c),0)/f.filter(a=>a!=='x'&&a!==0).length;
			for(n=0; n<this.strings; n++) stringNotes.push(['x']);
			for(n=0; n<this.chord.length; n++){
				o = this.getAllOccurencesOfNote(this.chord[n]);
				for(i=0; i<o.length; i++) stringNotes[i].push(...o[i]);
			}
			combos = allCombos(stringNotes);
			for(i=combos.length; i--;){
				ca = combos[i].split(",").map(n=>n=='x'?n:parseInt(n));
				chord = ca.map((n,idx)=>n=='x'?n:this.fretboard[idx][n]);
				if(!arrayContainsArray(chord, this.chord)) continue;
				if(filter(ca)) voicings.push(ca);
			}
			voicings.sort((a,b)=>{
				x1 = countXes(a);
				x2 = countXes(b);
				if(x1 != x2) return x1<x2?-1:1
				ah = avgHeight(a);
				bh = avgHeight(b);
				if(ah != bh) return ah<bh?-1:1;
				ad = fretDistance(a);
				bd = fretDistance(b);
				if(ad != bd) return ad<bd?-1:1;
				return 0;
			});
			return voicings;
		}
		
		getFretboard(){
			if(this.fretboard.length) return this.fretboard;
			var fb=[], string, note;
			for(var i=0; i<this.tuning.length; i++){
				string=[];
				note=this.tuning[i]; 
				for(var n=0; n<this.frets; n++){
					string.push(note);
					note=getNextNote(note);
				}
				fb.push(string);
			}
			return fb;
		}
		
		setInstrument(strings, frets, tuning){
			if(!strings || !frets || !tuning) throw new Error("The constructor requires a numeric 'strings', and 'frets' argument as well as a 'notes' array'");
			if(!Array.isArray(tuning) || tuning.length !== strings) throw new Error("The number of elements in the 'tuning' array must match the number of strings.");
			this.tuning=[];
			for(var i=0; i<tuning.length; i++) this.tuning.push(normalizeNote(tuning[i]));
			this.strings=parseInt(strings);
			this.frets=parseInt(frets);
			this.fretboard = this.getFretboard();
			return this;
		}
		
		setChord(chord){
			if(!Array.isArray(chord)) throw new Error("Chord must be an array of nbotes.");
			for(var i=0; i<chord.length; i++) this.chord.push(normalizeNote(chord[i]));
			return this;
		}
	}
	
	return Voicings;
})();