var elements;
farmGraphModule = {


  
  elements: {
    farmObjects : $(".farm-objects"),
    farm:$(".farm"),
    farmDraggableItem :$(".farm-item > svg"),
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
    elements.farmDraggableItem.draggable({
      cursor: 'move',
      revert: 'invalid',
      helper: 'clone',
      appendTo:'body',
      drag: function (event, ui) {
        var location = calculatePosition(this,ui.helper.offset(), elements.dropElements.farmDropZone.offset());
        var objectValue = { X: location.left, Y: location.top, W: 0, H: 0 };
        setToolObjectPosition(objectValue);
        // elements.farm.mCustomScrollbar("scrollTo",  [200,200]);
      }
    });
  },
  bindDroppableObjects: function () {

    // elements.farmDropZone.droppable({
    //   drop: function (event, ui) {
    //     var cloned = $(ui.helper).clone();

    //     cloned.appendTo(this);
    //   }
    // })
    //this private function use for calculating droppable elements location
    calculatePosition = function (draggableOffset, droppableOffset) {

      var draggerV = elements.farm.find(".mCSB_dragger[id$='vertical']"),
        draggerH = elements.farm.find(".mCSB_dragger[id$='horizontal']");
      scrollTop = draggerV.position().top
      scrollLeft = draggerH.position().left;

      var location = {
        left: /*scrollLeft +*/ parseInt(draggableOffset.left - droppableOffset.left),
        top: /* scrollTop +*/ parseInt(draggableOffset.top - droppableOffset.top)
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
        var cloned = $(ui.helper).clone();
        if (cloned.hasClass(elements.dropElements.cloneSelector))
          return;

        var location = calculatePosition(ui.helper.offset(), droppingObject.offset());
        cloned.attr("id", elements.dropElements.cloneIdPrefix + elements.dropElements.counter)
          .addClass(elements.dropElements.cloneSelector)
          .css({
            "left": location.left,
            "top": location.top
          })
          .draggable({
            scroll: true,
            cursor: 'move',
            containment: elements.dropElements.selector,
            revert: "invalid",
            drag: function (event, ui) {
              var location = calculatePosition(this,ui.helper.offset(), droppingObject.offset());
              var objectValue = { X: location.left, Y: location.top, W: 0, H: 0 };
              setToolObjectPosition(objectValue);
              // elements.farm.mCustomScrollbar("scrollTo",  [200,200]);
            }
          })
          .resizable({
            containment: elements.dropElements.selector,
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
  init: function () {
    elements = this.elements;
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
    this.bindDraggableObjecs();
    this.bindDroppableObjects()

  }
};

