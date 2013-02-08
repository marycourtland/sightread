function Voice() {
  // This is a simple container, used in multiple ways.
  // TODO: redesign the 'voice' functionality.
    this.chords = [];
    this.beams = [];
    this.ties = [];
    this.slurs = [];
    this.staff = 0;
    
    this.addChord = function(n) {
      this.chords.push(n);
      // TODO: differentiate between different staves
    };
    this.findBeamIndices = function() {
      for (var i=0; i<this.chords.length; i++) {
        var n = this.chords[i];
        if (n.beam) {
          if (n.beam == 'begin') {
            this.beams.push([i]);
          }
          else if (n.beam == 'continue' && this.beams.length > 0) {
            this.beams[this.beams.length - 1].push(i);
          }
          else if (n.beam == 'end' && this.beams.length > 0) {
            this.beams[this.beams.length - 1].push(i);
          }
        }
      }
      return this.beams
    };
    this.findTieIndices = function() {
      starts = [];
      stops = [];
      for (var i=0; i < this.chords.length; i++) {
        var n = this.chords[i];
        for (j in n.tie.start) starts.push([i, j]);
        for (j in n.tie.stop) stops.push([i, j]);
      }
      for (var i=0; i<Math.min(starts.length, stops.length); i++) {
        this.ties.push([starts[i], stops[i]]);
      }
      return this.ties
    };
    this.findSlurIndices = function() {
      starts = [];
      stops = [];
      for (var i=0; i < this.chords.length; i++) {
        var n = this.chords[i];
        for (j in n.slur.start) starts.push([i, j]);
        for (j in n.slur.stop) stops.push([i, j]);
      }
      for (var i=0; i<Math.min(starts.length, stops.length); i++) {
        this.slurs.push([starts[i], stops[i]]);
      }
      return this.slurs
    };
}
