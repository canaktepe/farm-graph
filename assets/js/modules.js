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
        snapGrid: false,
        gridSize: [150, 150]
      },
      rectangle: {
        color: "#9b9b9b",
        selectable: true,
        draggable: true,
        resizable: true
      },
      onDrawComplete(e) {
        if (!e.drawingRect) return;
        farmGraphModule.openModal(false, e, function (item) {
          if (typeof item === "object") e.drawingRect.click();
        });
      },
      onSelectElement(e) {
        var guid = $fg(e).attr("id");
        if (!guid) return;
        vm.selectElement(guid);
        $fg(e).draggable("option", "start", function (event, ui) {
          $fg(this).click();
        });
        $fg(e).draggable("option", "drag", function (event, ui) {
          vm.setElementPosition(event, ui);
        });
        $fg(e).resizable("option", "resize", function (event, ui) {
          guid = $fg(e).attr("id");
          vm.setElementPosition(event, ui);
          vm.selectElement(guid);
        });
        $fg(e).resizable("option", "start", function (event, ui) {
          guid = $fg(e).attr("id");
          vm.selectElement(guid);
        });
      }
    },
    jsonElements: [],
    farm: $fg(".farm"),
    bsSliderFarmZoom: $fg("#bsSliderFarmZoom"),
    ctxMenuSelector: $fg(".context"),
    drawArea: $fg("#draw-area"),
    mainAcceptable: ko.observableArray([8000, 9000, 11000, 12000]),
    redirectModal: {
      selector: $fg('#redirectModal'),
      contentBody: $fg('#redirectContent')
    },
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
      keyboard: {
        enable: true
      },
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

  toggleEditMode: function () {

    //scroll reload
    elements.farm.css('height', '0');
    elements.farm.css('max-height', '0');
    setTimeout(() => {
      elements.farm.css('height', '100%');
      elements.farm.css('max-height', '100%');
    }, 100);

    var editModeEnable = vm.editMode();
    $fg(".rect").draggable({
      disabled: !editModeEnable
    });
    $fg(".rect").resizable({
      disabled: !editModeEnable
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

  setEnableElementsType: function (drct) {
    var parent = $fg(drct.parent).hasClass('rect-name') ? $fg(drct.parent).parent() : $fg(drct.parent);
    var isChild = parent.hasClass("rect");
    var acceptable = elements.mainAcceptable();

    if (isChild) {
      var type = parent.attr("data-type") || parent.data().options.type();
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
            } else {
              formObject
                .find("option[value=" + value + "]")
                .attr("selected", true);
            }
            break;
        }
      }
    });
  },



  getDrawedElementPosition: function (drawedElement) {
    var position = {
      w: 0,
      h: 0,
      x: 0,
      y: 0
    };
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
    position.y = vm.convertToBottomPosition(position);
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

    if (options.formData() && options.formData().NodeName /*device*/ ) {
      var existElement = element.find("div.rect-name");
      if (existElement.length > 0) {
        existElement.text(options.formData().NodeName);
      } else {
        $fg("<div/>", {
            attr: {
              class: "rect-name"
            }
          })
          .text(options.formData().NodeName)
          .appendTo(element);
      }
    }
  },

  openModal: function (update, drct, callback) {
    var drawedElement = drct.drawingRect ? drct.drawingRect : drct;
    var parentNode;

    // off button events
    elements.elementModal.selector.off("shown.bs.modal");
    elements.elementModal.selector.off("hidden.bs.modal");
    elements.elementModal.saveButton.off("click");
    elements.elementModal.nextButton.off("click");
    elements.elementModal.backButton.off("click");
    elements.elementModal.selector.data("saved", false);
    elements.elementModal.selector.data('update', update);

    var element = typeof drawedElement.get === 'function' ? drawedElement.get(0) : drawedElement.position();

    var position = {
      x: element.offsetLeft || element.x,
      y: element.offsetTop || element.y,
      w: element.offsetWidth || element.w,
      h: element.offsetHeight || element.h
    };
    position.y = vm.convertToBottomPosition(position);

    const params = {
      returnUrl: 'FarmGraph.aspx',
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h
    }

    //update elemen redirect with NodeId
    if (update) {
      params.ID = drawedElement.formData().NodeId;
      if (drawedElement.formData().DeviceTypeId)
        params.deviceType = drawedElement.formData().DeviceTypeId;

      if (drawedElement.formData().LocationId)
        params.locationId = drawedElement.formData().LocationId
    } else {
      parentNode = farmGraphModule.getParentNode(drct);
      if (parentNode)
        params.locationId = parseInt(parentNode.formData().NodeId);
    }

    const queryParams = createQueryParams(params);
    elements.elementModal.selector.data('redirectParams', queryParams);

    //modal showing
    elements.elementModal.selector.modal({
      show: true
    });

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
      var options;

      if (update) {
        options = drawedElement;
        options.position(position);
        options.formData(formData);
        vm.setElement(options);
      } else {
        var parentGuid = farmGraphModule.getParentGuid(drawedElement);

        var guid = farmGraphModule.guid();
        drawedElement.options.position(position);

        if (parentNode) {
          formData.locationId = parseInt(parentNode.formData().NodeId);
        }

        drawedElement.options.guid(guid);
        drawedElement.options.parentGuid(parentGuid);
        options = drawedElement.options;
        options.formData(formData);

        vm.pushElement(parentGuid, options);
        drawedElement
          .attr({
            id: guid,
            "data-type": options.type()
          })
          .css({
            backgroundColor: options.color(),
            border: options.border(),
            zIndex: options.zIndex()
          })
          .dblclick(farmGraphModule.elementUpdatedblClick);

        if (options.radius()) drawedElement.addClass('radius');
      }

      if (typeof (options.guid()) == 'string') {
        var oldId = options.guid();
        var newId;

        if (typeof (fm) !== 'undefined') {
          newId = fm.newNodeId();
          options.guid(newId);
        } else {
          options.guid(-1);
        }

        //add items to database
        farmGraphModule.farmDb.AddNodeItem(ko.toJS(options), function (data) {
          if (data) {
            vm.setElementGuid(oldId, data.guid);
            drawedElement.attr('id', data.guid);
            options.guid(data.guid);
            options.formData(data.formData);
            vm.setElement(options);
            farmGraphModule.setElementRectangleNameText(drawedElement, update);
          }
        })
      } else {
        //update the item in the database
        farmGraphModule.farmDb.SetNodeItem(ko.toJS(options), function (data) {
          if (data) {
            farmGraphModule.setElementRectangleNameText(drawedElement, update);
          }
        })
      }
      callback(drawedElement);
    });

    //binding modal next button event
    elements.elementModal.nextButton.on("click", function (e) {
      elements.elementModal.contentBody.html('loading page...');
      if (update) {
        var typeForDbModal = vm.activeElement().type();
        elements.elementModal.selector.data('type', typeForDbModal)

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
      typeForDbModal = selectedType;
      elements.elementModal.selector.data('type', typeForDbModal)

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

      $fg('.spec-btn').remove();
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
        vm.activeElement(null);
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

      farmGraphModule.setEnableElementsType(drct);
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

  getParentNode: function (drawedObject) {
    var node;
    var parent = $fg(drawedObject.parent);
    var guid = parent.attr('id');
    vm.getCreatedElement(guid, function (result) {
      node = result;
    })
    return node;
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
    if (!vm.editMode()) return;
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
          border: data.border(),
          zIndex: data.zIndex(),
          top: (vm.canvasProperties().getHeight() - data.position().y) - data.position().h,
          left: data.position().x,
          width: data.position().w,
          height: data.position().h
        })
        .data('options', data);

      if (data.radius()) elem.addClass('radius');

      callback(elem);
    }

    self.addItem = function (createdItem) {
      // var parent = self.detectPosition(createdItem);
      // if (parent) {
      //   /*   .css({
      //        top: parent.position.y,
      //        left: parent.position.x
      //      })
      //      */

      //   createdItem.appendTo($fg('div.rect[id=' + parent.id + ']'));
      //   createdItem.setElementPosition();

      // } else {
      createdItem.appendTo(farmGraphModule.elements.drawArea);
      // }
    }
  },

  detectPosition: function (createdItem) {
    var options = createdItem.data('options');

    var parent = null;
    var canvasElements = $fg('div.rect').not(createdItem);

    canvasElements.filter(function (i, item) {
      var obj = $fg(item),
        guid = obj.attr('id');

      var position = {
        w: item.offsetWidth,
        h: item.offsetHeight,
        x: item.offsetLeft,
        y: item.offsetTop
      };

      var left_right = {
        start: position.x,
        end: position.x + position.w
      };

      position.b = vm.convertToBottomPosition(position)

      var top_bottom = {
        start: position.b,
        end: position.b + position.h
      }

      if ((options.position().x >= left_right.start && options.position().x <= left_right.end) && (options.position().y >= top_bottom.start && options.position().y <= top_bottom.end)) {
        vm.getCreatedElement(guid, function (response) {
          if (response.type() === farmItemTypes.Location) {
            parent = {
              id: response.formData().NodeId,
              position: farmGraphModule.calcPos(obj)
            };
          }
        })
      }
    })
    return parent;
  },

  getObjectKeyByValue(obj, val) {
    return Object.entries(obj).find(i => i[1] === val);
  },

  calcPos: function (elm) {
    var position = {
        x: parseInt(elm.css("left")),
        y: parseInt(elm.css("top")),
      },
      curr = elm;
    while (curr.parent().is('.rect')) {
      curr = curr.parent();
      position.x -= parseInt(curr.css("left"));
      position.y -= parseInt(curr.css("top"));
    }
    return position;
  },

  redirectForm: function (page, exParams) {
    var redirectParams = farmGraphModule.elements.elementModal.selector.data('redirectParams');
    var src = page + '?' + redirectParams;
    if (exParams) src = src + '&' + exParams;
    farmGraphModule.formOpenDialog(src, function () {
      farmGraphModule.elements.elementModal.selector.modal("hide");
    })
  },

  formOpenDialog: function (src, callback) {
    windowManager.ShowModalDialog(src,
      'Add Item',
      null,
      'Height:560px;Width:900px;Border:thick;AutoCenter:yes',
      farmGraphModule.formCloseCallBack);
    setTimeout(() => {
      callback();
    }, 1000);
  },

  formCloseCallBack: function (sender, args) {
    farmGraphModule.elements.elementModal.selector.modal("hide");
    if (!args) return;

    if (args.device) {
      setTimeout(() => {
        farmGraphModule.formOpenDialog(args.url, function () {
          farmGraphModule.elements.elementModal.selector.modal("hide");
        })
      }, 500);
    } else {
      var url = args.url || args;
      if (!url) return;
      location.href = url;
    }
  },

  formDeviceCallBack: function (sender, args) {
    farmGraphModule.elements.elementModal.selector.modal("hide");
    if (!args) return;
    var url = args.url || args;
    if (!url) return;
    location.href = url;
  },

  bindDbData: function (JSONData, parentObj) {
    if (JSONData == null) return;
    var dbModel = new farmGraphModule.dataBindModel();
    var click = {
      x: 0,
      y: 0
    };
    $fg.each(JSONData, function (i, data) {
      dbModel.createItem(data, function (createdItem) {
        if (createdItem) {
          dbModel.addItem(createdItem);
          createdItem.dblclick(farmGraphModule.elementUpdatedblClick)
            .click(farmGraphModule.elementSelectClick)
            .draggable({
              containment: "parent",
              //  grid: elements.farmDrawPluginOptions.canvas.gridSize,
              start: function (event, ui) {
                $fg(this).click();
                click.x = event.clientX;
                click.y = event.clientY;
              },
              drag: function (event, ui) {
                vm.setElementPosition(event, ui);
              }
            });

          if (data.resizable()) {
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-nw",
              attr: {
                id: "nwgrip"
              }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-ne",
              attr: {
                id: "negrip"
              }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-sw",
              attr: {
                id: "swgrip"
              }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-se",
              attr: {
                id: "segrip"
              }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-n",
              attr: {
                id: "ngrip"
              }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-e",
              attr: {
                id: "egrip"
              }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-s",
              attr: {
                id: "sgrip"
              }
            }).appendTo(createdItem);
            $fg("<div>", {
              class: "ui-resizable-handle ui-resizable-w",
              attr: {
                id: "wgrip"
              }
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
              // grid: elements.farmDrawPluginOptions.canvas.gridSize,
              start: function (event, ui) {
                $fg(this).click();
              },
              resize: function (event, ui) {
                var guid = $fg(ui.helper).attr("id");
                vm.setElementPosition(event, ui);
                vm.selectElement(guid);
              }
            });
          }
          createdItem.options = data;
          farmGraphModule.setElementRectangleNameText(createdItem, false);
        }
      })
    })
  },
  validationFarmGraph: function () {
    farmGraphModule.farmDb.FarmGraphDimensionValidation(function (data) {
      if (data.Error) {
        var error_msg = $fg('<ul>');
        $fg.each(data.DimensionValidationItems, function (i, validationItem) {
          $fg('<li>')
            .text(validationItem.Message)
            .appendTo(error_msg);
        })
        windowManager.ShowMessageBox('Farm Graph Validation Error', error_msg.html());
      }
    })
  },
  unsavedChangedCallback: function (sender, args) {
    var save = args === 'YES';
    if (!save) return;

    var unsavedObjects = vm.getUnsavedChangeObjects();
    if (unsavedObjects.length > 0) {
      $fg.each(unsavedObjects, function (i, item) {
        vm.activeElementWrite(item.guid());
      })
    }
    setTimeout(() => {
      farmGraphModule.validationFarmGraph();
    }, 500);
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
        if (vm.editMode() == false)
          return false;

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
    this.validationFarmGraph();

    this.toggleEditMode();

    window.addEventListener('beforeunload', function onBeforeUnload(e) {
      var unsavedObjects = vm.getUnsavedChangeObjects();
      if (unsavedObjects.length > 0) {
        setTimeout(() => {
          windowManager.ShowConfirmation("Unsaved Changes", "<p>There are unsaved changes!</p> <p>Do you want to save changes?</p>", farmGraphModule.unsavedChangedCallback);
        }, 500);

        // Dialog text doesn't really work in Chrome.
        const dialogText = 'A dialog text when leaving the page';
        e.returnValue = dialogText;
        return dialogText;
      }
    });
  }
};