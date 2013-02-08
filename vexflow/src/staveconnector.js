// Vex Flow Notation
// Mohit Muthanna <mohit@muthanna.com>
//
// Copyright Mohit Muthanna 2010
//
// Requires vex.js.

// Mary notes, 10/25/2012
//   - Added an option to place the connector at the end of the staff:  connector.setSide(Vex.Flow.StaveConnector.side.RIGHT)
//   - Changed the DOUBLE type to actually be two lines (one thick, one thin)


/** @constructor */
Vex.Flow.StaveConnector = function(top_stave, bottom_stave) {
  this.init(top_stave, bottom_stave); }
Vex.Flow.StaveConnector.type = {
  SINGLE: 1,
  DOUBLE: 2,
  BRACE: 3,
  BRACKET: 4
};
Vex.Flow.StaveConnector.side = {
  LEFT: 0,
  RIGHT: 1  // To make braces and brackets look good when they're on the right side, the draw() function will just mirror them.
};

Vex.Flow.StaveConnector.prototype.init = function(top_stave, bottom_stave) {
  this.width = 3;
  this.top_stave = top_stave;
  this.bottom_stave = bottom_stave;
  this.type = Vex.Flow.StaveConnector.type.DOUBLE;
  this.side = Vex.Flow.StaveConnector.side.LEFT;
}

Vex.Flow.StaveConnector.prototype.setContext = function(ctx) {
  this.ctx = ctx;
  return this;
}

Vex.Flow.StaveConnector.prototype.setType = function(type) {
  if (type >= Vex.Flow.StaveConnector.type.SINGLE &&
      type <= Vex.Flow.StaveConnector.type.BRACKET)
    this.type = type;
  return this;
}

Vex.Flow.StaveConnector.prototype.setSide = function(side) {
  this.side = side;
  return this;
}

Vex.Flow.StaveConnector.prototype.draw = function() {
  if (!this.ctx) throw new Vex.RERR(
      "NoContext", "Can't draw without a context.");
  var topY = this.top_stave.getYForLine(0);
  var botY = this.bottom_stave.getYForLine(this.bottom_stave.getNumLines() - 1);
  var width = this.width;
  var topX = this.top_stave.getX();
  var attachment_height = botY - topY;
  
  // if applicable, flip the context
  // (this will be undone at the end of the function)
  var axis_translation = topX + this.top_stave.width/2;
  if (this.side == Vex.Flow.StaveConnector.side.RIGHT) {
    this.ctx.translate(axis_translation, 0);
    this.ctx.scale(-1, 1);
    this.ctx.translate(-axis_translation-1, 0);
  }
  
  switch (this.type) {
    case Vex.Flow.StaveConnector.type.SINGLE:
      width = 1;
      this.ctx.fillRect(topX, topY, width, attachment_height);
      break;
    case Vex.Flow.StaveConnector.type.DOUBLE:
      topX -= (this.width + 2);
      this.ctx.fillRect(topX + this.width, topY, width, attachment_height+1);
      this.ctx.fillRect(topX + this.width + 5, topY, 1, attachment_height+1);
      break;
    case Vex.Flow.StaveConnector.type.BRACE:
      width = 12;
      // May need additional code to draw brace
      var x1 = topX - 2;
      var y1 = topY;
      var x3 = x1;
      var y3 = botY;
      var x2 = x1 - width;
      var y2 = y1 + attachment_height/2.0;
      var cpx1 = x2 - (0.90 * width);
      var cpy1 = y1 + (0.2 * attachment_height);
      var cpx2 = x1 + (1.10 * width);
      var cpy2 = y2 - (0.135 * attachment_height);
      var cpx3 = cpx2;
      var cpy3 = y2 + (0.135 * attachment_height);
      var cpx4 = cpx1;
      var cpy4 = y3 - (0.2 * attachment_height);
      var cpx5 = x2 - width;
      var cpy5 = cpy4;
      var cpx6 = x1 + (0.40 * width);
      var cpy6 = y2 + (0.135 * attachment_height);
      var cpx7 = cpx6;
      var cpy7 = y2 - (0.135 * attachment_height);
      var cpx8 = cpx5;
      var cpy8 = cpy1;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
      this.ctx.bezierCurveTo(cpx3, cpy3, cpx4, cpy4, x3, y3);
      this.ctx.bezierCurveTo(cpx5, cpy5, cpx6, cpy6, x2, y2);
      this.ctx.bezierCurveTo(cpx7, cpy7, cpx8, cpy8, x1, y1);
      this.ctx.fill();
      this.ctx.stroke();
      break;
    case Vex.Flow.StaveConnector.type.BRACKET:
      topY -= 4;
      botY += 4;
      attachment_height = botY - topY;
      Vex.Flow.renderGlyph(this.ctx, topX - 5, topY - 3, 40, "v1b", true);
      Vex.Flow.renderGlyph(this.ctx, topX - 5, botY + 3, 40, "v10", true);
      topX -= (this.width + 2);
      this.ctx.fillRect(topX, topY, width, attachment_height);
      break;
  }
  
  // un-flip the context, so that we end up with a mirror image of the connector
  if (this.side == Vex.Flow.StaveConnector.side.RIGHT) {
    this.ctx.translate(axis_translation+1, 0);
    this.ctx.scale(-1, 1)
    this.ctx.translate(-axis_translation, 0);
  }
}