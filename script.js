;(function() {
  'use strict';
  var shapes = [];

  // Request distance for each parameter asynchronously 
  function asyncRequest(parameters, responseCallback, completedCallback) {
    if (parameters.length === 0) {
      setTimeout(completedCallback, 1);
      return;
    }
    parameters.forEach(function(parameter) {
      getDistanceAPI(function(result) {
        responseCallback(
          parameters.splice(parameters.indexOf(parameter), 1),
          result
        );
        if (parameters.length === 0) {
          completedCallback();
        }
      });
    });
  }

  // Shape prototype
  var Shape = Object.create(Object.prototype);
  Shape.name = 'Geometric shape';
  Shape.distances = {};
  Shape.render = function() {};
  Shape.getArea = function() { return NaN; };
  Shape.recalculate = function(completedCallback) {
    var responseCallback = function(parameter, result) {
      this.distances[parameter] = result.distance;
    }
    asyncRequest(
      Object.keys(this.distances),
      responseCallback.bind(this),
      (function(){
        console.log(this.toString());
        completedCallback.call(this);
      }).bind(this)
    )
  };
  Shape.toString = function() {
    return this.name + '( ' + Object.keys(this.distances).map((function(distance) {
      return distance + ': ' + this.distances[distance];
    }).bind(this)).join(', ') + ' )';
  }

  // Shape factory
  function createShape(name, distanceParameters, getAreaFunc, renderFunc) {
    var distances = {};
    distanceParameters.forEach(function(parameter) {
      distances[parameter] = NaN;
    });
    var shape = Object.create(Shape);
    shape.name = name;
    shape.distances = distances;
    if (typeof getAreaFunc === 'function') shape.getArea = getAreaFunc;
    if (typeof renderFunc === 'function')  shape.render = renderFunc;
    return shape;
  }

  // Get context and set common styles
  function getContext(canvas) {
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = 'rgba(0, 255, 0, .15)';
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 255, 0, .8)';
      return ctx;
  }
  shapes.push(createShape(
    'Ellipse',
    ['radiusX', 'radiusY'],
    function() {
      return this.distances.radiusX * this.distances.radiusY * Math.PI;
    },
    function(canvas) {
      var ctx = getContext(canvas);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(2, 1);
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, 2 * Math.PI, false);
      ctx.restore();
      ctx.fill();
      ctx.stroke();          
    }
  ));
  shapes.push(createShape(
    'Circle',
    ['radius'],
    function() {
      return Math.pow(this.distances.radius, 2) * Math.PI;
    },
    function(canvas) {
      var ctx = getContext(canvas);
      ctx.beginPath();
      ctx.arc(40, 40, 26, 0 , 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  ));
  shapes.push(createShape(
    'Rectangle',
    ['base', 'height'],
    function() {
      return this.distances.base * this.distances.height;
    },
    function(canvas) {
      var ctx = getContext(canvas);
      ctx.rect(10, 20, 60, 40);
      ctx.fill();
      ctx.stroke();
    }
  ));
  shapes.push(createShape(
    'Square',
    ['length'],
    function() {
      return Math.pow(this.distances.length, 2);
    },
    function(canvas) {
      var ctx = getContext(canvas);
      ctx.rect(14, 14, 52, 52);
      ctx.fill();
      ctx.stroke();
    }
  ));
  shapes.push(createShape(
    'Triangle',
    ['base', 'height'],
    function() {
      return this.distances.base * this.distances.height / 2;
    },
    function(canvas) {
      var ctx = getContext(canvas);
      ctx.beginPath();
      ctx.moveTo(40, 14);
      ctx.lineTo(70, 66);
      ctx.lineTo(10, 66);
      ctx.lineTo(40, 14);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }
  ));
  shapes.push(createShape(
    'Trapezoid',
    ['base', 'height', 'roof'],
    function() {
      return (this.distances.base + this.distances.roof) / 2 * this.distances.height;
    },
    function(canvas) {
      var ctx = getContext(canvas);
      ctx.beginPath();
      ctx.moveTo(20, 14);
      ctx.lineTo(50, 14);
      ctx.lineTo(70, 66);
      ctx.lineTo(10, 66);
      ctx.lineTo(20, 14);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
    }
  ));

  // A shape with an undefined area  
  // shapes.push(createShape('Singularity', [], null, function(canvas) {
  //   var ctx = getContext(canvas);
  //   ctx.rect(40, 40, 1, 1);
  //   ctx.stroke();
  // }));

  // Create DOM tree from object
  function toDom(elementObject) {
    if (Array.isArray(elementObject)) {

      // Create element node
      var node = document.createElement(elementObject[0]);

      // Add properties
      Object.keys(elementObject[1] || {}).forEach(function(propertyName) {
        node[propertyName] = elementObject[1][propertyName];
      });

      (elementObject[2] || []).forEach(function(child) {

        // Pass each child object and append the returned DOM node
        node.appendChild(toDom(child));
      });
      return node;
    }
    if (typeof elementObject === 'string') {

      // Create text node from string
      return document.createTextNode(elementObject);
    }

    // Element is most likely already a DOM node, just return it 
    return elementObject;
  }

  function numberToString(number) {
    return number.toFixed(2).replace(/\.00|0$/, '');
  }

  function listNextShape() {
    var shapeNode = processShape(shapes.shift(), listNextShape);
    if (shapeNode) {
      document.getElementById('shapesList').appendChild(shapeNode);
    }
  }

  // Create DOM nodes for a shape and add event handlers
  function processShape(shape, onLoadCallback) {
    function onRecalculate() {
      li.className = '';
      trigger.disabled = false;
      var current = shape.getArea();
      calculations.push(current);
      counter.innerText = calculations.length;
      latest.innerText = numberToString(current);
      medium.innerText = numberToString(
        calculations.reduce(function(sum, calculation) {
          return sum + calculation;
        }) / calculations.length
      );
    }
    if (!shape) return;

    var calculations = [];
    var canvas = toDom(['canvas', { width: '80', height: '80' }]);
    var counter = toDom(['td']);
    var latest = toDom(['td']);
    var medium = toDom(['td']);
    var trigger = toDom(['button', { className: 'recalculate', disabled: true }, [
      ['span', { className: 'fa fa-refresh'}]
    ]]);
    trigger.addEventListener('click', function() {
      li.className = 'loading';
      trigger.disabled = true;
      shape.recalculate(onRecalculate);
    });
    var li = toDom(['li', { className: 'loading' }, [
      ['div', { className: 'image' }, [ canvas ]],
      ['h3', {}, [ shape.name ]],
      trigger,
      ['table', { className: 'statistics' }, [
        ['tr', {}, [
          ['th', {}, ['No. of calculations: ']],
          counter
        ]],
        ['tr', {}, [
          ['th', {}, ['Latest result: ']],
          latest
        ]],
        ['tr', {}, [
          ['th', {}, ['Medium area: ']],
          medium
        ]]
      ]]
    ]]);
    shape.render(canvas);
    shape.recalculate(function() {
      onRecalculate();
      if (typeof onLoadCallback === 'function') onLoadCallback();
    });
    return li;
  }
  window.addEventListener('DOMContentLoaded', listNextShape);
})();
