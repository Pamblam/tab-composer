"use strict";

var audio_loaded = false;
var audio_ready_stack = [];
preloadAudio().then(()=>{
	audio_loaded = true;
	while(audio_ready_stack.length) audio_ready_stack.shift()();
});

function onAudioReady(cb){
	if(audio_loaded) cb();
	else audio_ready_stack.push(cb);
}

function playAudio(audio, speed, posCb=false, doneCb=false){
	var pos = 0;
	var interval = setInterval(()=>{
		if(!audio.length){
			clearInterval(interval);
			if("function" === typeof doneCb) doneCb();
			return;
		}
		if("function" === typeof posCb) posCb(pos);
		var notes = audio.shift();
		if(notes) notes.play();
		pos++;
	}, speed);
}

function preloadAudio() {
	return new Promise(resolve=>{
		var promises = [];
		"eADGBE".split('').forEach(d=>{
			for(let i=0; i<15; i++){
				promises.push(new Promise(done=>{
					var audio = new Audio();
					audio.addEventListener('canplaythrough', done, false);
					audio.src = `audio/${d}/${i}.wav`;
				}));
			};
		});
		Promise.all(promises).then(resolve);
	});
}

class Song{
	constructor(){
		this.sound_groups = []; // 2d array of Sound objects
		this.speed = 250;
	}
	addSounds(sounds){
		if(!Array.isArray(sounds)) sounds = [sounds];
		this.sound_groups.push(sounds);
	}
	play(posCb=false, doneCb=false){
		var pos = 0;
		const pg = () => {
			if(!this.sound_groups[pos]){
				if("function" === typeof doneCb) doneCb();
				return;
			}
			this.playSingleGroup(pos, mpos=>{
				if("function" === typeof posCb) posCb(mpos, pos);
			}, ()=>{
				pos++;
				pg();
			});
		};
		pg();
	}
	playSingleGroup(grpIdx, posCb=false, doneCb=false){
		var group = this.sound_groups[grpIdx];
		var pos = 0;
		var interval = setInterval(()=>{
			if(!group[pos]){
				clearInterval(interval);
				if("function" === typeof doneCb) doneCb();
				return;
			}
			var sound = group[pos];
			if(sound) sound.play();
			if("function" === typeof posCb) posCb(pos);
			pos++;
		}, this.speed);
	}
}

class Sound{
	constructor(notes){
		var files = notes.map(note=>`audio/${note.str}/${note.fret}.wav`);
		this.players = [];
		files.forEach(file=>{
			this.players.push(new Audio(file));
			this.players[this.players.length-1].volume=1;
		});
	}
	play(length=false){
		this.players.forEach(player=>{
			player.play();
		});
		if(length) setTimeout(()=>this.stop(), length);
		return this;
	}
	stop(){
		this.players.forEach(player=>{
			player.pause();
			player.currentTime = 0;
		});
		return this;
	}
}

class CompoundSound{
	constructor(notes){
		this.sounds = [];
		notes.forEach(note=>{
			if(note instanceof CompoundNote){
				switch(note.type){
					case 'slide': this.sounds.push(new Slide(note.str, note.fret1, note.fret2)); break;
					case 'pulloff': this.sounds.push(new Pulloff(note.str, note.fret1, note.fret2)); break;
					case 'hammeron': this.sounds.push(new Hammeron(note.str, note.fret1, note.fret2)); break;
				}
			}else{
				this.sounds.push(new Sound([note]));
			}
		});
	}
	play(length=false){
		this.sounds.forEach(sound=>{
			sound.play(length);
		});
		return this;
	}
	stop(){
		this.sounds.forEach(sound=>{
			sound.stop();
		});
		return this;
	}
}

class Slide extends Sound{
	constructor(str, start_fret, end_fret){
		var frets = []; for(var i=Math.min(start_fret, end_fret); i<=Math.max(start_fret, end_fret); i++) frets.push(i);
		var notes = frets.map(f=>new Note(str, f));
		if(start_fret > end_fret) notes = notes.reverse();
		super(notes);
		this.stopped = false;
	}
	play(length=250){
		if(!length) length = 250;
		this.stopped = false;
		var i=0;
		var interval = setInterval(()=>{
			if(!this.players[i] || this.stopped){
				clearInterval(interval);
				return;
			}
			if(i>0){
				this.players[i-1].pause();
				this.players[i-1].currentTime = 0;
			}
			this.players[i].play();
			i++;
		}, length/this.players.length);
		return this;
	}
	stop(){
		this.stopped = true;
		super.stop();
		return this;
	}
}

class Hammeron extends Sound{
	constructor(str, start_fret, end_fret){
		if(start_fret > end_fret) [start_fret, end_fret] = [end_fret, start_fret];
		var notes = [start_fret, end_fret].map(f=>new Note(str, f));
		super(notes);
	}
	play(length=250){
		super.play();
		if(!length) length = 250;
		this.players[0].play();
		setTimeout(()=>{ 
			this.players[0].pause();
			this.players[0].currentTime = 0;
			this.players[1].play();
		}, length);
	}
}

class Pulloff extends Hammeron{
	constructor(str, start_fret, end_fret){
		super(str, start_fret, end_fret);
		this.players = this.players.reverse();
	}
}

class Note{
	constructor(str, fret){
		this.str = str;
		this.fret = +fret;
	}
	getStrDisplay(){
		return this.fret.toString();
	}
}

class CompoundNote{
	constructor(str, fret1, fret2, type='slide'){
		this.types = ['slide', 'pulloff', 'hammeron'];
		this.symbols = ['/', 'p', 'h'];
		this.str = str;
		this.fret1 = +fret1;
		this.fret2 = +fret2;
		this.type_id=this.types.indexOf(type);
		if(this.type_id === -1) this.type_id = 0;
		this.type = this.types[this.type_id];
		this.symbol = this.symbols[this.type_id];
	}
	getStrDisplay(){
		return this.fret1.toString()+this.symbol+this.fret2.toString();
	}
}

class NoteGroup{
	constructor(){
		this.notes = [];
		this.chord_name = null;
		this.chord_type = null;
		this.chord_voicing = null;
		this.hasCompoundNotes = false;
	}
	clone(){
		var ng = new NoteGroup();
		ng.chord_name = this.chord_name;
		ng.chord_type = this.chord_type;
		ng.chord_voicing = this.chord_voicing;
		this.notes.forEach(n=>{
			n instanceof CompoundNote ?
				ng.add(n.str, n.fret1, n.fret2, n.type):
				ng.add(n.str, n.fret);
		});
		return ng;
	}
	hasDetails(){
		return this.chord_name !== null &&
			this.chord_type !== null &&
			this.chord_voicing !== null;
	}
	setDetails(name, type, voicing){
		if(name && type && ~['string', 'number'].indexOf(typeof voicing)){
			this.chord_name = name;
			this.chord_type = type;
			this.chord_voicing = voicing;
		}
	}
	add(str, fret, fret2=false, type=false){
		if(false !== fret2 && false !== type){
			this.hasCompoundNotes = true;
			this.notes.push(new CompoundNote(str, fret, fret2, type));
		}else{
			this.notes.push(new Note(str, fret));
		}
	}
	getSound(){
		return this.hasCompoundNotes ? new CompoundSound(this.notes) : new Sound(this.notes);
	}
	getFretDisplayOnString(string_name){
		var disp_name = '-';
		this.notes.forEach(note=>{
			if(note.str === string_name){
				disp_name = note.getStrDisplay();
			}
		});
		return disp_name;
	}
	getFretNumberOnString(string_name){
		var fret_num = null;
		this.notes.forEach(note=>{
			if(note.str === string_name) fret_num = note.fret;
		});
		return fret_num;
	}
}