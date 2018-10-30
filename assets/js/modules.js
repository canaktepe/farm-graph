
var elements;
farmGraphModule = {
  farmDb: new farmDbModel(),
  elements: {
    farmDrawPluginOptions: {
      drawNewButton: "#draw",
      canvas: {
        width: 3000,
        height: 2000,
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
        if (!e.drawingRect) return;
        farmGraphModule.openModal(false, e.drawingRect, function (item) {
          if (typeof item === "object") {
            e.drawingRect.click();
          }
        });
      },
      onSelectElement(e) {
        var guid = $fg(e).attr("id");
        vm.selectElement(guid);

        $fg(e).draggable("option", "start", function (event, ui) {
          $fg(this).click();
        });
        $fg(e).draggable("option", "stop", function (event, ui) {
          var newPos = vm.setElementAbsolutePosition(ui);
          $fg(this).css({ top: newPos.relative.y, left: newPos.relative.x });
        });
        $fg(e).draggable("option", "drag", function (event, ui) {
          vm.setElementPosition(ui);
        });
        $fg(e).resizable("option", "resize", function (event, ui) {
          guid = $fg(e).attr("id");
          vm.setElementPosition(ui.size);
          vm.selectElement(guid);
        });
        $fg(e).resizable("option", "start", function (event, ui) {
          guid = $fg(e).attr("id");
          vm.selectElement(guid);
        });
        $fg(e).resizable("option", "stop", function (event, ui) {
          var newPos = vm.setElementPosition(ui.position);
          $fg(this).css({ top: newPos.y, left: newPos.x });
        });
      }
    },
    jsonElements: [],
    farm: $fg(".farm"),
    bsSliderFarmZoom: $fg("#bsSliderFarmZoom"),
    ctxMenuSelector: $fg(".context"),
    drawArea: $fg("#draw-area"),
    mainAcceptable: ko.observableArray([9000]),
    elementModal: {
      selector: $fg("#elementModal"),
      typesBody: $fg("#modalBodyTypes"),
      contentBody: $fg("#modalBodyContent"),
      saveButton: $fg("#saveElement"),
      nextButton: $fg("#nextStep"),
      backButton: $fg("#backStep")
    },
    activeClass: "active"
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

    Object.defineProperty(Object.prototype, "setElementPosition", {
      value: function setElementPosition() {
        var options = this.data('options');

        var position = {
          left: options.position.x,
          top: options.position.y
        };


        var parents = $fg.grep(this.parents(), function (parent) {
          if ($fg(parent).hasClass('rectangle')) {
            position.left -= parseInt($fg(parent).css("left")),
              position.top -= parseInt($fg(parent).css("top"))
          }
        })
        this.css(position)

      },
      writable: true,
      configurable: true
    });
  },

  bindFarmDraw: function () {
    elements.drawArea.farmDraw(elements.farmDrawPluginOptions);
  },

  elementUpdatedblClick: function (e) {
    var clickedElement = $fg(e.currentTarget);
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
    $fg.each(data.formData(), function (key, value) {
      var formObject = $fg("form#controlData [name=" + key + "]");
      if (formObject.length > 0) {
        var tagName = formObject[0].tagName.toLowerCase();
        switch (tagName) {
          case "input":
            var type = formObject.attr("type").toLowerCase();
            switch (type) {
              case "text":
                formObject.val(value);
                break;
              case "hidden":
                formObject.val(value);
                break;
              case "radio":
                formObject
                  .filter("[value=" + value + "]")
                  .attr("checked", true);
                break;
              case "checkbox":
                value.filter((v, vi) => {
                  formObject.filter((foi, fo) => {
                    if (v == $fg(fo).val()) {
                      $fg(fo).attr("checked", true);
                    }
                  });
                });
                break;
            }
            break;
          case "select":
            var multiple = typeof formObject.attr("multiple") !== "undefined";
            if (multiple) {
              $fg.each(value, function (i, e) {
                formObject
                  .find("option[value=" + e + "]")
                  .attr("selected", true);
              });
            } else
              formObject
                .find("option[value=" + value + "]")
                .attr("selected", true);
            break;
        }
      }
    });
  },

  calcRalativeToAbsolutePosition: function (elm) {
    var offset = { x: parseInt(elm.css("left")), y: parseInt(elm.css("top")), w: parseInt(elm.css("width")), h: parseInt(elm.css("height")) },
      curr = elm;
    while (curr.parent().is('.rect')) {
      curr = curr.parent();
      offset.x += parseInt(curr.css("left"));
      offset.y += parseInt(curr.css("top"));
    }
    return offset;
  },

  getDrawedElementPosition: function (drawedElement) {
    var position = { w: 0, h: 0, x: 0, y: 0 };
    if (drawedElement.options) {
      position.w = parseInt(drawedElement.css("width"));
      position.h = parseInt(drawedElement.css("height"));
      position.x = parseInt(drawedElement.css("left"));
      position.y = parseInt(drawedElement.css("top"));
    } else {
      var savedElement = $fg("div[id=" + drawedElement.guid() + "]");
      if (savedElement) {
        position.w = parseInt(savedElement.css("width"));
        position.h = parseInt(savedElement.css("height"));
        position.x = parseInt(savedElement.css("left"));
        position.y = parseInt(savedElement.css("top"));
      }
    }
    return position;
  },

  setElementRectangleNameText: function (el, update) {
    var element;
    if (update) {
      element = $fg("div.rect[id='" + el.guid() + "']");
      element.options = el;
    } else {
      element = el;
    }

    var options = element.options;
    if (options.formData().Name && options.type() == 3 /*device*/) {
      var existElement = element.find("div.rect-name");
      if (existElement.length > 0) {
        existElement.text(options.formData().Name);
      } else {
        $fg("<div/>", { attr: { class: "rect-name" } })
          .text(options.formData().Name)
          .appendTo(element);
      }
    }
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
      var formData = $fg("form#controlData")
        .serializeArray()
        .reduce(function (m, o) {
          var formObject = $fg("form#controlData [name=" + o.name + "]");
          var tagName = formObject[0].tagName.toLowerCase();

          var value = "";
          switch (tagName) {
            case "input":
              var type = formObject.attr("type");
              switch (type) {
                case "text":
                  value = o.value;
                  break;
                case "radio":
                  value = o.value;
                  break;
                case "hidden":
                  value = o.value;
                  break;
                case "checkbox":
                  value = [];
                  $fg.each(formObject.filter(":checked"), function (i, e) {
                    value.push($fg(e).val());
                  });
                  break;
              }
              break;
            case "select":
              var multiple = typeof formObject.attr("multiple") !== "undefined";
              if (multiple) {
                value = [];
                $fg.each(formObject.find("option:selected"), function (i, e) {
                  value.push($fg(e).val());
                });
              } else value = o.value;
              break;
          }
          m[o.name] = value;
          return m;
        }, {});

      var position = farmGraphModule.getDrawedElementPosition(drawedElement);
      var absolutePosition = farmGraphModule.calcRalativeToAbsolutePosition(drawedElement);

      var options;
      if (update) {
        options = drawedElement;
        options.position(position);
        options.absolutePosition(absolutePosition);
        options.formData(formData);
        vm.setElement(options);
      } else {
        var parentGuid = farmGraphModule.getParentGuid(drawedElement);

        var guid = farmGraphModule.guid();
        drawedElement.options.position(position);
        drawedElement.options.absolutePosition(absolutePosition);
        drawedElement.options.guid(guid);
        drawedElement.options.parentGuid(parentGuid);
        options = drawedElement.options;
        options.formData(formData);

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
      farmGraphModule.setElementRectangleNameText(drawedElement, update);

      callback(drawedElement);
    });

    //binding modal next button event
    elements.elementModal.nextButton.on("click", function (e) {
      if (update) {
        elements.elementModal.contentBody.load(
          process.env.FORMS_PATH + drawedElement.pageTemplate(),
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

      var selectedType = $fg('input[name="farmCheckBox"]:checked').val();
      var elementOptions = vm.getTypeOptions(selectedType);

      if (!elementOptions) return;

      console.log("insert mode");
      drawedElement.options = elementOptions;
      var pageTemplate = drawedElement.options.pageTemplate();
      elements.elementModal.contentBody.load(
        process.env.FORMS_PATH + pageTemplate,
        function (responseText, textStatus, XMLHttpRequest) {
          if (XMLHttpRequest.status == 200) {
            elements.elementModal.selector
              .find(".modal-title")
              .text("Add New " + drawedElement.options.name());
            $fg("form#controlData input:first").focus();
          } else if (XMLHttpRequest.status == 404) {
            console.log(pageTemplate + " Page Not Found");
            elements.elementModal.selector.modal("hide");
            drawedElement.remove();
          }
        }
      );

      //show back, hide next button
      $fg(this).hide();
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
      $fg(this).hide();
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

  bindJsonElements: function (callback) {
    $fg
      .getJSON(process.env.DEVICES_PATH)
      .done(function (data) {
        farmGraphModule.elements.jsonElements = data;
        callback(data);
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
    var obj = $fg(e.currentTarget);
    $fg(".rect.active").removeClass("active");
    $fg(this).addClass(elements.activeClass);
    var guid = obj.attr("id");
    vm.selectElement(guid);
    e.stopPropagation();
  },

  dataBindModel: function () {
    var self = this;
    self.createItem = function (data, callback) {

      var elem = $fg('<div>', {
        attr: {
          id: data.guid()
        }
      })
        .addClass('rect')
        .css({
          backgroundColor: data.color(),
          top: data.position().y,
          left: data.position().x,
          width: data.position().w,
          height: data.position().h
        })
        .text(data.name())
        .data('options', data)
      callback(elem);
    }

    self.addItem = function (createdItem) {
      var parent = self.detectPosition(createdItem);
      if (parent) {
        /*   .css({
             top: parent.position.y,
             left: parent.position.x
           })
           */


        createdItem.appendTo($fg('div.rect[id=' + parent.id + ']'));
        createdItem.setElementPosition();

      } else {
        createdItem.appendTo(farmGraphModule.elements.drawArea);
      }
    }

    self.detectPosition = function (createdItem) {


      var options = createdItem.data('options');
      var parent = null;
      var canvasElements = $fg('div.rect').not(createdItem);

      console.log(canvasElements);


      canvasElements.filter(function (i, item) {

        var left_right = {
          start: item.offsetLeft,
          end: item.offsetLeft + item.offsetWidth
        };

        var top_bottom = {
          start: item.offsetTop,
          end: item.offsetTop + item.offsetHeight
        }

        if ((options.position().x >= left_right.start && options.position().x <= left_right.end) && (options.position().y >= top_bottom.start && options.position().y <= top_bottom.end)) {
          parent = {
            id: $fg(item).attr('id'),
            position: self.calcPos($fg(item))
          };
        }

      })
      return parent;
    }

    self.calcPos = function (elm) {
      var position = {
        x: parseInt(elm.css("left")),
        y: parseInt(elm.css("top")),
      },
        curr = elm;
      while (curr.parent().is('.rectangle')) {
        curr = curr.parent();
        position.x -= parseInt(curr.css("left"));
        position.y -= parseInt(curr.css("top"));
      }
      return position;
    }
  },

  bindDbData: function (JSONData, parentObj) {
    if (JSONData == null) return;
    var dbModel = new farmGraphModule.dataBindModel();
    $fg.each(JSONData, function (i, data) {
      dbModel.createItem(data, function (createdItem) {
        if (createdItem) {
          dbModel.addItem(createdItem);
          createdItem.dblclick(farmGraphModule.elementUpdatedblClick)
            .click(farmGraphModule.elementSelectClick)
            .draggable({
              containment: "parent",
              grid: elements.farmDrawPluginOptions.canvas.gridSize,
              start: function (event, ui) {
                $fg(this).click();
              },
              drag: function (event, ui) {
                // var zoom = farmGraphModule.elements.drawArea.farmDraw.getZoom();
                // var original = ui.originalPosition;
                // ui.position = {
                //     left: (event.clientX - click.x + original.left) / zoom,
                //     top:  (event.clientY - click.y + original.top ) / zoom
                // };
                vm.setElementAbsolutePosition(ui);
              },
              stop: function (event, ui) {
                var newPos = vm.setElementAbsolutePosition(ui);
                $fg(this).css({ top: newPos.relative.y, left: newPos.relative.x });
              }
            });

          if (data.resizable()) {
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-nw",
              attr: { id: "nwgrip" }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-ne",
              attr: { id: "negrip" }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-sw",
              attr: { id: "swgrip" }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-se",
              attr: { id: "segrip" }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-n",
              attr: { id: "ngrip" }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-e",
              attr: { id: "egrip" }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-s",
              attr: { id: "sgrip" }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-w",
              attr: { id: "wgrip" }
            }).appendTo(createdItem);
            createdItem.resizable({
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
                var guid = $fg(ui.helper).attr("id");
                vm.setElementPosition(ui.size);
                vm.selectElement(guid);
              },
              stop: function (event, ui) {
                var newPos = vm.setElementPosition(ui.position);
                $fg(this).css({ top: newPos.y, left: newPos.x });
              }
            });
          }
        }
      })
    })

    // $fg.each(JSONData, function (i, elem) {
    //   var elementModel = new jsonToModel(ko.toJS(elem));
    //   var el = $fg("<div />")
    //     .attr({ id: elementModel.guid(), "data-type": elementModel.id() })
    //     .css({
    //       backgroundColor: elementModel.color(),
    //       width: elementModel.position().w,
    //       height: elementModel.position().h,
    //       top: elementModel.position().y,
    //       left: elementModel.position().x
    //     })
    //     .addClass("rect")
    //     .dblclick(farmGraphModule.elementUpdatedblClick)
    //     .click(farmGraphModule.elementSelectClick)
    //     .draggable({
    //       containment: "parent",
    //       grid: elements.farmDrawPluginOptions.canvas.gridSize,
    //       start: function (event, ui) {
    //         $fg(this).click();
    //       },
    //       drag: function (event, ui) {
    //         // var zoom = farmGraphModule.elements.drawArea.farmDraw.getZoom();
    //         // var original = ui.originalPosition;
    //         // ui.position = {
    //         //     left: (event.clientX - click.x + original.left) / zoom,
    //         //     top:  (event.clientY - click.y + original.top ) / zoom
    //         // };
    //         vm.setElementAbsolutePosition(ui);
    //       },
    //       stop: function (event, ui) {
    //         var newPos = vm.setElementAbsolutePosition(ui);
    //         $fg(this).css({ top: newPos.relative.y, left: newPos.relative.x });
    //       }
    //     });

    //   if (elem.resizable) {
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-nw",
    //       attr: { id: "nwgrip" }
    //     }).appendTo(el);
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-ne",
    //       attr: { id: "negrip" }
    //     }).appendTo(el);
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-sw",
    //       attr: { id: "swgrip" }
    //     }).appendTo(el);
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-se",
    //       attr: { id: "segrip" }
    //     }).appendTo(el);
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-n",
    //       attr: { id: "ngrip" }
    //     }).appendTo(el);
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-e",
    //       attr: { id: "egrip" }
    //     }).appendTo(el);
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-s",
    //       attr: { id: "sgrip" }
    //     }).appendTo(el);
    //     $fg("<div>", {
    //       class: "ui-resizable-handle ui-resizable-w",
    //       attr: { id: "wgrip" }
    //     }).appendTo(el);
    //     el.resizable({
    //       handles: {
    //         nw: "#nwgrip",
    //         ne: "#negrip",
    //         sw: "#swgrip",
    //         se: "#segrip",
    //         n: "#ngrip",
    //         e: "#egrip",
    //         s: "#sgrip",
    //         w: "#wgrip"
    //       },
    //       minWidth: 30,
    //       minHeight: 30,
    //       containment: "parent",
    //       autoHide: true,
    //       grid: elements.farmDrawPluginOptions.canvas.gridSize,
    //       resize: function (event, ui) {
    //         var guid = $fg(ui.helper).attr("id");
    //         vm.setElementPosition(ui.size);
    //         vm.selectElement(guid);
    //       },
    //       stop: function (event, ui) {
    //         var newPos = vm.setElementPosition(ui.position);
    //         $fg(this).css({ top: newPos.y, left: newPos.x });
    //       }
    //     });

    //     if (parentObj == null) farmGraphModule.elements.drawArea.append(el);
    //     else parentObj.append(el);


    //     farmGraphModule.setElementRectangleNameText(elementModel, true);

    //     if (elementModel.children().length > 0) {
    //       farmGraphModule.bindDbData(elementModel.children(), el);
    //     }
    //   }
    // });
  },
  bootstrapSlider: function () {
    var slider = elements.bsSliderFarmZoom.bootstrapSlider({
      formatter: function (value) {
        vm.canvasProperties().zoom(value);
        $fg(".farm-draw-zone").css({
          zoom: value + "%",
          "-moz-transform": "scale(" + value / 100 + ")",
          "-webkit-transform-origin": "top left"
        });
        return value;
      }
    });
  },

  contextMenu: function () {
    elements.ctxMenuSelector.contextmenu({
      before: function (e, context) {
        this.$element
          .find(".rect")
          .on("click.context.data-api", $fg.proxy(this.closemenu, this));
        var target = $fg(e.target);

        target.click();
        if (!target.hasClass("rect")) {
          $fg("#context-menu")
            .find(".dropdown-item:not([id]),.dropdown-divider")
            .hide();
        } else {
          $fg("#context-menu")
            .children()
            .show();
        }
      },
      onItem: function (context, e) {
        var target = $fg(e.currentTarget);
        if (target.attr("id")) {
          var id = target.attr("id");
          switch (id) {
            case "ddlDrawNewItem":
              $fg(elements.farmDrawPluginOptions.drawNewButton).click();
              break;
          }
        }
      }
    });
  },


  init: function (jsonData) {
    elements = this.elements;

    this.bindFarmDraw();
    this.bindExtensionMethods();
    this.bindDbData(jsonData, null);



    this.bootstrapSlider();
    this.contextMenu();
    this.bindCustomScrollBar();
  }
};
