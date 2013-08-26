'use strict';

function circle(coordinates) {
  var circle = [],
      length = 0,
      lengths = [length],
      polygon = d3.geom.polygon(coordinates),
      p0 = coordinates[0],
      p1,
      x,
      y,
      i = 0,
      n = coordinates.length;

  // Compute the distances of each coordinate.
  while (++i < n) {
    p1 = coordinates[i];
    x = p1[0] - p0[0];
    y = p1[1] - p0[1];
    lengths.push(length += Math.sqrt(x * x + y * y));
    p0 = p1;
  }

  var area = polygon.area(),
      radius = Math.sqrt(Math.abs(area) / Math.PI),
      centroid = polygon.centroid(-1 / (6 * area)),
      angleOffset = -Math.PI / 2, // TODO compute automatically
      angle,
      i = -1,
      k = 2 * Math.PI / lengths[lengths.length - 1];

  // Compute points along the circle’s circumference at equivalent distances.
  while (++i < n) {
    angle = angleOffset + lengths[i] * k;
    circle.push([
      centroid[0] + radius * Math.cos(angle),
      centroid[1] + radius * Math.sin(angle)
    ]);
  }

  return circle;
}

function square() {
      var square = [],
      segments = 30,
      size = 3.3,
      i;
    
    
      for(i = 0; i < segments; i++) {
        square.push([i*size, 0]);
      }

      for(i = 1; i < segments; i++) {
        square.push([(segments-1)*size, i*size]); 
      }

      for(i = segments - 2; i > 0; i--) {
        square.push([i*size, (segments-1)*size]); 
      }

      for(i = segments - 1; i > 0; i--) {
        square.push([0, i*size]); 
      }
      
      return square;
    };
   
function randomRgb()  {
      function randomColorComponent() {
        return Math.floor(Math.random() * 256);
      }
    
      return { 
        r: randomColorComponent(),
        g: randomColorComponent(),
        b: randomColorComponent()
      };
  };
  
function interpolatorRgb(rgb1, rgb2) { 
    return function (n) {
      return {
        r: Math.floor(rgb1.r * (1 - n) + rgb2.r * n),
        g: Math.floor(rgb1.g * (1 - n) + rgb2.g * n),
        b: Math.floor(rgb1.b * (1 - n) + rgb2.b * n),
      }
    }
  };
  
function rgbToHex(rgb) {
    return "#" + ((rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16);
  };

/////////////////////////////////////// 
_.templateSettings.interpolate = /\{\{(.+?)\}\}/g;
//_.templateSettings.escape = /\{\{-(.*?)\}\}/g;

var MainView = Backbone.View.extend({
  el: 'body',
  
  initialize: function (options) {
    this.state = new State();
  },
  
  events: {
    "mousewheel": "onScroll",
    "dragdown": "onScroll",
    "dragup": "onScroll"
  },
  
  onScroll: function (event) {
    alert(event);
    console.debug('onScroll', event);
    var delta = event.originalEvent !== undefined ? event.originalEvent.wheelDelta/120 : event.deltaY/100; 
    console.debug('delta:', delta);
    this.state.transformOn(delta);
  },
  
  render: function () {
    var shapeView = this.shapeView = new ShapePolygonView({model: this.state});
    var shapeView2 = this.shapeView2 = new ShapeCSSView({model: this.state});
    var shapeView3 = this.shapeView3 = new ShapeSFView({model: this.state});
    
    this.$el.append(shapeView.render().el);
    this.$el.append(shapeView2.render().el);
    this.$el.append(shapeView3.render().el);
    this.$el.hammer();
    
    return this;
  }
});
    
var State = Backbone.Model.extend({
  defaults: {
    state: 0
  },
  
  initialize: function() {
    this.min = 0;
    this.max = 100;
    this.speed = 10;
  },
  
  transformOn: function (delta) {
    var current = this.get('state') - (delta * this.speed);
    
    if (current < this.min) {
      current = this.min;
    } else if (current > this.max) {
      current = this.max;
    }
    
    this.set('state', current);
  }
});

var ShapePolygonView = Backbone.View.extend({
  className: 'shape-polygon',

  initialize: function (options) {
    var options = options || {};
   
    var initColor = randomRgb();
    this.finishColor = randomRgb();
 
   this.svg = d3.select(this.el).append("svg")
      .attr('viewBox', '0 0 160 160')
      .attr('preserveAspectRation', 'xMidYMid meet');
      
   this.path = this.svg.append("path");
   
    var coordinates0 = square();
    var coordinates1 = circle(coordinates0);
  
    var d0 = "M" + coordinates0.join("L") + "Z";
    var d1 = "M" + coordinates1.join("L") + "Z";
  
    this._diamond2circle = d3.interpolateString(d0, d1);
    //this._triangle2circle = d3.interpolateString(triangle(), circle());
    this._color2color = d3.interpolateRgb(rgbToHex(initColor), rgbToHex(this.finishColor));
    this._rotate = d3.interpolateNumber(-45, -90);
    this._translate= d3.interpolateString('0, 70', '10, 124');
    this._top = function (state) { return state * 80 };
    
    this.listenTo(this.model, 'change', this.render);
 },
 
 render: function () {
    var state = this.model.get('state')/100;
    
    if (state === 1) {
      var initColor = randomRgb();
      this._color2color = d3.interpolateRgb(rgbToHex(initColor), rgbToHex(this.finishColor));
    }
    
    this.path
     .attr('d', this._diamond2circle(state))
     .attr('fill', this._color2color(state))
     .attr('transform', 'translate(' + this._translate(state) + '), rotate(' + this._rotate(state) +')');
     
    this.$el.attr('style', 'top: '+ this._top(state) +'%');
    
    return this;
 }
});

var ShapeSFView = Backbone.View.extend({
  className: 'shape-sf',

  initialize: function (options) {
    var options = options || {};
      
    var initColor = randomRgb();
    this.finishColor = randomRgb();
 
   this.svg = d3.select(this.el).append("svg")
      .attr('viewBox', '0 0 160 160')
      .attr('preserveAspectRation', 'xMidYMid meet');
      
   this.path = this.svg.append("path");
    
    var diamond = d3.superformula().type("diamond").size(10000).segments(360); 
    var triangle = d3.superformula().type("triangle").size(10000).segments(360);
    var circle = d3.superformula().type("circle").size(6000).segments(360);
  
    this._diamond2triangle = d3.interpolateString(diamond(), triangle());
    this._triangle2circle = d3.interpolateString(triangle(), circle());
    this._color2color = d3.interpolateRgb(rgbToHex(initColor), rgbToHex(this.finishColor));
    this._rotate = d3.interpolateNumber(0, 60);
    
    this._translate= d3.interpolateString('70, 75', '70, 75');
    this._top = function (state) { return state * 80 };
    
    this.listenTo(this.model, 'change', this.render);
 },
 
 render: function () {
    var state = this.model.get('state')/100;
    
    if (state <= 0.5) {
      var path = this._diamond2triangle(state*2);
    } else  {
      var path =this._triangle2circle(state*2 - 1);
    }
    
    if (state === 1) {
      var initColor = randomRgb();
      this._color2color = d3.interpolateRgb(rgbToHex(initColor), rgbToHex(this.finishColor));
    }
    
    this.path
     .attr('d', path)
     .attr('fill', this._color2color(state))
     .attr('transform', 'translate(' + this._translate(state) + '), rotate(' + this._rotate(state) +')');
     
    this.$el.attr('style', 'top: '+ this._top(state) +'%');
    

    
    return this;
 }
});

var ShapeCSSView = Backbone.View.extend({
  className: 'shape-css-container',
  template: _.template("<div class='shape-css' style='border-radius: {{borderRadius}}%; background-color: {{backgroundColor}}'></div></div>"),
  
  initialize: function (options) {
    var initColor = randomRgb();
    this.finishColor = randomRgb();
    this._interpolateRgb = interpolatorRgb(initColor, this.finishColor);
    
    this.listenTo(this.model, 'change', this.render);
  },
  
  render: function () {
    console.debug('ShapeViewCSS#render', this.$el, this.model.toJSON()); 
    
    var current = this.model.get('state') / 100;
    var params = {
      top: current * 80, 
      borderRadius: current * 50,
      backgroundColor: rgbToHex(this._interpolateRgb(current))
    }
    
    this.$el.html(this.template(params));
    this.$el.attr('style', 'top: '+params.top+'%');
    
    if (current === 1) {
      var initColor = randomRgb();
      this._interpolateRgb = interpolatorRgb(initColor, this.finishColor);
    }
    
    return this;
  }
});

var view;

(function () {

  view = new MainView();
  view.render();
})();