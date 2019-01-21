"use strict";

var song_parts = {};
var song_key = [];
$(()=>{
	 
	$("#notes_modal").modal({show: false});
	$("#song_part_modal").modal({show: false});
	
	var note_names = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];
	$("#notes_modal_chord_sel").html('<option value="">None</option>'); 
	note_names.forEach(note=>$("#notes_modal_chord_sel").append(`<option value='${note}'>${note}</option>`));
	note_names.forEach(note=>$("#project-key").append(`<option value='${note}' ${note==='C'?'selected':''}>${note}</option>`));
	
	var chord_qualities = Musicology.getChordTypes();
	$("#notes_modal_type_sel").html('<option value="">None</option>'); 
	chord_qualities.forEach(q=>$("#notes_modal_type_sel").append(`<option value='${q}'>${q}</option>`));
	
	var scale_modes = Musicology.getModesNames();
	scale_modes.forEach(mode=>$("#project-mode").append(`<option value='${mode}' ${mode==='major'?'selected':''}>${mode}</option>`));
	song_key = Musicology.getScale($("#project-key").val(), $("#project-mode").val());
	$("#notes_modal_chord_sel option").each(function(){ if(!~song_key.indexOf($(this).val())) this.style.backgroundColor = 'red'; });
	
	$(document).on('change', '#project-mode, #project-key', function(e){
		song_key = Musicology.getScale($("#project-key").val(), $("#project-mode").val());
		$("#notes_modal_chord_sel option").each(function(){ 
			if(!~song_key.indexOf($(this).val())){
				this.style.backgroundColor = 'red';
			}else{
				this.style.backgroundColor = null;
			}
		});
	});	
	
	$(document).on('click', "#new_song_part_btn", function(e){
		e.preventDefault();
		getSongPartName().then(name=>{
			song_parts[name] = new MeasureGroup();
			var panel = `<br><div class="panel panel-default song-part-panel" data-name="${encodeURIComponent(name)}">
				<div class="panel-heading">
					<h3 class="panel-title">${name}</h3>
				</div>
				<div class="panel-body">
					<div class="well well-sm measure_container">Add a measure to get started</div>
				</div>
				<div class="panel-footer">
					<button class="btn btn-primary add_measure_btn"><span class='glyphicon glyphicon-plus'></span> Add Measure</button>
					<button class="btn btn-success play_all_btn"><span class='glyphicon glyphicon-play'></span> Play</button>
				</div>
			</div>`;
			$("#song_parts_div").append(panel);
		});
	});
	
	$(document).on('change', '#notes_modal_chord_sel', function(e){
		$("#notes_modal_version").empty();
		if($('#notes_modal_chord_sel').val() !== ''){
			if($("#notes_modal_type_sel").val()==="") $("#notes_modal_type_sel").val("major");
		}else{
			$("#notes_modal_type_sel").val('');
		}
		if(this.value !== '') generateChordForModal();
	});
	
	$(document).on('change', '#notes_modal_type_sel', function(e){
		$("#notes_modal_version").empty();
		if(this.value !== '') generateChordForModal();
	});
	
	$(document).on('change', '#notes_modal_version', function(e){
		if(this.value) generateChordForModal(true);
	});
	
	$(document).on('click', '.add_measure_btn', function(e){
		e.preventDefault();
		var $song_part_panel = $(this).parent().parent();
		var song_part_name = decodeURIComponent($song_part_panel.data('name'));
		if(song_parts[song_part_name].isEmpty()) $song_part_panel.find('.measure_container').empty();
		song_parts[song_part_name].new($song_part_panel.find('.measure_container'));
	});

	$(document).on('mouseover', '.measure-col', function(e){
		e.preventDefault();
		var c = $(this).data('col');
		var m = $(this).parent().parent().data('id');
		$(this).parent().parent().parent().parent().parent().find(`.measure-${m}`).find(`.measure-col-${c}`).addClass('measure-col-hover');
	});

	$(document).on('mouseout', '.measure-col', function(e){
		e.preventDefault();
		var c = $(this).data('col');
		var m = $(this).parent().parent().data('id');
		$(this).parent().parent().parent().parent().parent().find(`.measure-${m}`).find(`.measure-col-${c}`).removeClass('measure-col-hover');
	});

	$(document).on('click', '.measure-col', function(e){
		e.preventDefault();
		var colid = $(this).data('col');
		var measureid = $(this).parent().parent().data('id');
		var song_part_name = decodeURIComponent($(this).parent().parent().parent().parent().parent().data('name'));
		var measure = song_parts[song_part_name].fromID(measureid);
		var column = measure.notes[colid];
		getNotes(column).then(notes=>{
			measure.notes[colid] = notes;
			measure.draw();
		});
	});
	
	$(document).on('keyup', '.fret-num-input', function(e){
		this.value = this.value.replace(/[^\d]/g, '');
		if(this.value > 14) this.value = 14;
		var str_names = ["E","B","G","D","A","e"];
		var notes = new NoteGroup();
		str_names.forEach(str=>{
			var val = $('#notes_modal_'+str).val();
			if(val !== '') notes.add(str, val);
		});
		$('#notes_modal_chord_sel').val('');
		$("#notes_modal_type_sel").val('');
		$("#notes_modal_version").val('');
		getChart(notes).then(img=>$("#notes_modal_chart").empty().append(img));
	});
	
	$(document).on('keyup', '.fret-num-trans-input', function(e){
		this.value = this.value.replace(/[^\d]/g, '');
		if(this.value > 14) this.value = 14;
	});
	
	$(document).on('click', '.play_all_btn', function(e){
		e.preventDefault();
		var $song_part_panel = $(this).parent().parent();
		var song_part_name = decodeURIComponent($song_part_panel.data('name'));		
		var song = song_parts[song_part_name].getSong();
		var measure_id_map = song_parts[song_part_name].measures.map(m=>m.id);
		onAudioReady(()=>{
			song.play((c, m)=>{
				$song_part_panel.find(".measure-col-hover").removeClass('measure-col-hover');
				$song_part_panel.find(`.measure-${measure_id_map[m]}`).find(`.measure-col-${c}`).addClass('measure-col-hover');
			}, ()=>{
				$song_part_panel.find(".measure-col-hover").removeClass('measure-col-hover');
			});
		});
	});
	
	$(document).on('click', '.delete-measure', function(e){
		e.preventDefault();
		var $panel = $(this).parent().parent().parent().parent().parent().parent();
		var song_part_name = decodeURIComponent($panel.data('name'));
		var measure_id = $(this).parent().parent().parent().data('id');
		song_parts[song_part_name].deleteById(measure_id);
	});
	
	$(document).on('click', '.clear-measure', function(e){
		e.preventDefault();
		var $panel = $(this).parent().parent().parent().parent().parent().parent();
		var song_part_name = decodeURIComponent($panel.data('name'));
		var measure_id = $(this).parent().parent().parent().data('id');
		song_parts[song_part_name].fromID(measure_id).clear();
	});
	
	$(document).on('click', '.dupe-measure', function(e){
		e.preventDefault();
		var $panel = $(this).parent().parent().parent().parent().parent().parent();
		var song_part_name = decodeURIComponent($panel.data('name'));
		var measure_id = $(this).parent().parent().parent().data('id');
		song_parts[song_part_name].dupeByID(measure_id);
	});
});

function getSongPartName(){
	return new Promise(done=>{
		$('#song_part_modal_name').val('Verse');
		$("#song_part_modal").modal('show');
		$("#song_part_modal_save").off('click').click(function(e){
			e.preventDefault();
			var name = $('#song_part_modal_name').val().trim();
			if(!name) return;
			for (var i = 2; song_parts.hasOwnProperty(name); i++) {
				name = name.replace(/ ?\d*$/, '') + " " + i;
			}
			$("#song_part_modal").modal('hide');
			done(name);
		});
	});
}

function getChart(notes){
	return new Promise(done=>{
		var str_names = ["E","B","G","D","A","e"];
		var strings = [new Fretted.String(), new Fretted.String(), new Fretted.String(), new Fretted.String(), new Fretted.String(), new Fretted.String()];
		str_names.forEach((name, i)=>{
			var fret_num = notes.getFretNumberOnString(name);
			if(fret_num !== null){
				strings[i].setFret(fret_num);
			}else{
				strings[i].setNote(name.toUpperCase());
			}
		});
		Fretted.Guitar().makeChord(strings).render(Fretted.IMAGE).then(done);
	});
}

function generateChordForModal(use_existing_voicings=false, voicing_num=false){
	var note = $('#notes_modal_chord_sel').val();
	var type = $("#notes_modal_type_sel").val();
	if(!note || !type) return;
	var chord = Musicology.getChord(note, type);
	var v = new Voicings().setInstrument(6, 14, ["E","B","G","D","A","E"]);
	v.setChord(chord);
	var voicings = v.getAllVoicings(5);
	if(!voicings.length){
		$("#notes_modal_version").empty();
		return;
	}
	if(!use_existing_voicings){
		$("#notes_modal_version").empty();
		for(var i=0; i<voicings.length; i++){
			$("#notes_modal_version").append(`<option value='${i}'>Voicing #${i}</option>`);
		}
		$("#notes_modal_version").val(voicing_num===false?'0':voicing_num);
	}
	var version = $("#notes_modal_version").val();
	if(!voicings.length) return;
	var str_names = ["E","B","G","D","A","e"];
	var voicing = voicings[version];	
	var notes = new NoteGroup();
	voicing.forEach((note, idx)=>{
		if(note !== 'x') notes.add(str_names[idx], note);
	});
	$(".fret-num-input").val('');
	notes.notes.forEach(note=>{
		$('#notes_modal_'+note.str).val(note.fret);
	});
	
	getChart(notes).then(img=>$("#notes_modal_chart").empty().append(img));
}

function getNotes(notes){
	return new Promise(done=>{
		$(".fret-num-input").val('');
		$('#notes_modal_chord_sel').val(notes.chord_name || '');
		$("#notes_modal_type_sel").val(notes.chord_type || '');
		$("#notes_modal_version").empty();
		
		// transitions tab
		$(".notes-modal-transition").val('slide');
		$(".fret-num-trans-input").val('');
		
		if(notes.hasCompoundNotes){
			$('.nav-tabs a[href="#notes_modal_slides_tab"]').tab('show');
			
			notes.notes.forEach(note=>{
				if(note instanceof CompoundNote){
					if(note.fret1 !== null) $('#notes_modal_transition_start_'+note.str).val(note.fret1);
					if(note.type) $('#notes_modal_transition_'+note.str).val(note.type);
					if(note.fret2 !== null) $('#notes_modal_transition_end_'+note.str).val(note.fret2);
				}else{
					if(note.fret !== null) $('#notes_modal_transition_start_'+note.str).val(note.fret);
				}
			});
			
		}else{
			$('.nav-tabs a[href="#notes_modal_chord_tab"]').tab('show');
			notes.notes.forEach(note=>{
				$('#notes_modal_'+note.str).val(note.fret);
			});

			if(notes.hasDetails()){
				generateChordForModal(false, notes.chord_voicing);
			}
			
			getChart(notes).then(img=>$("#notes_modal_chart").empty().append(img));
		}
		
		$("#notes_modal").modal('show');
		
		
		$("#notes_modal_save").off('click').click(function(){
			var str_names = ["E","B","G","D","A","e"];
			var notes = new NoteGroup();
			var active_tab = $("ul#notes_modal_slides_tablist li.active>a").attr('href');
			if(active_tab === '#notes_modal_chord_tab'){
				str_names.forEach(str=>{
					var val = $('#notes_modal_'+str).val();
					if(val !== '') notes.add(str, val);
				});
				notes.setDetails(
					$('#notes_modal_chord_sel').val(), 
					$('#notes_modal_type_sel').val(), 
					$('#notes_modal_version').val()
				);
			}else{
				str_names.forEach(str=>{
					var fret1 = $("#notes_modal_transition_start_"+str).val();
					var fret2 = $("#notes_modal_transition_end_"+str).val();
					var trans = $("#notes_modal_transition_"+str).val();
					if(fret1 !== '' && fret2 !== '') notes.add(str, fret1, fret2, trans);
					else if(fret1 !== '') notes.add(str, fret1);
				});
			}
			$("#notes_modal").modal('hide');
			done(notes);
		});
	});	
}

class MeasureGroup{
	constructor(){
		this.id = 0;
		this.measures = [];
	}
	fromID(measureid){
		for(var i=0, l=this.measures.length; i<l; i++){
			if(this.measures[i].id === measureid){
				return this.measures[i];
			}
		}
	}
	deleteById(measureid){
		var idx = null;
		for(var i=0, l=this.measures.length; i<l; i++){
			if(this.measures[i].id === measureid){
				idx = i;
				break;
			}
		}
		if(idx === null) return;
		this.measures[idx].$div.remove();
		this.measures.splice(idx, 1);
	}
	new(parent){
		this.measures.push(new Measure(parent, this.id));
		this.id++;
	}
	isEmpty(){
		return !this.measures.length;
	}
	getSong(){
		var song = new Song();
		this.measures.forEach(measure=>{
			var sounds = measure.notes.map(notes=>notes.getSound());
			song.addSounds(sounds);
		});
		return song;
	}
	dupeByID(measureid){
		var idx = null;
		for(var i=0, l=this.measures.length; i<l; i++){
			if(this.measures[i].id === measureid){
				idx = i;
				break;
			}
		}
		if(idx === null) return;
		var notes = this.measures[idx].notes.map(n=>n.clone());
		var dupe = new Measure(false, this.id); this.id++;
		dupe.notes = notes;
		dupe.$div.insertBefore(this.measures[idx].$div);
		this.measures.splice(idx, 0, dupe);
		dupe.draw();
	}
}

class Measure{
	constructor(parent, id){
		this.notes = [];
		this.id = id;
		this.$div = $("<div class='measure measure-"+id+"' data-id='"+id+"'>");
		if(parent) this.$div.appendTo(parent);
		this.clear();
	}
	clear(){
		this.notes = [];
		for(var i=16; i--;) this.notes.push(new NoteGroup());
		this.draw();
	}
	draw(){
		var str_names = ["E","B","G","D","A","e"];
		var $str_divs = [$("<div>"),$("<div>"),$("<div>"),$("<div>"),$("<div>"),$("<div>"),$("<div>"),$("<div>")];
		$str_divs[7].append(`<center>
			<button class='btn btn-xs delete-measure'><span class='glyphicon glyphicon-trash'></span> Delete</button>
			<button class='btn btn-xs clear-measure'><span class='glyphicon glyphicon-refresh'></span> Clear</button>
			<button class='btn btn-xs dupe-measure'><span class='glyphicon glyphicon-flash'></span> Duplicate</button>
		</center>`);
		this.notes.forEach(notes=>{
			let col = $str_divs[0].children().length;
			
			var sound_names = str_names.map(strname=>notes.getFretDisplayOnString(strname));
			var min_len = sound_names.reduce((acc, val)=>Math.max(acc, val.length), 2);
			sound_names.forEach((disp, i)=>{
				$str_divs[i+1].append(`<span class="measure-col measure-col-${col}" data-col=${col}>${disp.padStart(min_len,'-')}</span>`);
			});
			
			let chord_name = (notes.chord_name  || "_").toString();
			$str_divs[0].append(`<span class="measure-col measure-col-${col}" data-col=${col}>${chord_name.padStart(min_len,'_')}</span>`);
		});
		this.$div.empty();
		for(let i=0, l=$str_divs.length; i<l; i++){
			this.$div.append($str_divs[i]);
		}
	}
	getRawTabs(){
		var lines = [];
		this.$div.find('div').each(function(i){
			if(i === 0 || i > 6) return;
			lines.push(this.innerText);
		});
		return lines.join("\n");
	}
}