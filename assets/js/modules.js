// TODO: farm canvas zoom in zoom out
// TODO: farm canvas object double-click open modal


var elements;
farmGraphModule = {
  jsonElements: [],
  elements: {
    farm: $(".farm"),
    drawArea: $("#draw-area"),
    koForms: $('.type-form'),
    elementModal: {
      selector: $("#elementModal"),
      deleteObjectButton: $("#deleteObject"),
      saveobjectButton: $("#saveObject"),
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
        // var modal = $('#modal').modal('show');

        // modal.data("drawObject", e);

        // FarmModel.farmElements.push(e);


        farmGraphModule.openModal(false, e.drawingRect);
      }
    }

    elements.drawArea.farmDraw(options);
  },



  openModal: function (update, drawedElement) {

    // off button events
    elements.elementModal.selector.off("shown.bs.modal");
    elements.elementModal.selector.off("hidden.bs.modal");
    elements.elementModal.saveobjectButton.off('click');
    elements.elementModal.nextButton.off('click');
    elements.elementModal.backButton.off('click');

    var pageTemplate = drawedElement.options != undefined ? drawedElement.options.pageTemplate : "objectTypes.html";

    update ? console.log("update mode") : console.log("insert mode");

    $(".modal-body").load("/forms/" + pageTemplate, function (
      responseText,
      textStatus,
      XMLHttpRequest
    ) {
      if (XMLHttpRequest.status == 200) {
        // if (update)
        //   farmGraphModule.fillFormData(device);
        elements.elementModal.selector.modal({ show: true });
        var title = !drawedElement.options ? "Select Type" : update
          ? "Update "
          : "Add New " + drawedElement.options.name;
        elements.elementModal.selector.find('.modal-title').text(title)
      }
      else if (XMLHttpRequest.status == 404) {
        console.log(pageTemplate + " Page Not Found");
        drawedElement.remove();
        alert(pageTemplate + " Page Not Found");
        elements.elementModal.selector.modal('hide');
      }
    });

    elements.elementModal.saveobjectButton.on('click', function (e) {
    })

    elements.elementModal.nextButton.on('click', function (e) {
      var selectedType = $('input[name="farmCheckBox"]:checked').val();
      var elementOptions = vm.getTypeOptions(selectedType);
      if (!elementOptions)
        return;

      drawedElement.options = elementOptions;
      farmGraphModule.openModal(false, drawedElement);

      //show back, hide next button
      $(this).hide();
      elements.elementModal.backButton.show();
    })

    elements.elementModal.backButton.on('click', function (e) {
      drawedElement.options = undefined;
      farmGraphModule.openModal(false, drawedElement);

      //show next, hide back button
      $(this).hide();
      elements.elementModal.nextButton.show();
    })

    elements.elementModal.selector.on("shown.bs.modal", function (e) {

    });

    elements.elementModal.selector.on("hidden.bs.modal", function (e) {
      ko.cleanNode(elements.koForms);
      drawedElement.remove();
      //show next, hide back button
      elements.elementModal.nextButton.show();
      elements.elementModal.backButton.hide();
    });
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

  init: function () {
    elements = this.elements;
    this.bindJsonElements();
    this.bindFarmDraw();
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
  }
};
