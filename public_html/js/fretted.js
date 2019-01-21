
const Fretted = (function(){
	
	class FB{
		constructor(options){
			options=options||{};
			this.orientation=options.orientation || 'H';
			this.frets=options.frets || 24;
			this.strings=options.strings || 6;
			this.singleFretMarkers = options.singleFretMarkers && options.singleFretMarkers.length ? options.singleFretMarkers : [3,5,7,9,15,17,19,21];
			this.doubleFretMarkers = options.doubleFretMarkers && options.doubleFretMarkers.length ? options.doubleFretMarkers : [12,24];
			this.canvas = document.createElement("canvas");
			this.canvasWidth = ((this.frets*40)+35);
			this.canvasHeight = (this.strings*30);
			this.canvas.setAttribute("width", this.canvasWidth+"px");
			this.canvas.setAttribute("height", this.canvasHeight+"px");
			this.ctx=this.canvas.getContext("2d");
			this.drawFretboard();
			this.labels=[];
		}
		muteString(string){
			this.labels.push({symbol:"X", string:string});
		}
		openString(string, symbol="O"){
			this.labels.push({symbol:symbol, string:string});
		}
		drawFretMarkers(){
			const drawMarker = (x, y)=>{
				this.ctx.beginPath();
				this.ctx.arc(x, y, 6, 0, 2 * Math.PI, false);
				this.ctx.fill();
				this.ctx.stroke();
			};
			var y = this.canvasHeight/2, x, i;
			for(i=0; i<this.singleFretMarkers.length; i++){
				x=40+((this.singleFretMarkers[i]-1)*40);
				drawMarker(x, y);
			}
			var y1 = this.canvasHeight/3, y2=this.canvasHeight-y1;
			for(i=0; i<this.doubleFretMarkers.length; i++){
				x=40+((this.doubleFretMarkers[i]-1)*40);
				drawMarker(x, y1);
				drawMarker(x, y2);
			}
		}
		drawFretboard(){
			var leftborder = (this.frets*40)+20; //980
			var bottomborder = ((this.strings-1)*30)+15; //165
			this.ctx.beginPath();
			this.ctx.moveTo(15,15);
			this.ctx.lineTo(leftborder,15); 
			this.ctx.moveTo(15,bottomborder);
			this.ctx.lineTo(leftborder,bottomborder); 
			this.ctx.moveTo(15,15);
			this.ctx.lineTo(15,bottomborder);
			for(var fretY=20; fretY<=leftborder; fretY+=40){
				this.ctx.moveTo(fretY,15);
				this.ctx.lineTo(fretY,bottomborder);
			} 
			for(var stringPos=45; stringPos<30*(this.strings-1); stringPos+=30){
				this.ctx.moveTo(20,stringPos);
				this.ctx.lineTo(leftborder,stringPos);
			}
			this.ctx.stroke();
			this.drawFretMarkers();
		}
		markNote(note, fret, string, circleColor="#FF0000", textColor="#000000"){
			if(string>this.strings||fret>this.frets) return false;
			var centerX = 40*fret;
			var centerY = ((string-1)*30)+15;
			this.ctx.fillStyle=circleColor;
			this.ctx.strokeStyle=circleColor;
			this.ctx.beginPath();
			this.ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI, false);
			this.ctx.fill();
			this.ctx.stroke();
			this.ctx.fillStyle = textColor;
			this.ctx.font = 'bold 14px Courier';
			this.ctx.textBaseline = 'middle'; 
			this.ctx.textAlign = 'center'; 
			if(note!==undefined){
				if(this.orientation=='H'){
					this.ctx.fillText(note, centerX, centerY);
				}else{
					this.ctx.save();
					this.ctx.translate(centerX, centerY);
					this.ctx.rotate(-Math.PI/2);
					this.ctx.fillText(note, 0, 0);
					this.ctx.restore();
				}
			}
		}
		getDataURI(first=1, frets){
			if(!frets) frets = this.frets;
			return new Promise(done=>{
				this.getCanvas(first, frets).then(canvas=>done(canvas.toDataURL()));
			});
		}
		cropFretboard(first=1, frets){
			if(!frets) frets = this.frets;
			return new Promise(done=>{
				if(first >= this.frets) return done(false);
				var startx = first==1?15:20+(40*(first-1));
				var endx = frets==this.frets?(this.frets*40)+20:startx+(40*(frets));
				var width = endx-startx;
				if(first==1) width+=5;
				var canvas = document.createElement("canvas");
				canvas.setAttribute("width", width+"px");
				canvas.setAttribute("height", this.canvasHeight+'px');
				var img = new Image();
				img.onload = ()=>{
					var ctx=canvas.getContext("2d");
					ctx.drawImage(img, -startx, 0);
					var img2 = new Image();
					img2.onload=()=>{
						var canvas = document.createElement("canvas");
						canvas.setAttribute("width", (width+30)+"px");
						canvas.setAttribute("height", this.canvasHeight+'px');
						var ctx=canvas.getContext("2d");
						if(first !== 1){
							ctx.font = '14px Courier';
							ctx.textBaseline = 'middle'; 
							ctx.textAlign = 'center'; 
							ctx.fillStyle = "#000000";
							for(var x=22, lbl=parseInt(first); x+40<width+30; x+=40, lbl++){
								if(this.orientation=='H'){
									ctx.fillText(lbl,x,this.canvasHeight-7);
								}else{
									ctx.save();
									ctx.translate(x,this.canvasHeight-7);
									ctx.rotate(-Math.PI/2);
									ctx.fillText(lbl, 0, 0);
									ctx.restore();
								}
							}
						}
						ctx.drawImage(img2, 15, 0);
						done(canvas);
					};				
					img2.src = canvas.toDataURL();
				};
				img.src=this.canvas.toDataURL();
			});
		}
		labelStrings(canvas){
			var ctx=canvas.getContext("2d");
			ctx.font = 'bold 14px Courier';
			ctx.textBaseline = 'middle'; 
			ctx.textAlign = 'center'; 
			for(var i=0; i<this.labels.length; i++){
				var y = ((this.labels[i].string-1)*30)+15;
				if(this.orientation=='H'){
					ctx.fillText(this.labels[i].symbol,10,y);
				}else{
					ctx.save();
					ctx.translate(10,y);
					ctx.rotate(-Math.PI/2);
					ctx.fillText(this.labels[i].symbol, 0, 0);
					ctx.restore();
				}
			}
			return canvas;
		}
		getCanvas(first=1, frets){
			if(!frets) frets = this.frets;
			var p = first==1 && frets==this.frets ? 
				()=>new Promise(done=>done(this.canvas)): 
				()=>this.cropFretboard(first, frets);
			return new Promise(done=>{
				p().then(canvas=>{
					canvas = this.labelStrings(canvas);
					var datauri = canvas.toDataURL();
					var h = canvas.getAttribute("height");
					var w = canvas.getAttribute("width");
					var canvas = document.createElement("canvas");
					if(this.orientation=='H'){
						canvas.setAttribute("width", w);
						canvas.setAttribute("height", h);
					}else{
						canvas.setAttribute("width", h);
						canvas.setAttribute("height", w);
					}
					var ctx=canvas.getContext("2d");
					var img = new Image();
					img.onload = ()=>{
						if(this.orientation=='H'){
							ctx.drawImage(img, 0, 0);
						}else{
							ctx.save();
							ctx.translate(this.canvasHeight/2, this.canvasWidth/2);
							ctx.rotate(90 * (Math.PI / 180));
							ctx.drawImage(img, -(this.canvasWidth/2),-(this.canvasHeight/2));
							ctx.restore();
						}
						done(canvas);
					};
					img.src = datauri;
				});
			});
		}
	}
	
	class String{
		constructor(){
			this.fret=0;
			this.muted=false;
			this.note=false;
			this.bgColor="#FF0000";
			this.textColor="#000000";
		}
		setFret(fret){this.fret=fret; return this;}
		mute(){this.muted=true; return this;}
		setNote(note){this.note=note; return this;}
		setBGColor(color){this.bgColor=color; return this;}
		setTextColor(color){this.textColor=color; return this;}
	}
	
	class Scale{
		constructor(){
			this.noteColor="#FF0000";
			this.noteTextColor="#000000";
			this.rootNoteColor="#FF0000";
			this.rootTextColor="#000000";
			this.root="C";
			this.notes=['C','D','E','F','G','A','B'];
		}
		setNotes(notes){
			var n=[], nn;
			for(var i=0; i<notes.length; i++){
				nn = Scale.normalizeNote(notes[i]);
				if(!nn) throw new Error("Invlid note in scale.");
				n.push(nn);
			}
			this.notes=n;
			return this;
		}
		setRootNote(note){
			note = Scale.normalizeNote(note);
			if(!note) throw new Error("Invlid root note.");
			this.root=note;
			return this;
		}
		setNoteStyle(bgColor="#FF0000", textColor="#000000"){
			this.noteColor=bgColor;
			this.noteTextColor=textColor;
			return this;
		}
		setRootNoteStyle(bgColor="#FF0000", textColor="#000000"){
			this.rootNoteColor=bgColor;
			this.rootTextColor=textColor;
			return this;
		}
	}
	Scale.noteMap = ['C','C#/Db','D','D#/Eb','E','F','F#/Gb','G','G#/Ab','A','A#/Bb','B'];
	Scale.normalizeNote = function(note){
		for(var i=0; i<Scale.noteMap.length; i++) if(note.toUpperCase() == Scale.noteMap[i]) return Scale.noteMap[i];
		for(var i=0; i<Scale.noteMap.length; i++) if(~Scale.noteMap[i].toUpperCase().indexOf(note.toUpperCase())) return Scale.noteMap[i].split("/")[0];
		return false;
	};
	Scale.getNextNote = function(note){
		var idx=false;
		for(var i=0; i<Scale.noteMap.length; i++) if(note.toUpperCase() == Scale.noteMap[i]){ idx=i; break; }
		if(false===idx) for(var i=0; i<Scale.noteMap.length; i++) if(~Scale.noteMap[i].toUpperCase().indexOf(note.toUpperCase())){ idx=i; break; }
		if(false===idx) return false;
		idx++;
		if(idx==Scale.noteMap.length) idx=0;
		return Scale.normalizeNote(Scale.noteMap[idx]);
	};
	
	class FB_WRAPPER{
		constructor(opts){
			this.tuning=opts.tuning;
			this._orientation=undefined;
			this.range=undefined;
			this.fretboard = new FB(opts);
		}
		orientation(o='H'){
			this._orientation=o;
			this.fretboard.orientation = o;
			return this;
		}
		makeScale(scale){ // openString(string, symbol="O")
			var note, string, fret;
			for(string=1; string<=this.tuning.length; string++){
				if(!note) note=Scale.normalizeNote(this.tuning[string-1]);
				if(note === scale.root || ~scale.notes.indexOf(note)) this.fretboard.openString(string, note);
				for(fret=1; fret<=this.fretboard.frets; fret++){
					var n=note;
					note=Scale.getNextNote(note);
					if(note === scale.root) this.fretboard.markNote(note, fret, string, scale.rootNoteColor, scale.rootTextColor);
					else if(~scale.notes.indexOf(note)) this.fretboard.markNote(note, fret, string, scale.noteColor, scale.textColor);
				}
				note=false;
			}
			return this;
		}
		makeChord(strings){
			var lfret,hfret;
			if(!this._orientation) this.orientation('V');
			if(this.fretboard.strings !== strings.length) throw new Error("makeChord() requires an array the same length as the number of strings.");
			for(var i=0; i<strings.length; i++){
				if(undefined === strings[i].fret) throw new Error("Each object in the strings array must have a 'fret' property");
				if(!lfret||lfret>strings[i].fret&&strings[i].fret>0) lfret=strings[i].fret;
				if(!hfret||hfret<strings[i].fret) hfret=strings[i].fret;
				if(strings[i].fret==0){
					if(strings[i].muted) this.fretboard.muteString(i+1);
					else if(strings[i].muted && !strings[i].note) this.fretboard.openString(i+1, "O");
					else if(!strings[i].note) this.fretboard.openString(i+1, "O");
					else this.fretboard.openString(i+1, strings[i].note);
				}else{
					this.fretboard.markNote(strings[i].note||undefined, strings[i].fret, i+1, strings[i].bgColor||"#FF0000", strings[i].textColor||"#FF0000");
				}
			}
			if(lfret === 0) lfret = 1;
			while((hfret-lfret)+1<4&&lfret>1)lfret--;
			while((hfret-lfret)+1<4)hfret++;
			this.range=[lfret, hfret];
			return this;
		}
		render(type=1){
			var first = this.range ? this.range[0] : undefined;
			var frets = this.range ? this.range[1]-this.range[0]+1 : undefined;
			switch(type){
				case FB_WRAPPER.IMAGE:
					return new Promise(done=>{
						this.fretboard.getDataURI(first, frets).then(datauri=>{
							var img = new Image();
							img.onload = ()=>done(img);
							img.src=datauri;
						});
					});
				case FB_WRAPPER.CANVAS:
					return this.fretboard.getCanvas(first, frets);
				case FB_WRAPPER.DATAURI:
					return this.fretboard.getDataURI(first, frets);
				default:
					throw new Error("Invalid option for render()");
			}
		}
	}
	FB_WRAPPER.IMAGE=1;
	FB_WRAPPER.CANVAS=2;
	FB_WRAPPER.DATAURI=3;
	FB_WRAPPER.String = String;
	FB_WRAPPER.VERTICAL='V';
	FB_WRAPPER.HORIZONTAL='H';
	FB_WRAPPER.Scale = Scale;
	FB_WRAPPER.makeInstrument=function(opts){
		['name','frets','strings','tuning'].forEach(opt=>{
			if(!opts[opt]) throw new Error("Instrument must have "+opt+" property.");
		});
		opts.frets=parseInt(opts.frets);
		if(!opts.frets) throw new Error("Instrument frets property must be greater than zero.");
		opts.strings=parseInt(opts.strings);
		if(!opts.strings) throw new Error("Instrument strings property must be greater than zero.");
		if(!Array.isArray(opts.tuning)||opts.tuning.length!=opts.strings) throw new Error("Tuning must be an array containing one element for each string.");
		var o=[], note; 
		for(var i=0; i<opts.tuning.length; i++){
			note = Scale.normalizeNote(opts.tuning[i]);
			if(!note) throw new Error("Invalid note in tuning array.");
			o.push(note);
		}
		opts.tuning = o;
		if(typeof opts.name != "string") throw new Error("Instrument name must be a string.");
		if(!opts.doubleFretMarkers||!Array.isArray(opts.doubleFretMarkers)) opts.doubleFretMarkers = [];
		if(!opts.singleFretMarkers||!Array.isArray(opts.singleFretMarkers)) opts.singleFretMarkers = [];
		FB_WRAPPER[opts.name]=function(){
			return new FB_WRAPPER(opts);
		};
	};
	FB_WRAPPER.makeInstrument({
		name: 'Guitar',
		frets: 24,
		strings: 6,
		doubleFretMarkers: [12,24],
		singleFretMarkers: [3,5,7,9,15,17,19,21],
		tuning: ["E","B","G","D","A","E"]
	});
	FB_WRAPPER.makeInstrument({
		name: 'Ukulele',
		frets: 18,
		strings: 4,
		doubleFretMarkers: [12],
		singleFretMarkers: [5,7,10,14],
		tuning: ["A","E","C","G"]
	});
	
	return FB_WRAPPER;
})();

