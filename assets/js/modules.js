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
    farmObjectDragger: $(".farm-objects"),
    farm: $(".farm"),
    farmDraggableItem: $(".dragElement"),
    dropElements: {
      counter: 1,
      selector: "#drop-zone-area",
      farmDropZone: $("#drop-zone-area"),
      cloneSelector: "cloneItem",
      cloneIdPrefix: "elementId_"
    },
    deviceModal: $("#elementModal"),
    tool: {
      object: {
        txtObjectX: $("#txtObjectX"),
        txtObjectY: $("#txtObjectY"),
        txtObjectW: $("#txtObjectW"),
        txtObjectH: $("#txtObjectH")
      }
    }
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

    $("#saveDevice").click(function(){
      elements.deviceModal.modal("hide");
      elements.deviceModal.attr("data-update",true);
    })

    //modal show event
    elements.deviceModal.on("shown.bs.modal", function(e) {
      console.log("dialog show");
      
      var attributes = getModalAttributes(e);
      var update = attributes["data-update"].value === "true";
      var title = update ? "Update ":"Add New "  + attributes["data-title"].value;

      $(this)
        .find(".modal-title")
        .text(title);
    });

    elements.deviceModal.on("hidden.bs.modal", function(e) {
      var attributes = getModalAttributes(e);
      var update = attributes["data-update"].value === "true";

      // delete the element if the form is new and the close button is pressed
      if (update == false)
        $(
          "div." +
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
      elements.deviceModal.attr({
        "data-update": update,
        "data-title": device.name,
        "data-id": device.id,
        "data-guid": device.guid
      });
      // .find(".modal-title")
      // .text("Add New " + device.name);
      console.log(elements.deviceModal);
      elements.deviceModal.modal({ show: true });
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
      var location = calculatePosition(
        ui.helper.offset(),
        droppingObject.offset()
      );
      var size = calculateSize(ui.helper);
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

    elements.dropElements.farmDropZone.droppable({
      drop: function(event, ui) {
        var droppingObject = $(this);
        var cloned = $(ui.helper).clone(true);

        if (cloned.hasClass(elements.dropElements.cloneSelector)) return;

        //cloned item generate new guid
        var location = calculatePosition(
          ui.helper.offset(),
          droppingObject.offset()
        );

        var elementId =
            elements.dropElements.cloneIdPrefix + elements.dropElements.counter,
          guid = farmGraphModule.guid();

        cloned
          .attr({
            id: elementId,
            //cloned item generate new guid
            "data-gid": guid
          })
          .addClass(elements.dropElements.cloneSelector)
          .css({
            position: "absolute",
            border: "none",
            left: location.left,
            top: location.top
          })
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
          .resizable({
            autoHide: true,
            grid: elements.grid._size,
            containment: elements.dropElements.selector,
            resize: function(event, ui) {
              setToolObject(ui, droppingObject);
            }
          })
          .appendTo(this);

        var device = ui.helper.device;
        device.id = elementId;
        device.guid = guid;
        farmGraphModule.openDeviceModal(false, device, ui);

        elements.dropElements.counter++;
      }
    });
  },
  bindExtensionMethods: function() {
    String.prototype.getClass = function() {
      return this.substr(1, this.length);
    };
  },
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
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
    this.bindDraggableObjecs();
    this.bindDroppableObjects();
  }
};
