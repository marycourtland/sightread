// VexFlow - Music Engraving for HTML5
// Copyright Mohit Muthanna 2010
//
// Mary 12/18/2012
// - copied stavetie.js
// - tweaked for slurs (e.g. turned quadratic curves into bezier curves



/**
 * Create a new slur from the specified notes. The notes must
 * be part of the same line, and have the same duration (in ticks).
 *
 * @constructor
 * @param {!Object} context The canvas context.
 * @param {!Object} notes The notes to slur.
 * @param {!Object} Options
 */
Vex.Flow.StaveSlur = function(notes, text) {
  if (arguments.length > 0) this.init(notes, text);
}

Vex.Flow.StaveSlur.prototype.init = function(notes, text) {
  /**
   * Notes is a struct that has:
   *
   *  {
   *    first_note: Note,
   *    last_note: Note,
   *    first_indices: [n1, n2, n3],
   *    last_indices: [n1, n2, n3]
   *  }
   *
   **/

  this.notes = notes;
  this.context = null;
  this.text = text;

  this.render_options = {
      // Control points
      cp1y: 12,
      cp1x: 0.2, // Percentage offset from first note
      cp2y: 15,
      cp2x: -0.2, // Percentage offset from last note
      text_shift_x: 0,
      first_x_shift: 0,
      last_x_shift: 0,
      y_shift: 7,
      slur_spacing: 0,
      font: { family: "Arial", size: 10, style: "" }
    };

  this.font = this.render_options.font;
  this.setNotes(notes);
}

Vex.Flow.StaveSlur.prototype.setContext = function(context) {
  this.context = context;
  return this; }
Vex.Flow.StaveSlur.prototype.setFont = function(font) {
  this.font = font; return this; }

/**
 * Set the notes to attach this slur to.
 *
 * @param {!Object} notes The notes to slur.
 */
Vex.Flow.StaveSlur.prototype.setNotes = function(notes) {
  if (!notes.first_note && !notes.last_note)
    throw new Vex.RuntimeError("BadArguments",
        "Slur needs to have either first_note or last_note set.");

  if (!notes.first_indices) notes.first_indices = [0];
  if (!notes.last_indices) notes.last_indices = [0];

  if (notes.first_indices.length != notes.last_indices.length)
    throw new Vex.RuntimeError("BadArguments", "Slurred notes must have similar" +
      " index sizes");

  // Success. Lets grab 'em notes.
  this.first_note = notes.first_note;
  this.first_indices = notes.first_indices;
  this.last_note = notes.last_note;
  this.last_indices = notes.last_indices;
  return this;
}

/**
 * @return {boolean} Returns true if this is a partial bar.
 */
Vex.Flow.StaveSlur.prototype.isPartial = function() {
  return (!this.first_note || !this.last_note);
}

Vex.Flow.StaveSlur.prototype.renderSlur = function(params) {
  if (params.first_ys.length == 0 || params.last_ys.length == 0)
    throw new Vex.RERR("BadArguments", "No Y-values to render");

  var ctx = this.context;
  var cp1y = this.render_options.cp1y;
  var cp2y = this.render_options.cp2y;
  var cp1x = this.render_options.cp1x;
  var cp2x = this.render_options.cp2x;

  if (Math.abs(params.last_x_px - params.first_x_px) < 10) {
    cp1y = 2; cp2y = 8;
  }

  var first_x_shift = this.render_options.first_x_shift;
  var last_x_shift = this.render_options.last_x_shift;
  var y_shift = this.render_options.y_shift * params.direction;

  for (var i = 0; i < this.first_indices.length; ++i) {
    var first_y_px = params.first_ys[this.first_indices[i]] + y_shift;
    var last_y_px = params.last_ys[this.last_indices[i]] + y_shift;
    
    var dist = Math.sqrt(Math.pow((last_y_px - first_y_px), 2), Math.pow((last_y_px - first_y_px), 2));
    
    cp1x = (params.first_x_px + first_x_shift) + 0.2*dist;
    cp2x = (params.last_x_px + last_x_shift) - 0.2*dist;
    
    /*var cp_x = ((params.last_x_px + last_x_shift) +
                (params.first_x_px + first_x_shift)) / 2;*/
    var first_y_px = params.first_ys[this.first_indices[i]] + y_shift;
    var last_y_px = params.last_ys[this.last_indices[i]] + y_shift;

    
    if (isNaN(first_y_px) || isNaN(last_y_px))
      throw new Vex.RERR("BadArguments", "Bad indices for slur rendering.");

    var top_cp_y = ((first_y_px + last_y_px) / 2) + (cp1y * params.direction);
    var bottom_cp_y = ((first_y_px + last_y_px) / 2) + (cp2y * params.direction);

    ctx.beginPath();

    ctx.moveTo(params.first_x_px + first_x_shift, first_y_px);
    /*
    
    ctx.quadraticCurveTo(middle, top_cp_y,
                         params.last_x_px + last_x_shift, last_y_px);
    ctx.quadraticCurveTo(middle, bottom_cp_y,
                         params.first_x_px + first_x_shift, first_y_px);*/
      
    /*      
    console.log("Bezier controls:");
    console.log(cp1x, top_cp_y);
    console.log(cp2x, top_cp_y);
    console.log(dist);
    */
    
    ctx.bezierCurveTo(cp1x, top_cp_y,
                      cp2x, top_cp_y,
                      params.last_x_px + last_x_shift, last_y_px);
    ctx.bezierCurveTo(cp2x, bottom_cp_y,
                      cp1x, bottom_cp_y,
                      params.first_x_px + first_x_shift, first_y_px);
    
    ctx.closePath();
    ctx.fill();
  }
}

Vex.Flow.StaveSlur.prototype.renderText = function(first_x_px, last_x_px) {
  if (!this.text) return;
  var center_x = (first_x_px + last_x_px) / 2;
  center_x -= this.context.measureText(this.text).width / 2;
  
  this.context.save();
  this.context.setFont(this.font.family, this.font.size, this.font.style);
  this.context.fillText(
      this.text, center_x + this.render_options.text_shift_x,
      (this.first_note || this.last_note).getStave().getYForTopText() - 1);
  this.context.restore();
}

Vex.Flow.StaveSlur.prototype.draw = function() {
  if (!this.context)
    throw new Vex.RERR("NoContext", "No context to render slur.");
  var first_note = this.first_note;
  var last_note = this.last_note;
  var first_x_px, last_x_px, first_ys, last_ys, stem_direction;

  if (first_note) {
    first_x_px = first_note.getTieRightX() + this.render_options.slur_spacing;
    stem_direction = first_note.getStemDirection();
    first_ys = first_note.getYs();
  } else {
    first_x_px = last_note.getStave().getTieStartX();
    first_ys = last_note.getYs();
    this.first_indices = this.last_indices;
  };

  if (last_note) {
    last_x_px = last_note.getTieLeftX() + this.render_options.slur_spacing;
    stem_direction = last_note.getStemDirection();
    last_ys = last_note.getYs();
  } else {
    last_x_px = first_note.getStave().getTieEndX();
    last_ys = first_note.getYs();
    this.last_indices = this.first_indices;
  }

  this.renderSlur({
    first_x_px: first_x_px,
    last_x_px: last_x_px,
    first_ys: first_ys,
    last_ys: last_ys,
    direction: stem_direction
  });

  this.renderText(first_x_px, last_x_px);
  return true;
}
