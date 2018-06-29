var elements;
farmGraphModule = {
  elements: {
    grid : { 
      _size: [],
      get size() { return elements.grid._size; },
      set size(size) { elements.grid._size = [size[0]/2,size[1]/2]; },
      getGridPosition : function(pos){
        return  pos == 'x' ? elements.grid._size[0] : elements. grid._size[1]
      }
    },
    farmObjects : $(".farm-objects"),
    farm:$(".farm"),
    farmDraggableItem :$(".farm-item > svg,.farm-item > div"),
    dropElements: {
      counter: 1,
      selector: "#drop-zone-area",
      farmDropZone : $("#drop-zone-area"),
      cloneSelector: 'cloneItem',
      cloneIdPrefix: 'elementId_'
    },
    tool: {
      object: {
        txtObjectX: $("#txtObjectX"),
        txtObjectY: $('#txtObjectY'),
        txtObjectW: $('#txtObjectW'),
        txtObjectH: $('#txtObjectH')
      }
    }
  },
  bindCustomScrollBar: function () {
   elements.farmObjects.mCustomScrollbar({
      autoDraggerLength: true,
      autoHideScrollbar: true,
      axis: "x",
      theme: "dark-thin",
      autoExpandScrollbar: true,
      advanced: { autoExpandHorizontalScroll: true }
    });
    elements.farm.mCustomScrollbar({
      autoDraggerLength: true,
      autoHideScrollbar: true,
      keyboard: { enable: true },
      autoExpandScrollbar: true,
      advanced: {
        autoExpandHorizontalScroll: 2,
        updateOnWindowResize: true,
        updateOnContentResize: true
      },
      axis: "yx",
      theme: "dark-thin"
    });
  },
  bindDraggableObjecs: function () {
    console.log(elements.grid._size);
    elements.farmDraggableItem.draggable({
      cursor: 'move',
      revert: 'invalid',
      helper: 'clone',
      appendTo:'body',
      grid: elements.grid._size,
      drag: function (event, ui) {
        var location = calculatePosition(ui.helper.offset(), elements.dropElements.farmDropZone.offset());

     
        var objectValue = { X: location.left, Y: location.top, W: 0, H: 0 };
        setToolObjectPosition(objectValue);
      }
    });
  },
  bindDroppableObjects: function () {
    //this private function use for calculating droppable elements location
    calculatePosition = function (draggableOffset, droppableOffset) {
      var xOffset = parseInt(draggableOffset.left - droppableOffset.left);
      var yOffset  =parseInt(draggableOffset.top - droppableOffset.top);
      var location = {
        left: /*scrollLeft +*/ Math.round( xOffset/ elements.grid.getGridPosition('x')) * elements.grid.getGridPosition('x'),
        top: /* scrollTop +*/  Math.round( yOffset/ elements.grid.getGridPosition('y')) * elements.grid.getGridPosition('y')
      }
      return location;
    }

    setToolObjectPosition = function (objectValues) {
      elements.tool.object.txtObjectX.val(objectValues.X);
      elements.tool.object.txtObjectY.val(objectValues.Y);
      elements.tool.object.txtObjectW.val(objectValues.W);
      elements.tool.object.txtObjectH.val(objectValues.H);
    }

    elements.dropElements.farmDropZone.droppable({
      drop: function (event, ui) {
        var droppingObject = $(this);
        var cloned = $(ui.helper).clone(true);
        if (cloned.hasClass(elements.dropElements.cloneSelector))
          return;

        var location = calculatePosition(ui.helper.offset(), droppingObject.offset());


        cloned.attr("id", elements.dropElements.cloneIdPrefix + elements.dropElements.counter)
          .addClass(elements.dropElements.cloneSelector)
          .css({
            'position':'absolute',
            'border':'none',
            "left": location.left,
            "top": location.top
          })
          .draggable({
            refreshPositions: true,
            scroll: true,
            cursor: 'move',
            containment: elements.dropElements.selector,
            revert: "invalid",
            grid: elements.grid._size,
            drag: function (event, ui) {
            var  location = calculatePosition(ui.helper.offset(), droppingObject.offset());
              var objectValue = { X: location.left, Y: location.top, W: 0, H: 0 };
              setToolObjectPosition(objectValue);
            }
          })
          .resizable({
            grid: elements.grid._size,
            containment: elements.dropElements.selector
          })
          .appendTo(this);
        elements.dropElements.counter++;
      }
    })
  },
  bindExtensionMethods: function () {
    String.prototype.getClass = function () {
      return this.substr(1, this.length);
    };
  },
  init: function (gridSize) {
    elements = this.elements;
    elements.grid.size =gridSize;
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
    this.bindDraggableObjecs();
    this.bindDroppableObjects()
  }
};

