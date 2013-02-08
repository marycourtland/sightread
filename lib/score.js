/* Todo:
  - detect clefs in XML
  - handle XML with more than one part
*/


function Score() {
  // For now, this is intended to be for a single part.
  this.xml_source = null;
  this.key = "C";
  this.time = "4/4";
  this.staves = 0;
  this.measures = [];
  this.display = {};
  
  // Create the score from a MusicXML file
  this.initFromXML = function(src) {
    this.xml_source = src;
    
    // Determine the number of parts
    var num_parts = src.length;
    var part0 = src[0];
    
    // Extract key signature
    this.key = keys[xmlutil.getTagContent(part0, "fifths")];
    
    // Extract time signature
    this.time = xmlutil.getTagContent(part0, "beats") + "/" + xmlutil.getTagContent(part0, "beat-type");
    
    for (var p=0; p < num_parts; p++) {
      // Add the appropriate number of staves for each part
      var staves = xmlutil.getTagNumberContent(part0, "staves");
      this.staves += (staves != 0? staves : 1);
      
      // Measures
      var measures = part0.getElementsByTagName("measure");
      var divisions = 1; // rhythmic divisions
      for (var i=0; i < measures.length; i++) {
        var m = new Measure(divisions, this.staves);
        m.initFromXML(measures[i]);
        
        // Create measures from the first part
        if (p == 0) this.measures.push(m);
        
        // For the other parts, combine them with the previously created measures
        else if (src.hasAttribute("number")) {
          var num = src.getAttribute("number");
          for (var j=0; j < this.measures.length; j++) {
            if (this.measures[j].num == num) {
              for (var v=0; v < this.measures[j].voices.length; v++) {
                m.voices.push(this.measures[j].voices[v]);
              }
              this.measures[j] = m;
              break;
            }
          }
        }
        
        divisions = m.divisions;
        default_staff_distance = m.display.staff_distance;
      }
    }
    this.measure_order = range(this.measures.length);
    
    return this;
  }
  
  this.shuffleMeasures = function() {
    
  };
  
  this.resetMeasureOrder = function() {
  };
  
  // Create VexFlow objects for everything in this score, and draw them
  this.draw = function(ctx) {
    var x = x_margin;
    var y = y_margin;
    var last_measure_width = 0;
    var last_staff_distance = 0;
    var page = 0;
    
    for (var i = 0; i < this.measures.length; i++) {
      // Determine which measure to draw next
      if (i > this.measure_order.length) break;
      var m = this.measure_order[i];
      
      first_measure = (i == 0);
      begin_line = (i == 0);
      
      // Determine measure placement
      if (!first_measure) { x += last_measure_width; }
      if (x + this.measures[m].display.width > ((page + 1) * ctx.canvas.width - x_margin)) {
        // First measure of each line
        x = page * page_width + x_margin;
        y += default_line_spacing;
        for (var s=0; s < vex_measure.staves.length-1; s++) {
          y += last_staff_distance;
        }
        // Check whether a new page is necessary
        if (y + last_staff_distance > page_height) {
          page++;
          x += page_width; 
          y = y_margin;
        }
        begin_line = true;
        // TODO: add extra width if necessary
        // TODO: put ending barline on previous measure
      }
      
      // Measure labels (for testing purposes)
      //ctx.fillText(m.toString(), 10, y+65);
      
      // Create the vex objects in each measure.
      var vex_measure = this.measures[m].vex(x, y);
      
      // Staves.
      // TODO: move appropriate code to the measure's vex() function.
      // (The staves should be ready-to-draw when coming out of that function.)
      for (var s=0; s<vex_measure.staves.length; s++) {
        
        // Clefs
        if (begin_line) {
          if (s == 0) { // Place a treble clef on the first staff
            vex_measure.staves[s].addClef("treble");
          }
          else if (s == 1) { // Place a bass clef on the second staff
            vex_measure.staves[s].addClef("bass");
          }
        }
        // TODO: handle non-standard clefs/staves
        
        // Key signature
        if (begin_line && this.key) { vex_measure.staves[s].addKeySignature(this.key); }
        // Time signature
        if (first_measure && this.time) { vex_measure.staves[s].addTimeSignature(this.time); }
        
        // TODO: handle new keysigs or timesigs in the middle of the music
        
        // Draw staff
        vex_measure.staves[s].setContext(ctx).draw();
        
      }
      
      // Barlines and braces for multi-staff systems
      if (vex_measure.staves.length > 1) {
        if (!first_measure) {
          var stave1_previous = stave1;
          var stave2_previous = stave2;
        }
        var stave1 = vex_measure.staves[0];
        var stave2 = vex_measure.staves[vex_measure.staves.length - 1]
        
        // By default, draw a barline on the left of the measure
        var barline = new Vex.Flow.StaveConnector(stave1, stave2);
        barline.setType(Vex.Flow.StaveConnector.type.SINGLE);
        barline.setContext(ctx).draw();
        
        // Brace on the first measure of each line
        if (begin_line) {
          var system_brace = new Vex.Flow.StaveConnector(stave1, stave2);
          system_brace.setType(Vex.Flow.StaveConnector.type.BRACE);
          system_brace.setContext(ctx).draw();
        }
        
        // Right-hand barline on the last measure of each line
        if (begin_line && !first_measure) {
          var barline = new Vex.Flow.StaveConnector(stave1_previous, stave2_previous);
          barline.setType(Vex.Flow.StaveConnector.type.SINGLE);
          barline.setSide(Vex.Flow.StaveConnector.side.RIGHT);
          barline.setContext(ctx).draw();
        }
      }
      
      // Voices (w/ notes)
      for (var v=0; v < vex_measure.voices.length; v++) {
        Vex.Flow.Formatter.FormatAndDraw(ctx, vex_measure.staves[vex_measure.voices[v].staff], vex_measure.voices[v].chords);
        
        for (var b=0; b < vex_measure.voices[v].beams.length; b++) {
          vex_measure.voices[v].beams[b].setContext(ctx).draw();
        }
        
        for (var t=0; t < vex_measure.voices[v].ties.length; t++) {
          vex_measure.voices[v].ties[t].setContext(ctx).draw();
        }
        
        for (var s=0; s < vex_measure.voices[v].slurs.length; s++) {
          vex_measure.voices[v].slurs[s].setContext(ctx).draw();
        }
      }
      
      last_measure_width = this.measures[m].display.width;
      last_staff_distance = this.measures[m].display.staff_distance;
    }
    
    // Include a double barline on the very last measure
    // TODO: Read barlines given by the measure's XML
    if (vex_measure.staves.length > 1) {
      var barline = new Vex.Flow.StaveConnector(stave1, stave2);
      barline.setType(Vex.Flow.StaveConnector.type.END);
      barline.setSide(Vex.Flow.StaveConnector.side.RIGHT);
      barline.setContext(ctx).draw();
    }
  }
}


