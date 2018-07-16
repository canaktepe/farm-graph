// TODO: farm canvas zoom in zoom out
// TODO: farm canvas object double-click open modal
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
      getGridPosition: function (pos) {
        return pos == "x" ? elements.grid._size[0] : elements.grid._size[1];
      }
    },
    farmMainTool: $("#farmMain"),
    devicesTool: $("#devices"),
    otherDevicesTool: $("#others"),
    farmMainElements: [],
    farmDevices: [],
    otherElements: [],
    activeDeviceSelector: ".activeDevice",
    farmScrollerObjects: $(".farm-object-scroller"),
    farm: $(".farm"),
    farmDraggableItem: $(".dragElement"),
    dropElements: {
      counter: 1,
      selector: "#drop-zone-area",
      farmDropZone: $("#drop-zone-area"),
      cloneSelector: ".cloneItem",
      cloneIdPrefix: "elementId_"
    },
    deviceModal: {
      selector: $("#elementModal"),
      deleteObjectButton: $("#deleteObject"),
      saveobjectButton: $("#saveObject")
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
  buttonBindings: function () {
    elements.deviceModal.deleteObjectButton.confirmation({
      rootSelector: "[data-toggle=confirmation]",
      onConfirm: function (value) {
        var activeElement = $(elements.activeDeviceSelector);
        activeElement.remove();
        jsPlumb.removeAllEndpoints(activeElement.data("id"));
        if ($(elements.activeDeviceSelector).length == 0) {
          elements.deviceModal.deleteObjectButton.prop("disabled", true);
          elements.deviceModal.saveobjectButton.prop("disabled", true);
        }
      }
    });

    elements.deviceModal.deleteObjectButton.click(function (e) {
      var activeElements = $(elements.activeDeviceSelector);
      if (activeElements.length == 0) return;
    });
  },
  guid: function () {
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
  bindFarmDeviceElements: function () {
    // pushes the data from the json datum into the corresponding element
    bindElements = function (json, pushEl) {
      //elements sort by order prop
      json.sort((a, b) => a.order - b.order);
      $.each(json, function (i, fep) {
        var fe = $("<div>", { class: "list-inline-item farm-item" });
        $("<div>", { class: "text-center pb-1" })
          .appendTo(fe)
          .text(fep.name);
        $("<div>", {
          class: "dragElement",
          css: { backgroundColor: fep.color },
          attr: { "data-type": fep.type, "data-title": fep.name, "data-resizable": fep.resizable, "data-endpoints": JSON.stringify(fep.endPoints) }
        })
          // this step first draggable bind for device tool elements
          .draggable({
            cursor: "move",
            revert: "invalid",
            helper: "clone",
            appendTo: "body",
            grid: elements.grid._size,
            start: function (event, ui) {
              ui.helper.device = fep;
            },
            drag: function (event, ui) {
              setToolObject(ui, elements.dropElements.farmDropZone);
            }
          })
          .appendTo(fe);
        pushEl.append(fe);
      });
    }

    //bind barn Elements
    bindElements(elements.farmMainElements, elements.farmMainTool);
    //bind farm Devices
    bindElements(elements.farmDevices, elements.devicesTool);
    //bind farm other Devices
    bindElements(elements.otherDevices, elements.otherDevicesTool);

    getModalAttributes = function (e) {
      var dialogModal = e.currentTarget;
      return dialogModal.attributes;
    };

    $("#saveDevice").click(function (e) {
      elements.deviceModal.selector.modal("hide");
      elements.deviceModal.selector.attr("data-update", true);

      //if click save button binding endpoints for device elements
      var endpoints = elements.deviceModal.selector.attr("data-endpoints");
      var endpointElementToAdd = elements.deviceModal.selector.attr("data-id");
      farmGraphModule.bindDeviceEndpoints(endpointElementToAdd, endpoints);
    });

    //modal show event
    elements.deviceModal.selector.on("shown.bs.modal", function (e) {
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

    elements.deviceModal.selector.on("hidden.bs.modal", function (e) {
      //modal endpoints data attributes clear when hidden
      elements.deviceModal.selector.attr("data-endpoints", "[]");

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
  },
  openDeviceModal: function (update, device, ui) {
    update ? console.log("update mode") : console.log("insert mode");
    $(".modal-body").load("/device_forms/" + device.pageTemplate, function (
      responseText,
      textStatus,
      XMLHttpRequest
    ) {
      if (XMLHttpRequest.status == 200) {
        elements.deviceModal.selector.attr({
          "data-update": update,
          "data-title": device.name,
          "data-id": device.id,
          "data-guid": device.guid,
          "data-endpoints": JSON.stringify(device.endPoints)
        });
        elements.deviceModal.selector.modal({ show: true });
      }
      else if (XMLHttpRequest.status == 404) {
        alert(device.pageTemplate + " Page Not Found");
        console.log(device.pageTemplate + " Page Not Found");
        $(
          "div" +
          elements.dropElements.cloneSelector +
          "[id=" +
          device.id +
          "]"
        ).remove();
      }
    });
  },

  bindDeviceEndpoints: function (deviceElement, endpoints) {
    if (endpoints === undefined) return;

    var endpointArr = JSON.parse(endpoints);
    if (endpointArr.length > 0) {
      console.log("endpoint add " + deviceElement);

      $.each(endpointArr, function (i, endpoint) {
        jsPlumb.addEndpoint(deviceElement, {
          anchor: endpoint.anchor,
          isTarget: endpoint.isTarget,
          isSource: endpoint.isSource
        })
      })

      jsPlumb.draggable(deviceElement, {
        // refreshPositions: true,
        // scroll: true,
        filter: ".ui-resizable-handle",
        cursor: "move",
        containment: elements.dropElements.selector,
        revert: "invalid",
        grid: elements.grid._size,
        drag: function (event, ui) {
          // console.log(event);
          // setToolObject(ui, droppingObject);
        }
      });
    }
  },

  bindCustomScrollBar: function () {
    //farmScrollerObjects bind customscrollbar
    $.each(elements.farmScrollerObjects, function (i, scroller) {
      $(scroller).mCustomScrollbar({
        autoDraggerLength: true,
        autoHideScrollbar: true,
        axis: "x",
        theme: "dark-thin",
        autoExpandScrollbar: true,
        advanced: { autoExpandHorizontalScroll: true }
      });
    })

    elements.farm.mCustomScrollbar({
      autoDraggerLength: true,
      autoHideScrollbar: true,
      keyboard: { enable: true },
      autoExpandScrollbar: true,
      contentTouchScroll: true,
      documentTouchScroll: true,
      live: "on",
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
      cursor: "move",
      revert: "invalid",
      helper: "clone",
      appendTo: "body",
      grid: elements.grid._size,
      drag: function (event, ui) {
        setToolObject(ui, elements.dropElements.farmDropZone);
      }
    });
  },
  bindDroppableObjects: function () {
    //this private function use for calculating droppable elements location
    calculatePosition = function (draggableOffset, droppableOffset) {
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

    calculateSize = function (helper) {
      var size = {
        width: $(helper).outerWidth(true),
        height: $(helper).outerHeight(true)
      };
      return size;
    };

    setToolObject = function (ui, droppingObject) {
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

    clearActive = function (clicked) {
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
      greedy: true,
      drop: function (event, ui) {
        var droppingObject = elements.dropElements.farmDropZone;

        var cloned = $(ui.helper).clone(true);

        //if has cloned element perevent re-clone
        var clonedHas = cloned.hasClass(elements.dropElements.cloneSelector.getClass());
        if (clonedHas)
          return;

        // get device json data
        var device = ui.helper.device;


        if ((device.acceptable === undefined || $.inArray(0, device.acceptable))) {
          setTimeout(function () {
            $(ui.draggable).promise().done(function () {
              $(ui.draggable).effect('shake', {}, 500);
            });
          }, 150);

          return;
        }
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

        // set device id and guid json data
        device.id = elementId;
        device.guid = guid;

        // set size when element has specific size
        if (device.size != undefined) cloned.css({ width: device.size.width, height: device.size.height });

        cloned
          .attr({
            id: elementId,
            //cloned item generate new guid
            "data-gid": guid,
            "data-id": elementId
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
          .click(function (e) {
            clearActive(e);
            setToolObject(e, elements.dropElements.farmDropZone);
            elements.deviceModal.deleteObjectButton.prop("disabled", false);
            elements.deviceModal.saveobjectButton.prop("disabled", false);
          })
          .appendTo(droppingObject);

        cloned.droppable({
          greedy: true,
          drop: function (cEvent, cUi) {
            //TODO: Acceptable object
            console.log(this);
          }
        })

        var clonedProperties = {
          resizable: cloned.attr("data-resizable") === "true",
          elementHasEndpoint: cloned.attr("data-endpoints") === undefined ? false : true
        }

        if (!clonedProperties.elementHasEndpoint) {
          //bind re-drag element on farm canvas
          cloned.draggable({
            refreshPositions: true,
            scroll: true,
            cursor: "move",
            containment: elements.dropElements.selector,
            revert: "invalid",
            grid: elements.grid._size,
            drag: function (event, ui) {
              setToolObject(ui, droppingObject);
            }
          })
        }

        //if element resizable property true binding
        if (clonedProperties.resizable) {
          cloned.resizable({
            autoHide: true,
            grid: elements.grid._size,
            containment: elements.dropElements.selector,
            resize: function (event, ui) {
              setToolObject(ui, droppingObject);
              jsPlumb.revalidate(ui.helper);
            }
          })
        }

        //open device modal dialog form
        if (device.pageTemplate !== undefined)
          farmGraphModule.openDeviceModal(false, device, ui);

        //id is being increased
        elements.dropElements.counter++;
        elements.deviceModal.deleteObjectButton.prop("disabled", false);
        elements.deviceModal.saveobjectButton.prop("disabled", false);
      }
    });
  },
  bindExtensionMethods: function () {
    String.prototype.getClass = function () {
      return this.substr(1, this.length);
    };
  },
  //load device items from json file
  loadDeviceItems: function () {
    $.getJSON("/assets/devices.json", { tags: "devices", })
      .done(function (data) {
        elements.farmDevices = data.devices;
        elements.farmMainElements = data.farmMain;
        elements.otherDevices = data.otherDevices;
        farmGraphModule.bindFarmDeviceElements();
      })
      .fail(function (jqxhr, textStatus, error) {
        console.log("Request Failed: " + error);
      });
  },

  init: function (gridSize) {
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
