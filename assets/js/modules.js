// TODO: farm canvas zoom in zoom out
// TODO: farm canvas object double-click open modal


var elements;
farmGraphModule = {
  elements: {
    farm: $(".farm"),
    drawArea: $("#draw-area"),
    koForms : $('.type-form'),
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
      }
      else if (XMLHttpRequest.status == 404) {
        console.log(pageTemplate + " Page Not Found");
        drawedElement.remove();
      }
    });

    elements.elementModal.saveobjectButton.on('click', function (e) {
      console.log(e);
    })

    elements.elementModal.nextButton.on('click', function (e) {
      console.log('next');
    })

    elements.elementModal.selector.on("shown.bs.modal", function (e) {
      // var attributes = getModalAttributes(e);
      // var update = attributes["data-update"].value === "true";
      var title = drawedElement.options == undefined ? "Select Type" : update
        ? "Update "
        : "Add New " + attributes["data-title"].value;

      $(this)
        .find(".modal-title")
        .text(title);
    });

    elements.elementModal.selector.on("hidden.bs.modal", function (e) {
      ko.cleanNode(elements.koForms);
      drawedElement.remove();
    });
  },

  init: function () {
    elements = this.elements;
    this.bindFarmDraw();
    this.bindExtensionMethods();
    this.bindCustomScrollBar();
  }
};
