/* Todo:
  - in initFromXML, detect any changes in key signature, time signature, staves, etc
  - in initFromXML (backward tag), check if the previous voice ended too early in the
    measure. If so, add a rest to the end of the voice.
*/

function Measure(divisions, staves) {
    this.xml_source = null;
    this.num = null;
    this.divisions = divisions; //rhythmic divisions in xml
    this.staves = staves;
    this.voices = [];
    this.display = {
      width: default_measure_width,
      staff_distance: default_staff_distance
    },
    
    
    // Create this measure from xml
    this.initFromXML = function(src) {
      console.log("\nINIT NEW MEASURE ------");
      this.xml_source = src;
      
      // Measure number
      if (this.xml_source.hasAttribute("number")) {
        this.num = this.xml_source.getAttribute("number");
      }
      
      // Display properties
      if (this.xml_source.hasAttribute("width")) {
        //this.display.width = Math.round(Number(this.xml_source.getAttribute("width")))
      }
      
      // Rhythmic divisions
      if (xmlutil.hasTag(this.xml_source, "divisions")) this.divisions = xmlutil.getTagNumberContent(this.xml_source, "divisions");
      
      // Get notes; organize them into chords & voices
      var current_voice = new Voice();
      var current_chord = new Chord();
      var time_counter = 0;
      var voices = this.voices;
      
      // NOTE: this does not reset time_counter.
      function pushCurrentVoice() {
        // Only follow through with this if it's not a newly-created voice.
        if (current_voice.chords.length == 0) return;
        voices.push(current_voice);
        current_voice = new Voice();
      }
      function pushCurrentChord() {
        time_counter = 0; // measured in divisions
        // Only follow through with this if it's not a newly-created chord.
        if (current_chord.pitch.length == 0) return;
        current_voice.addChord(current_chord);
        time_counter += computeDuration(current_chord.duration, this.divisions);
        current_chord = new Chord();
      }
      
      var e = this.xml_source.firstElementChild;
      while (e) {
        if (e.tagName == 'attributes') {
        }
        else if (e.tagName == 'note') {
          // If the next note isn't part of a chord w/ the previous note, then create a new chord.
          if (!xmlutil.hasTag(e, 'chord')) pushCurrentChord();
          // Add the next note.
          current_chord.addNoteFromXML(e, this.divisions);
          console.log("Note/chord at " + time_counter + ". Pitches:", current_chord.pitch);
        }
        else if (e.tagName == 'forward') {
          // Turn the 'forward' tag into a rest
          console.log("doing a forward");
          pushCurrentChord();
          var duration = computeDuration(xmlutil.getTagNumberContent(e, "duration"), this.divisions);
          current_chord = new Chord().initAsRest(duration);
          pushCurrentChord();
        }
        else if (e.tagName == 'backup') {
          console.log("doing a backup from ", time_counter);
          // Assume that the backup tag signals a new voice.
          pushCurrentChord();
          pushCurrentVoice();
          // Reset time counter
          time_counter -= xmlutil.getTagNumberContent(e, "duration");
          if (time_counter < 0) {
            console.log("Warning: a <backup> tag in the musicXML backed up to a negative number. Fast-forwarding it to 0.");
            time_counter = 0;
          }
          // Add rests to the beginning of the new voice, if necessary
          if (time_counter != 0 && !isNaN(time_counter)) {
            var duration = computeDuration(xmlutil.getTagNumberContent(e, "duration"), this.divisions);
            current_chord = new Chord().initAsRest(duration);
            current_chord.visible = false;
            pushCurrentChord();
          }
        }
        else if (e.tagName == 'barline') {
        }
        
        if (e.isSameNode(this.xml_source.lastElementChild)) e = null;
        else  e = e.nextElementSibling;
      }
      pushCurrentChord();
      pushCurrentVoice();
      
      for (v in this.voices) {
        this.voices[v].findBeamIndices();
        this.voices[v].findTieIndices();
        this.voices[v].findSlurIndices();
      }
      
      return this;
    },
    
    // Creates and returns the VexFlow objects for this measure.
    this.vex = function(x, y) {
      //console.log("\nGETTING VEX FOR NEW MEASURE -----------------");
      // Create stave objects
      var vex_staves = [];
      for (var i=0; i<this.staves; i++) {
        vex_staves.push(new Vex.Flow.Stave(x, y, this.display.width));
        y += this.display.staff_distance;
      }
      
      // TODO: adjust width if needed
      // TODO: draw barlines, braces, repeats, etc.
      // TODO: clefs, keysigs, timesigs
      
      // Create note objects (which are collected into voices)
      var vex_voices = [];
      for (var v=0; v<this.voices.length; v++) {
        vex_voice = new Voice();
        // FOR NOW, assume that the first note of each voice determines the voice's staff.
        // TODO: when redesigning voices, allow multi-staff voices.
        if (this.voices[v].chords.length > 0) {
          vex_voice.staff =  this.voices[v].chords[0].staff;
        }
        // create Vex note objects
        for (var n=0; n<this.voices[v].chords.length; n++) {
          note = this.voices[v].chords[n];
          vex_voice.addChord(note.vex());
        }
        // create Vex beam objects
        for (var b=0; b<this.voices[v].beams.length; b++) {
          beamed_vex_notes = [];
          for (var i=0; i<this.voices[v].beams[b].length; i++) {
            beamed_vex_notes.push(vex_voice.chords[this.voices[v].beams[b][i]]);
          }
          vex_voice.beams.push(new Vex.Flow.Beam(beamed_vex_notes));
        }
        // create Vex objects for ties
        for (t in this.voices[v].ties) {
          tied_vex_notes = [];
          start = this.voices[v].ties[t][0];
          stop = this.voices[v].ties[t][1];
          tie = new Vex.Flow.StaveTie({
            first_note: vex_voice.chords[start[0]],
            last_note: vex_voice.chords[stop[0]],
            first_indices: [start[1]],
            last_indices: [stop[1]],
          });
          tie.render_options.cp1 += 3;
          //console.log("Tie renderoptions:");
          //console.log(tie.render_options);
          vex_voice.ties.push(tie);
        }
        // create Vex objects for slurs
        for (t in this.voices[v].slurs) {
          slurred_vex_notes = [];
          start = this.voices[v].slurs[t][0];
          stop = this.voices[v].slurs[t][1];
          slur = new Vex.Flow.StaveSlur({
            first_note: vex_voice.chords[start[0]],
            last_note: vex_voice.chords[stop[0]],
            first_indices: [start[1]],
            last_indices: [stop[1]],
          });
          if (slur) {
            slur.render_options.cp1 += 2;
            slur.render_options.cp1 += 15;
            slur.render_options.cp2 += 15;
            //console.log("Slur renderoptions:");
            //console.log(slur.render_options);
          }
          vex_voice.slurs.push(slur);
        }
        
        vex_voices.push(vex_voice);
      }
      
      return {staves:vex_staves, voices:vex_voices}
      
      
    }

}
