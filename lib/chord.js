/* Todo:
  - Allow any clef on each staff. (For now, it's assumed that staff=0 means it's treble clef, and staff=1 means it's bass.)

*/

function Chord() {
    this.xml_source = null;
    this.visible = true;
    this.pitch = [];
    this.tie = {start:[], stop:[]};
    this.slur = {start:[], stop:[]};
    this.duration = null;
    this.stem = null;
    this.beam = null;
    this.clef = 'treble';
    this.voice = 0;
    this.staff = 0;
    this.rest_position = null;
    
    // Add a note to the chord
    this.addNoteFromXML = function(src, divisions) {
      if (this.pitch.length == 0) this.initFromXML(src, divisions);
      
      if (src.getElementsByTagName("pitch").length > 0) {
        this.pitch.push(xmlutil.getTagContent(src, "step") + "/" + xmlutil.getTagContent(src, "octave"));
        
        var p = this.pitch.length-1; // this denotes the pitch's location in the chord
        // Sharps, flats
        if (src.getElementsByTagName("alter").length > 0) {
          alter = xmlutil.getTagContent(src, "alter");
          if (alter == "1") {
            this.pitch[p] = this.pitch[p][0] + "#" + this.pitch[p].slice(1, 3);
          }
          else if (alter == "-1") {
            this.pitch[p] = this.pitch[p][0] + "b" + this.pitch[p].slice(1, 3);
          }
        }
        // Ties
        ties = src.getElementsByTagName("tie");
        for (var i=0; i < ties.length; i++) {
          if (!ties[i].hasAttribute("type")) { continue; /* TODO: if a note in the XML source has a tie w/out a type (start or end), show a warning*/}
          type = ties[i].getAttribute("type");
          if (type in this.tie) {
            this.tie[type].push(p);
          }
        }
        // Slurs (identical code as the ties portion)
        slurs = src.getElementsByTagName("slur");
        for (var i=0; i < slurs.length; i++) {
          if (!slurs[i].hasAttribute("type")) { continue; }
          type = slurs[i].getAttribute("type");
          if (type in this.slur) {
            this.slur[type].push(p);
          }
        }
      }
    };
    
    // Create this chord from xml
    this.initFromXML = function(src, divisions) {
      this.xml_source = src;
      
      // Staff
      this.staff = xmlutil.getTagNumberContent(this.xml_source, "staff") - 1;
      if (this.staff == 0)      this.clef = 'treble';
      else if (this.staff == 1) this.clef = 'bass';
      
      // Duration
      this.duration = computeDuration(xmlutil.getTagNumberContent(this.xml_source, "duration"), divisions);
      
      // Rests
      if (this.xml_source.getElementsByTagName("rest").length > 0) {
        this.pitch = "rest";
        if (this.xml_source.getElementsByTagName("display-step").length > 0) {
          var step = xmlutil.getTagContent(this.xml_source, "display-step");
          var octave = xmlutil.getTagContent(this.xml_source, "display-octave");
          this.rest_position = step + "/" + octave;
        }
        else {
          this.rest_position = rest_positions[this.clef];
        }
      }
      
      // Non-rests
      //this.addNoteFromXML(this.xml_source);
      
      // Voice
      if (this.xml_source.getElementsByTagName("voice").length > 0) {
        this.voice = xmlutil.getTagNumberContent(this.xml_source, "voice") - 1;
      }
      
      // Stem direction
      if (this.xml_source.getElementsByTagName("stem").length > 0) {
        this.stem = xmlutil.getTagContent(this.xml_source, "stem");
      }
      
      // Beam
      if (this.xml_source.getElementsByTagName("beam").length > 0) {
        if (this.xml_source.getElementsByTagName("beam")[0].getAttribute("number") == "1") { 
          this.beam = xmlutil.getTagContent(this.xml_source, "beam");
        }
      }
      
      // Slurs
      
      // Visibility
      if (this.xml_source.hasAttribute("print-object")) {
        this.visible = yesno[this.xml_source.getAttribute("print-object")];
      }
      return this;
    };
    
    this.initAsRest = function(duration) {
      this.pitch = "rest";
      this.duration = duration;
      return this;
    };
    
    // Create a VexFlow object for this note
    this.vex = function() {
      var note_struct = {keys: this.pitch,
                         duration: this.duration,
                         clef: this.clef,
                         visible: this.visible};
      
      if (this.pitch == "rest") {
        if (this.rest_position == null) {
          this.rest_position = rest_positions[this.clef];
        }
        note_struct.keys = [this.rest_position];
        note_struct.duration = this.duration + "r";
      }
      else if (!isArray(this.pitch)) {
        note_struct.keys = [this.pitch];
      }
      
      // TODO: clef
      
      note_struct["stem_direction"] = stem_dirs[this.stem];
      var vex_note = new Vex.Flow.StaveNote(note_struct);

      // Display dots on dotted notes
      if (this.duration.indexOf("d") != -1) {
        // TODO: if it's a dotted half rest in a 6/8 or 3/4 meter, or similar,
        // then don't add a dot and make it appear to be a whole rest.
        vex_note = vex_note.addDotToAll();
      }
      
      // Display accidentals
      if (this.pitch != "rest") {
        for (var i=0; i < this.pitch.length; i++) {
          if (this.pitch[i].indexOf("/")!=1) {
            var acc = this.pitch[i].slice(0, this.pitch[i].indexOf("/"));
            if (keysigs[score.key].indexOf(acc)==-1) {
              acc = acc.slice(1, acc.length);
              vex_note = vex_note.addAccidental(i, new Vex.Flow.Accidental(acc));
            }
          }
        }
      }
      
      return vex_note;
    };
}
