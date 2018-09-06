// TODO: farm canvas zoom in zoom out
// TODO: farm canvas object double-click open modal

var elements;
farmGraphModule = {
  elements: {
    jsonElements: [],
    farm: $(".farm"),
    drawArea: $("#draw-area"),
    mainAcceptable: [15],
    elementModal: {
      selector: $("#elementModal"),
      typesBody: $("#modalBodyTypes"),
      contentBody: $("#modalBodyContent"),
      saveButton: $("#saveElement"),
      nextButton: $("#nextStep"),
      backButton: $("#backStep")
    },
    tool: {
      object: {
        lblObjectName: $("#lblObjectName"),
        txtObjectX: $("#txtObjectX"),
        txtObjectY: $("#txtObjectY"),
        txtObjectW: $("#txtObjectW"),
        txtObjectH: $("#txtObjectH")
      }
    }
  },

  bindCustomScrollBar: function () {
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
    var options = {
      drawNewButton: '#draw',
      canvas: {
        width: 2000,
        height: 1000,
        grid: true,
        gridSize: [25, 25]
      },
      rectangle: {
        color: '#9b9b9b',
        selectable: true,
        draggable: true,
        resizable: true
      },
      onDrawComplete(e) {
        farmGraphModule.openModal(false, e.drawingRect);
      }
    }

    elements.drawArea.farmDraw(options);
  },


  loadModalTypesSection: function () {
    elements.elementModal.typesBody.load("/forms/objectTypes.html", function (
      responseText,
      textStatus,
      XMLHttpRequest
    ) {
      if (XMLHttpRequest.status == 200) {
        elements.elementModal.selector.find('.modal-title').text("Select Type");
      }
      else if (XMLHttpRequest.status == 404) {
        console.log("objectTypes.html Page Not Found");
      }
    });
  },


  elementUpdateEvent: function (e) {
    var clickedElement = $(e.currentTarget);
    var guid = clickedElement.attr('id');
    var data = ko.utils.arrayFilter(vm.createdElements(), function (elem) {
      return elem.guid == guid;
    })[0];

    farmGraphModule.fillFormData(data);
    farmGraphModule.openModal(true, data);
    e.stopPropagation();
  },

  setEnableElementsType: function (drawedElement) {
    var isChild = drawedElement.parent().hasClass('rect');
    var acceptable = elements.mainAcceptable;
    if (isChild) {
      var type = drawedElement.parent().data('type');
      var options = vm.getTypeOptions(type);
      acceptable = options.acceptable;
    }
    vm.setEnable(acceptable);
  },

  fillFormData: function (data) {
    $("#Name").val(data.formData.Name);
  },

  openModal: function (update, drawedElement) {
    // off button events
    elements.elementModal.selector.off("shown.bs.modal");
    elements.elementModal.selector.off("hidden.bs.modal");
    elements.elementModal.saveButton.off('click');
    elements.elementModal.nextButton.off('click');
    elements.elementModal.backButton.off('click');
    elements.elementModal.selector.data('saved', false);

    if (!update) {
      //object Types page all types set disable
      vm.setDisableAllTypes();
      //object Types page set enabled according to drawed elements acceptable values
      farmGraphModule.setEnableElementsType(drawedElement);
      elements.elementModal.contentBody.hide();
      elements.elementModal.typesBody.show();
    }
    else {
      var title = "Update " + drawedElement.name;
      elements.elementModal.selector.find('.modal-title').text(title)
      elements.elementModal.typesBody.hide();
      elements.elementModal.contentBody.show();
      elements.elementModal.nextButton.hide();
      elements.elementModal.saveButton.show();
    }
    
    //modal showing
    elements.elementModal.selector.modal({ show: true });

    //binding modal save button event
    elements.elementModal.saveButton.on('click', function (e) {
      elements.elementModal.selector.data('saved', true).modal('hide');
      // get selected type forms input data
      var formData = $("form#controlData").serializeArray().reduce(function (m, o) { m[o.name] = o.value; return m; }, {});

      var options;
      if (update) {
        options = drawedElement;
        options.formData = formData;
        vm.setElement(options);
      }
      else {
        var guid = farmGraphModule.guid();

        drawedElement.options.guid = guid;
        options = $.extend(true, {}, drawedElement.options);
        options.formData = formData;

        vm.pushElement(options);
        drawedElement
          .attr({
            id: guid,
            'data-type': options.id
          })
          .css({
            backgroundColor: options.color
          })
          .dblclick(farmGraphModule.elementUpdateEvent)
      }
    })

    //binding modal next button event
    elements.elementModal.nextButton.on('click', function (e) {
      var selectedType = $('input[name="farmCheckBox"]:checked').val();
      var elementOptions = vm.getTypeOptions(selectedType);
      if (!elementOptions)
        return;

      drawedElement.options = elementOptions;

      var pageTemplate = drawedElement.options.pageTemplate
      update ? console.log("update mode") : console.log("insert mode");

      elements.elementModal.contentBody.load("/forms/" + pageTemplate, function (
        responseText,
        textStatus,
        XMLHttpRequest
      ) {
        if (XMLHttpRequest.status == 200) {
          var title = update
            ? "Update "
            : "Add New " + drawedElement.options.name;
          elements.elementModal.selector.find('.modal-title').text(title)
        }
        else if (XMLHttpRequest.status == 404) {
          console.log(pageTemplate + " Page Not Found");
          elements.elementModal.selector.modal('hide');
          drawedElement.remove();
        }
      });

      //show back, hide next button
      $(this).hide();
      elements.elementModal.backButton.show();
      elements.elementModal.saveButton.show();
      elements.elementModal.typesBody.hide();
      elements.elementModal.contentBody.show();
    })

    //binding modal back button event
    elements.elementModal.backButton.on('click', function (e) {
      drawedElement.options = undefined;
      //show next, hide back button
      $(this).hide();
      elements.elementModal.nextButton.show();
      elements.elementModal.saveButton.hide();
      elements.elementModal.contentBody.hide();
      elements.elementModal.typesBody.show();
    })

    //binding modal shown event
    elements.elementModal.selector.on("shown.bs.modal", function (e) {

    })

    //binding modal hidden event
    elements.elementModal.selector.on("hidden.bs.modal", function (e) {
      var saved = elements.elementModal.selector.data('saved');
      if (!update && !saved) {
        drawedElement.remove();
      }
      //show next, hide back button
      elements.elementModal.saveButton.hide();
      elements.elementModal.backButton.hide();
      elements.elementModal.nextButton.show();
    })
  },

  bindJsonElements: function () {
    $.getJSON("/assets/devices.json")
      .done(function (data) {
        elements.jsonElements = data;
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

  init: function () {
    elements = this.elements;
    this.bindJsonElements();
    this.loadModalTypesSection();
    this.bindFarmDraw();
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
  }
};
