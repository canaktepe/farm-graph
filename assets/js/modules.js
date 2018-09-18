// TODO: farm canvas zoom in zoom out
// TODO: farm canvas object double-click open modal

var elements;
farmGraphModule = {
  elements: {
    farmDrawPluginOptions: {
      drawNewButton: "#draw",
      canvas: {
        width: 2000,
        height: 1000,
        grid: true,
        gridSize: [25, 25]
      },
      rectangle: {
        color: "#9b9b9b",
        selectable: true,
        draggable: true,
        resizable: true
      },
      onDrawComplete(e) {
        farmGraphModule.openModal(false, e.drawingRect, function (item) {
          if (typeof item === "object") {
            e.drawingRect.click();
          }
        });
      },
      onSelectElement(e) {
        var guid = $(e).attr("id");
        vm.selectElement(guid);

        $(e).draggable("option", "start", function (event, ui) {
          $(this).click();
        });
        $(e).draggable("option", "drag", function (event, ui) {
          vm.setElementPosition(ui.position);
        });
        $(e).resizable("option", "resize", function (event, ui) {
          guid = $(e).attr("id");
          vm.setElementPosition(ui.size);
          vm.selectElement(guid);
        });
        $(e).resizable("option", "start", function (event, ui) {
          guid = $(e).attr("id");
          vm.selectElement(guid);
        });
      }
    },
    jsonElements: [],
    farm: $(".farm"),
    bsSliderFarmZoom: $('#bsSliderFarmZoom'),
    drawArea: $("#draw-area"),
    mainAcceptable: ko.observableArray([15]),
    elementModal: {
      selector: $("#elementModal"),
      typesBody: $("#modalBodyTypes"),
      contentBody: $("#modalBodyContent"),
      saveButton: $("#saveElement"),
      nextButton: $("#nextStep"),
      backButton: $("#backStep")
    },
    activeClass: "active"
  },

  bindCustomScrollBar: function () {

    $(".dropdown-scroller").mCustomScrollbar({
      // scrollbarPosition: "outside"
    });

    $("#addedRouting").mCustomScrollbar({
      scrollbarPosition: "outside"
    });

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

  bindExtensionMethods: function () {
    String.prototype.getClass = function () {
      return this.substr(1, this.length);
    };
  },

  bindFarmDraw: function () {
    elements.drawArea.farmDraw(elements.farmDrawPluginOptions);
  },

  loadModalTypesSection: function () {
    elements.elementModal.typesBody.load("/forms/objectTypes.html", function (
      responseText,
      textStatus,
      XMLHttpRequest
    ) {
      if (XMLHttpRequest.status == 200) {
      } else if (XMLHttpRequest.status == 404) {
        console.log("objectTypes.html Page Not Found");
      }
    });
  },

  elementUpdatedblClick: function (e) {
    var clickedElement = $(e.currentTarget);
    var guid = clickedElement.attr("id");
    vm.getCreatedElement(guid, function (data) {
      farmGraphModule.openModal(true, data, function (cb) {
        farmGraphModule.fillFormData(data);
      });
    });
    e.stopPropagation();
  },

  setEnableElementsType: function (drawedElement) {
    var isChild = drawedElement.parent().hasClass("rect");
    var acceptable = elements.mainAcceptable();

    if (isChild) {
      var type = drawedElement.parent().data("type");
      var options = vm.getTypeOptions(type);
      acceptable = options.acceptable();
    }
    vm.setEnable(acceptable);
  },

  fillFormData: function (data) {
    $("#Name").val(data.formData().Name);
    $("#Name2").val(data.formData().Name2);
  },

  getDrawedElementPosition: function (drawedElement) {
    var position = { w: 0, h: 0, x: 0, y: 0 };
    if (drawedElement.options) {
      position.w = parseInt(drawedElement.css("width"));
      position.h = parseInt(drawedElement.css("height"));
      position.x = parseInt(drawedElement.css("left"));
      position.y = parseInt(drawedElement.css("top"));
    } else {
      var savedElement = $("div[id=" + drawedElement.guid() + "]");
      if (savedElement) {
        position.w = parseInt(savedElement.css("width"));
        position.h = parseInt(savedElement.css("height"));
        position.x = parseInt(savedElement.css("left"));
        position.y = parseInt(savedElement.css("top"));
      }
    }
    return position;
  },

  openModal: function (update, drawedElement, callback) {
    // off button events
    elements.elementModal.selector.off("shown.bs.modal");
    elements.elementModal.selector.off("hidden.bs.modal");
    elements.elementModal.saveButton.off("click");
    elements.elementModal.nextButton.off("click");
    elements.elementModal.backButton.off("click");
    elements.elementModal.selector.data("saved", false);

    //modal showing
    elements.elementModal.selector.modal({ show: true });

    //binding modal save button event
    elements.elementModal.saveButton.on("click", function (e) {
      elements.elementModal.selector.data("saved", true).modal("hide");
      // get selected type forms input data
      var formData = $("form#controlData")
        .serializeArray()
        .reduce(function (m, o) {
          m[o.name] = o.value;
          return m;
        }, {});

      var position = farmGraphModule.getDrawedElementPosition(drawedElement);

      var options;
      if (update) {
        options = drawedElement;

        options.position(position);
        options.formData(formData);
        vm.setElement(options);
      } else {
        var guid = farmGraphModule.guid();
        drawedElement.options.position(position);
        drawedElement.options.guid(guid);
        options = drawedElement.options;
        options.formData(formData);

        var parentGuid = farmGraphModule.getParentGuid(drawedElement);

        vm.pushElement(parentGuid, options);
        drawedElement
          .attr({
            id: guid,
            "data-type": options.id()
          })
          .css({
            backgroundColor: options.color()
          })
          .dblclick(farmGraphModule.elementUpdatedblClick);
      }

      callback(drawedElement);
    });

    //binding modal next button event
    elements.elementModal.nextButton.on("click", function (e) {
      if (update) {
        console.log("update mode");
        elements.elementModal.contentBody.load(
          "/forms/" + drawedElement.pageTemplate(),
          function (responseText, textStatus, XMLHttpRequest) {
            if (XMLHttpRequest.status == 200) {
              elements.elementModal.selector
                .find(".modal-title")
                .text("Update " + drawedElement.name());
            } else if (XMLHttpRequest.status == 404) {
              console.log(pageTemplate + " Page Not Found");
              elements.elementModal.selector.modal("hide");
            }
          }
        );
        return;
      }

      var selectedType = $('input[name="farmCheckBox"]:checked').val();
      var elementOptions = vm.getTypeOptions(selectedType);

      if (!elementOptions) return;

      console.log("insert mode");
      drawedElement.options = elementOptions;
      var pageTemplate = drawedElement.options.pageTemplate();
      elements.elementModal.contentBody.load("/forms/" + pageTemplate, function (
        responseText,
        textStatus,
        XMLHttpRequest
      ) {
        if (XMLHttpRequest.status == 200) {
          elements.elementModal.selector
            .find(".modal-title")
            .text("Add New " + drawedElement.options.name());
          $("form#controlData input:first").focus();
        } else if (XMLHttpRequest.status == 404) {
          console.log(pageTemplate + " Page Not Found");
          elements.elementModal.selector.modal("hide");
          drawedElement.remove();
        }
      });

      //show back, hide next button
      $(this).hide();
      elements.elementModal.backButton.show();
      elements.elementModal.saveButton.show();
      elements.elementModal.typesBody.hide();
      elements.elementModal.contentBody.show();
    });

    //binding modal back button event
    elements.elementModal.backButton.on("click", function (e) {
      drawedElement.options = undefined;
      //show next, hide back button
      elements.elementModal.selector.find(".modal-title").text("Select Type");
      $(this).hide();
      elements.elementModal.nextButton.show();
      elements.elementModal.saveButton.hide();
      elements.elementModal.contentBody.hide();
      elements.elementModal.typesBody.show();
    });

    //binding modal shown event
    elements.elementModal.selector.on("shown.bs.modal", function (e) {
      return callback("ok");
    });

    //binding modal hidden event
    elements.elementModal.selector.on("hidden.bs.modal", function (e) {
      var saved = elements.elementModal.selector.data("saved");
      if (!update && !saved) {
        drawedElement.remove();
      }
      //show next, hide back button
      elements.elementModal.saveButton.hide();
      elements.elementModal.backButton.hide();
      elements.elementModal.nextButton.show();
    });

    if (!update) {
      //object Types page all types set disable
      vm.setDisableAllTypes();
      //object Types page set enabled according to drawed elements acceptable values
      elements.elementModal.selector.find(".modal-title").text("Select Type");
      farmGraphModule.setEnableElementsType(drawedElement);
      elements.elementModal.contentBody.hide();
      elements.elementModal.typesBody.show();
    } else {
      elements.elementModal.nextButton.click();
      elements.elementModal.typesBody.hide();
      elements.elementModal.contentBody.show();
      elements.elementModal.nextButton.hide();
      elements.elementModal.saveButton.show();
    }
  },

  getParentGuid: function (drawedElement) {
    var parent = drawedElement.parent();
    if (!parent.hasClass("rect")) return null;
    return parent.attr("id");
  },

  bindJsonElements: function () {
    $.getJSON("/assets/devices.json")
      .done(function (data) {
        farmGraphModule.elements.jsonElements = data;
      })
      .fail(function (jqxhr, textStatus, error) {
        console.log("Request Failed: " + error);
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

  elementSelectClick: function (e) {
    var obj = $(e.currentTarget);
    $(".rect.active").removeClass("active");
    $(this).addClass(elements.activeClass);
    var guid = obj.attr("id");
    vm.selectElement(guid);
    e.stopPropagation();
  },


 

  bindDbData: function (JSONData, parentObj) {
    if (JSONData == null) return;
    $.each(JSONData, function (i, elem) {
      var elementModel = new jsonToModel(ko.toJS(elem));
      var el = $("<div />")
        .attr({ id: elementModel.guid(), "data-type": elementModel.id() })
        .css({
          backgroundColor: elementModel.color(),
          width: elementModel.position().w,
          height: elementModel.position().h,
          top: elementModel.position().y,
          left: elementModel.position().x
        })
        .addClass("rect")
        .dblclick(farmGraphModule.elementUpdatedblClick)
        .click(farmGraphModule.elementSelectClick)
        .draggable({
          containment: "parent",
          grid: elements.farmDrawPluginOptions.canvas.gridSize,
          start: function (event, ui) {
            $(this).click();
          },
          drag: function (event, ui) {
            vm.setElementPosition(ui.position);
          }
        });

      if (elem.resizable) {
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-nw",
          attr: { id: "nwgrip" }
        }).appendTo(el);
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-ne",
          attr: { id: "negrip" }
        }).appendTo(el);
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-sw",
          attr: { id: "swgrip" }
        }).appendTo(el);
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-se",
          attr: { id: "segrip" }
        }).appendTo(el);
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-n",
          attr: { id: "ngrip" }
        }).appendTo(el);
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-e",
          attr: { id: "egrip" }
        }).appendTo(el);
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-s",
          attr: { id: "sgrip" }
        }).appendTo(el);
        $("<div>", {
          class: "ui-resizable-handle ui-resizable-w",
          attr: { id: "wgrip" }
        }).appendTo(el);
        el.resizable({
          handles: {
            nw: "#nwgrip",
            ne: "#negrip",
            sw: "#swgrip",
            se: "#segrip",
            n: "#ngrip",
            e: "#egrip",
            s: "#sgrip",
            w: "#wgrip"
          },
          minWidth: 30,
          minHeight: 30,
          containment: "parent",
          autoHide: true,
          grid: elements.farmDrawPluginOptions.canvas.gridSize,
          resize: function (event, ui) {
            var guid = $(ui.helper).attr("id");
            vm.setElementPosition(ui.size);
            vm.selectElement(guid);
          }
        });

        if (parentObj == null) farmGraphModule.elements.drawArea.append(el);
        else parentObj.append(el);

        if (elementModel.children().length > 0) {
          farmGraphModule.bindDbData(elementModel.children(), el);
        }
      }
    });
  },
  bootstrapSlider: function () {

   var slider = elements.bsSliderFarmZoom.bootstrapSlider({
      formatter: function (value) {
        $('.farm-draw-zone').css({
          zoom: value + '%',
          // '-moz-transform': scale(1.0),
          // '-webkit-transform': scale(1.0)
        })
        return value;
      }      
    });
    // slider.bootstrapSlider('setValue',vm.canvasProperties.zoom)
  },

  init: function (jsonData) {
    elements = this.elements;
    this.bindJsonElements();
    this.loadModalTypesSection();
    this.bindFarmDraw();
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
    this.bootstrapSlider();

 
    this.bindDbData(jsonData, null);
  }
};
