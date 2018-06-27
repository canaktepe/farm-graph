// var $ = require('jquery');
// window.jQuery = $;

// require("jquery-ui"),
//   require('bootstrap/dist/js/bootstrap.bundle.js'),
//   require('malihu-custom-scrollbar-plugin');


import * as $ from "jquery";
import "jquery-ui-dist/jquery-ui.min.js";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "malihu-custom-scrollbar-plugin";

  var elements;
  window.farmGraphModule = {
    elements: {
      customScrollBar: $(".content-device"),
      draggableElements: {
        dragObjects: $('.draggable div')
      },
      dropElements: {
        counter: 1,
        selector: ".drop-zone",
        dropObject: $(".drop-zone"),
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
      console.log("bind scrollbar");
      elements.customScrollBar.mCustomScrollbar({
        axis: "x",
        theme: "dark-thin",
        autoExpandScrollbar: true,
        advanced: { autoExpandHorizontalScroll: true }
      });
    },
    bindDraggableObjecs: function () {
      elements.draggableElements.dragObjects.draggable({
        cursor: 'move',
        revert: 'invalid',
        helper: 'clone',
        containment: elements.dropElements.selector
      });
    },
    bindDroppableObjects: function () {
      //this private function use for calculating droppable elements location
      window.calculatePosition = function (draggableOffset, droppableOffset) {
        var location = {
          left: parseInt(draggableOffset.left - droppableOffset.left),
          top: parseInt(draggableOffset.top - droppableOffset.top)
        }
        return location;
      }

     window. setToolObjectPosition = function (objectValues) {
        elements.tool.object.txtObjectX.val(objectValues.X);
        elements.tool.object.txtObjectY.val(objectValues.Y);
        elements.tool.object.txtObjectW.val(objectValues.W);
        elements.tool.object.txtObjectH.val(objectValues.H);
      }

      elements.dropElements.dropObject.droppable({
        // refreshPositions: true,
        drop: function (event, ui) {
          var droppingObject = $(this);
          var cloned = $(ui.helper).clone();
          if (cloned.hasClass(elements.dropElements.cloneSelector))
            return;

          console.log(ui.helper.outerWidth());
          var location = calculatePosition(ui.helper.offset(), droppingObject.offset());
          cloned
            .attr("id", elements.dropElements.cloneIdPrefix + elements.dropElements.conunter)
            .addClass(elements.dropElements.cloneSelector)
            .css({
              "left": location.left,
              "top": location.top
            })
            .draggable({
              cursor: 'move',
              containment: elements.dropElements.selector,
              revert: "invalid",
              drag: function (event, ui) {
                var location = calculatePosition(ui.helper.offset(), droppingObject.offset());
                var objectValue = { X: location.left, Y: location.top, W: 0, H: 0 };
                setToolObjectPosition(objectValue);
              }
            })
            .resizable({
              // helper: "resizable-helper",
              // autoHide: true,
              containment: elements.dropElements.selector,
            })
            .appendTo(this);
          elements.dropElements.conunter++;
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
      this.bindDroppableObjects();
    }
  };

