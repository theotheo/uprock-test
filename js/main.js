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

///////////////////////////////////////
var ShapeView = Backbone.View.extend({
 initialize: function (options) {
  var h = 900,
    w = 600;
   
   this.svg = d3.select(this.el).append("svg").attr("width", w).attr("height", h);
   this.path = this.svg.append("path");
 },
 
 render: function () {
    var self = this;
 
    function tween(d, i, a) {
      console.log("tween:", d, i, a);
      return d3.interpolateString(d, self.model.get('path'));
    };
    
    function tween2(d, i, a) {
      return d3.interpolateString(a, 'translate(480,100), rotate('+self.model.get('angle')+')');
    }
 
    console.debug('ShapeView#render')
    console.debug(this.model)
   this.path
     .transition()
     .attrTween('d', tween)
     .attr('fill', this.model.get('color'))
     .attrTween('transform', tween2);
     
    return this;
 }
});
 
// dom  
var MainView = Backbone.View.extend({
  el: 'body',
  
  initialize: function (options) {
    var options = options || {};
    this.shape = options.shape;
    this.ShapeView = options.ShapeView;
      
    this.$el.hammer();
  },
  
  events: {
    "mousewheel": "onScroll",
    "swipedown": this.onScroll,
    "swipeup": this.onScroll
  },
  
  onScroll: function (event) {
    var delta = event.originalEvent.wheelDelta/120; 
    console.debug('delta:', delta);
    this.shape.transformOn(delta);
  },
  
  render: function () {
    var shapeView = this.shapeView = new this.ShapeView({model: this.shape});
    shapeView.listenTo(this.shape, 'change', shapeView.render);
    this.$el.append(shapeView.el);
    
    return this;
  }
});

_.templateSettings.interpolate = /\{\{(.+?)\}\}/g;
//_.templateSettings.escape = /\{\{-(.*?)\}\}/g;

//
var ShapeViewCSS = Backbone.View.extend({
  className: 'shape-container',
  template: _.template("<div class='shape' style='border-radius: {{borderRadius}}%; background-color: {{backgroundColor}}'></div></div>"),
  
  initialize: function (options) {
    var options = options || {},
      initColor = options.initColor || '#FF0000',
      finishColor = options.finishColor || '#0000FF';
  },
  
  render: function () {
    console.debug('ShapeViewCSS#render', this.$el, this.model.toJSON()); 
    var params = this.model.toJSON();
    this.$el.html(this.template(params));
    this.$el.attr('style', 'top: '+params.top+'%');
    
    return this;
  }
});

//
// model
var ShapeSF = Backbone.Model.extend({
  initialize: function (options) {
    var options = options || {},
      initColor = options.initColor || '#FF0000',
      finishColor = options.finishColor || '#0000FF';
    
    var diamond = d3.superformula().type("diamond").size(10000).segments(360); 
    var triangle = d3.superformula().type("triangle").size(10000).segments(360);
    var circle = d3.superformula().type("circle").size(10000).segments(360);
  
    this._diamond2triangle = d3.interpolateString(diamond(), triangle());
    this._triangle2circle = d3.interpolateString(triangle(), circle());
    this._color2color = d3.interpolateRgb(initColor, finishColor);
    this._rotate = d3.interpolateNumber(0, 90);
    this._current = 0;
    this.min = 0;
    this.speed = 20;
    this.max = this.speed * 2;

    this.transformOn(0);
  },
  
  transformOn: function (delta) {
    var current = this._normalize(this._current - delta);
    console.debug('Shape#transformOn:', current);
    
    if (current <= this.max/2) {
      this.set('path', this._diamond2triangle(current/this.speed));
    } else  {
      this.set('path', this._triangle2circle(current/this.speed - 1));
    }
    this.set('color', this._color2color(current/this.speed/2));
    this.set('angle', this._rotate(current/this.speed/2));
    
    this._current = current;
  },
  
  _normalize: function (current) {
    if (current < this.min) {
      current = this.min;
    } else if (current > this.max) {
      current = this.max;
    }
    return current;
  }
})

//
var ShapePolygon = Backbone.Model.extend({
  initialize: function (options) {
  
    var options = options || {},
      initColor = options.initColor || '#FF0000',
      finishColor = options.finishColor || '#0000FF';
    
    
    function square() {
      var square = [],
      segments = 30,
      size = 1.5;
    
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
    
    coordinates0 = square();
    coordinates1 = circle(coordinates0);
  
    d0 = "M" + coordinates0.join("L") + "Z",
    d1 = "M" + coordinates1.join("L") + "Z";
  
    this._diamond2circle = d3.interpolateString(d0, d1);
    //this._triangle2circle = d3.interpolateString(triangle(), circle());
    this._color2color = d3.interpolateRgb(initColor, finishColor);
    this._rotate = d3.interpolateNumber(0, 90);
    this._current = 0;
    this.min = 0;
    this.speed = 20;
    this.max = this.speed * 2;

    this.transformOn(0);
  },
  
  transformOn: function (delta) {
    var current = this._normalize(this._current - delta);
    console.debug('Shape#transformOn:', current);
    
    
    this.set('path', this._diamond2circle(current/this.speed/2));
    this.set('color', this._color2color(current/this.speed/2));
    //this.set('angle', this._rotate(current/this.speed/2));
    
    this._current = current;
  },
  
  _normalize: function (current) {
    if (current < this.min) {
      current = this.min;
    } else if (current > this.max) {
      current = this.max;
    }
    return current;
  }
});
    

//
var ShapeCSS = Backbone.Model.extend({
  // utils functions
  _randomRgb: function ()  {
      function randomColorComponent() {
        return Math.floor(Math.random() * 256);
      }
    
      return { 
        r: randomColorComponent(),
        g: randomColorComponent(),
        b: randomColorComponent()
      };
  },
  
  _interpolatorRgb: function (rgb1, rgb2) { 
    return function (n) {
      return {
        r: Math.floor(rgb1.r * (1 - n) + rgb2.r * n),
        g: Math.floor(rgb1.g * (1 - n) + rgb2.g * n),
        b: Math.floor(rgb1.b * (1 - n) + rgb2.b * n),
      }
    }
  },
  
  _rgbToHex: function (rgb) {
    return "#" + ((rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16);
  },

  initialize: function(options) {
    options = options || {};
    this._current = 0;
    this.min = 1;
    this.speed = 10;
    this.max = (this.speed * 2);
    
    var initColor = this._randomRgb();
    var finishColor = this._randomRgb();
    this._interpolateRgb = this._interpolatorRgb(initColor, finishColor);
    
  },
  
  transformOn: function (delta) {
    var current = this._normalize(this._current - delta);
    console.debug('Shape#transformOn:', current);
  
    this.set({
      'top': current * 90/this.max, 
      'borderRadius': current * 50/this.max,
      'backgroundColor': this._rgbToHex(this._interpolateRgb(current * 1/this.max))
    });
    
    this._current = current;
  },
  
  _normalize: function (current) {
    if (current < this.min) {
      current = this.min;
    } else if (current > this.max) {
      current = this.max;
    }
    return current;
  }
});

var shape, shapeCss;

var appInit = function () {
  //shape = new ShapePolygon();
  //var view = new MainView({shape: shape, ShapeView: ShapeView});
  //view.render();
  
  shapeCss = new ShapeCSS();
  var view = new MainView({shape: shapeCss, ShapeView: ShapeViewCSS});
  view.render();
  shapeCss.transformOn(0);
};

appInit();
