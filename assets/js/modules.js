var elements;
farmGraphModule = {
  elements: {
    grid: {
      _size: [],
      get size() {
        return elements.grid._size;
      },
      set size(size) {
        elements.grid._size = [size[0] / 2, size[1] / 2];
      },
      getGridPosition: function(pos) {
        return pos == "x" ? elements.grid._size[0] : elements.grid._size[1];
      }
    },
    farmDevices: [],
    activeDeviceSelector: ".activeDevice",
    farmObjectDragger: $(".farm-objects"),
    farm: $(".farm"),
    farmDraggableItem: $(".dragElement"),
    dropElements: {
      counter: 1,
      selector: "#drop-zone-area",
      farmDropZone: $("#drop-zone-area"),
      cloneSelector: ".cloneItem",
      cloneIdPrefix: "elementId_"
    },
    deviceModal:{ 
      selector: $("#elementModal"),
      deleteObjectButton: $("#deleteObject"),
      saveobjectButton :$("#saveObject")
    },
    tool: {
      object: {
        txtObjectX: $("#txtObjectX"),
        txtObjectY: $("#txtObjectY"),
        txtObjectW: $("#txtObjectW"),
        txtObjectH: $("#txtObjectH")
      }
    }
  },
  buttonBindings: function() {
    elements.deviceModal.deleteObjectButton.confirmation({
      rootSelector: "[data-toggle=confirmation]",
      onConfirm: function(value) {
        $(elements.activeDeviceSelector).remove();
        if ($(elements.activeDeviceSelector).length==0){
          elements.deviceModal.deleteObjectButton.prop("disabled", true);
          elements.deviceModal.saveobjectButton.prop("disabled", true);
        }
      }
    });

    elements.deviceModal.deleteObjectButton.click(function(e) {
      var activeElements = $(elements.activeDeviceSelector);
      if (activeElements.length == 0) return;
    });
  },
  guid: function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  },
  bindFarmDeviceElements: function() {
    getModalAttributes = function(e) {
      var dialogModal = e.currentTarget;
      return dialogModal.attributes;
    };

    $("#saveDevice").click(function() {
      elements.deviceModal.selector.modal("hide");
      elements.deviceModal.selector.attr("data-update", true);
    });

    //modal show event
    elements.deviceModal.selector.on("shown.bs.modal", function(e) {
      console.log("dialog show");

      var attributes = getModalAttributes(e);
      var update = attributes["data-update"].value === "true";
      var title = update
        ? "Update "
        : "Add New " + attributes["data-title"].value;

      $(this)
        .find(".modal-title")
        .text(title);
    });

    elements.deviceModal.selector.on("hidden.bs.modal", function(e) {
      var attributes = getModalAttributes(e);
      var update = attributes["data-update"].value === "true";

      // delete the element if the form is new and the close button is pressed
      if (update == false)
        $(
          "div" +
            elements.dropElements.cloneSelector +
            "[id=" +
            attributes["data-id"].value +
            "]"
        ).remove();
    });

    $.each(elements.farmDevices, function(i, device) {
      var deviceElement = $("<div>", { class: "list-inline-item farm-item" });
      var caption = $("<div>", { class: "text-center pb-1" })
        .appendTo(deviceElement)
        .text(device.name);
      var object = $("<div>", {
        class: "dragElement",
        css: { backgroundColor: device.color },
        attr: { "data-type": device.type, "data-title": device.name }
      })
        .draggable({
          cursor: "move",
          revert: "invalid",
          helper: "clone",
          appendTo: "body",
          grid: elements.grid._size,
          start: function(event, ui) {
            ui.helper.device = device;
          },
          drag: function(event, ui) {
            setToolObject(ui, elements.dropElements.farmDropZone);
          }
        })
        .appendTo(deviceElement);
      $("#devices").append(deviceElement);
    });
  },
  openDeviceModal: function(update, device, ui) {
    update ? console.log("update mode") : console.log("insert mode");
    $(".modal-body").load("/device_forms/" + device.pageTemplate, function(
      responseText,
      textStatus,
      XMLHttpRequest
    ) {
      if (XMLHttpRequest.status == 200) {
        elements.deviceModal.selector.attr({
          "data-update": update,
          "data-title": device.name,
          "data-id": device.id,
          "data-guid": device.guid
        });
        elements.deviceModal.selector.modal({ show: true });
      }
    });
  },
  bindCustomScrollBar: function() {
    elements.farmObjectDragger.mCustomScrollbar({
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
  bindDraggableObjecs: function() {
    elements.farmDraggableItem.draggable({
      cursor: "move",
      revert: "invalid",
      helper: "clone",
      appendTo: "body",
      grid: elements.grid._size,
      drag: function(event, ui) {
        setToolObject(ui, elements.dropElements.farmDropZone);
      }
    });
  },
  bindDroppableObjects: function() {
    //this private function use for calculating droppable elements location
    calculatePosition = function(draggableOffset, droppableOffset) {
      var xOffset = parseInt(draggableOffset.left - droppableOffset.left);
      var yOffset = parseInt(draggableOffset.top - droppableOffset.top);
      var location = {
        left:
          Math.round(xOffset / elements.grid.getGridPosition("x")) *
          elements.grid.getGridPosition("x"),
        top:
          Math.round(yOffset / elements.grid.getGridPosition("y")) *
          elements.grid.getGridPosition("y")
      };
      return location;
    };

    calculateSize = function(helper) {
      var size = {
        width: $(helper).outerWidth(true),
        height: $(helper).outerHeight(true)
      };
      return size;
    };

    setToolObject = function(ui, droppingObject) {
      var helper = ui.type == "click" ? $(ui.currentTarget) : ui.helper;
      var location = calculatePosition(
        helper.offset(),
        droppingObject.offset()
      );

      var size = calculateSize(helper);
      var objectValues = {
        X: location.left,
        Y: location.top,
        W: size.width,
        H: size.height
      };

      if (objectValues.X >= 0)
        elements.tool.object.txtObjectX.val(objectValues.X);
      if (objectValues.Y >= 0)
        elements.tool.object.txtObjectY.val(objectValues.Y);

      elements.tool.object.txtObjectW.val(objectValues.W);
      elements.tool.object.txtObjectH.val(objectValues.H);
    };

    clearActive = function(clicked) {
      if (clicked) {
        var object = $(clicked.currentTarget);
        if (object.hasClass(elements.activeDeviceSelector.getClass())) {
          return;
        } else {
          clearActive();
          object.addClass(elements.activeDeviceSelector.getClass());
          return;
        }
      }
      var active = $(elements.dropElements.cloneSelector);
      if (!active) return;
      active.removeClass(elements.activeDeviceSelector.getClass());
    };

    elements.dropElements.farmDropZone.droppable({
      drop: function(event, ui) {
        var droppingObject = $(this);
        var cloned = $(ui.helper).clone(true);

        //if has cloned element perevent re-clone
        if (cloned.hasClass(elements.dropElements.cloneSelector.getClass()))
          return;

        //clear active element
        clearActive();

        //set drag-drop element position
        var location = calculatePosition(
          ui.helper.offset(),
          droppingObject.offset()
        );

        //generate element guid and id
        var elementId =
            elements.dropElements.cloneIdPrefix + elements.dropElements.counter,
          guid = farmGraphModule.guid();

        cloned
          .attr({
            id: elementId,
            //cloned item generate new guid
            "data-gid": guid
          })
          //add clone class selector
          .addClass(elements.dropElements.cloneSelector.getClass())
          //add active class selector last drag element
          .addClass(elements.activeDeviceSelector.getClass())
          .css({
            position: "absolute",
            border: "none",
            left: location.left,
            top: location.top
          })
          //bind click element / select active element
          .click(function(e) {
            clearActive(e);
            setToolObject(e, elements.dropElements.farmDropZone);
            elements.deviceModal.deleteObjectButton.prop("disabled", false);
            elements.deviceModal.saveobjectButton.prop("disabled", false);
          })
          .focusout(function(e) {
            console.log("sex");
          })
          //bind re-drag element on farm canvas
          .draggable({
            refreshPositions: true,
            scroll: true,
            cursor: "move",
            containment: elements.dropElements.selector,
            revert: "invalid",
            grid: elements.grid._size,
            drag: function(event, ui) {
              setToolObject(ui, droppingObject);
            }
          })
          //binding resize device elements
          .resizable({
            autoHide: true,
            grid: elements.grid._size,
            containment: elements.dropElements.selector,
            start: function(event, ui) {
              // $(ui.helper).removeClass('activeDevice');
            },
            resize: function(event, ui) {
              setToolObject(ui, droppingObject);
            }
          })
          .appendTo(this);

        var device = ui.helper.device;
        device.id = elementId;
        device.guid = guid;
        //open device modal dialog form
        farmGraphModule.openDeviceModal(false, device, ui);
        //id is being increased
        elements.dropElements.counter++;
        elements.deviceModal.deleteObjectButton.prop("disabled", false);
        elements.deviceModal.saveobjectButton.prop("disabled", false);
      }
    });
  },
  bindExtensionMethods: function() {
    String.prototype.getClass = function() {
      return this.substr(1, this.length);
    };
  },
  //load device items from json file
  loadDeviceItems: function() {
    $.getJSON("/assets/devices.json")
      .done(function(data) {
        elements.farmDevices = data;
        farmGraphModule.bindFarmDeviceElements();
      })
      .fail(function(jqxhr, textStatus, error) {
        console.log("Request Failed: " + error);
      });
  },
  init: function(gridSize) {
    elements = this.elements;
    elements.grid.size = gridSize;

    this.loadDeviceItems();
    this.buttonBindings();
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
    this.bindDraggableObjecs();
    this.bindDroppableObjects();
  }
};
