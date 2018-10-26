canvasModel = function (data) {
    var self = this;
    self.zoom = ko.observable(data.zoom);
    self.width = ko.observable(data.width);
    self.height = ko.observable(data.height);

    self.getWidth = ko.computed({
        read: function () {
            return self.width();
        },
        write: function (value) {
            self.width(parseInt(value));
        }
    });
    self.getHeight = ko.computed({
        read: function () {
            return self.height();
        },
        write: function (value) {
            self.height(parseInt(value));
        }
    });
};

routingTypeModel = function (data) {
    var self = this;
    self.id = ko.observable(data.id);
    self.type = ko.observable(data.type);
};

const routingTypes = [
    new routingTypeModel({ id: 1, type: "Routing" }),
    new routingTypeModel({ id: 2, type: "Routing (DDS)" })
];

routingModel = function (prop) {
    var self = this;
    self.id = ko.observable(prop.id);
    self.from = ko.observable(prop.from);
    self.to = ko.observable(prop.to);
    self.isDefault = ko.observable(prop.isDefault);
    self.isDeleted = ko.observable(prop.isDeleted);
};

jsonToModel = function (data) {
    var self = this;
    self.parentGuid = ko.observable(data.parentGuid);
    self.acceptable = ko.observable(data.acceptable);
    self.children = ko.observableArray();
    if (data.children) {
        if (data.children.length > 0) {
            $fg.each(data.children, function (i, item) {
                self.children.push(new jsonToModel(item));
            });
        }
    }
    self.color = ko.observable(data.color);
    self.formData = ko.observable(data.formData);
    self.guid = ko.observable(data.guid);
    self.id = ko.observable(data.id);
    self.name = ko.observable(data.name);
    self.order = ko.observable(data.order);
    self.pageTemplate = ko.observable(data.pageTemplate);
    self.position = ko.observable(data.position);
    self.absolutePosition = ko.observable(data.absolutePosition);
    self.resizable = ko.observable(data.resizable);
    self.status = ko.observable(data.status);
    self.type = ko.observable(data.type);
    self.routingEnabled = ko.observable(
        data.routingEnabled || { input: false, output: false }
    );

    if (self.routingEnabled().output) {
        self.routings = ko.observableArray([]);
        self.routingType = data.routingType
            ? ko.observable(new routingTypeModel(data.routingType))
            : ko.observable(routingTypes[0]);
        if (data.routings) {
            if (data.routings.length > 0) {
                $fg.each(data.routings, function (i, item) {
                    self.routings.push(
                        new routingModel({
                            id: item.id,
                            from: data.guid,
                            to: item.to,
                            isDefault: item.isDefault,
                            isDeleted: item.isDeleted
                        })
                    );
                });
            }
        }
    }
};

var jsonData = [];

console.log('x'),
farmGraphModule.bindJsonElements(function (jsonResponse) {
    console.log('a')
    farmGraphModule.farmDb.getFarmItems(jsonResponse, function (data) {
        jsonData = data;

        if (jsonData.length > 0) {
            jsonData = jsonData.map(function (item) {
                return new jsonToModel(item);
            });
        }

        console.log(jsonData);

        ko.bindingHandlers.directionName = {
            update: function (element, valueAccessor) {
                var index = ko.utils.unwrapObservable(valueAccessor());
                var ldnDirections = [1, 2, 3, 4];
                var ddsDirections = ["L", "R", "LR", "LL", "RL", "RR"];

                //this part using for routing scroller
                var parent = $fg(element).parent();
                parent.find(".dropdown-toggle").off("click");
                parent.find(".dropdown-toggle").on("click", function (e) {
                    if ($fg(this).attr("aria-expanded") == "true") return;
                    parent.find(".dropdown-scroller").mCustomScrollbar({
                        scrollbarPosition: "outside"
                    });
                    e.preventDefault();
                });
                //this part using for routing scroller end

                var directionName;
                if (
                    vm
                        .activeElement()
                        .routingType()
                        .id() == 1
                ) {
                    directionName = ldnDirections[index];
                    if (!directionName)
                        $fg(element)
                            .parent()
                            .remove();
                } else if (
                    vm
                        .activeElement()
                        .routingType()
                        .id() == 2
                )
                    directionName = ddsDirections[index];

                $fg(element).text(directionName);
            }
        };

        ko.bindingHandlers.routingSetDefault = {
            init: function (element, valueAccessor) {
                var data = ko.utils.unwrapObservable(valueAccessor());
                ko.utils.arrayFilter(vm.activeElement().routings(), function (route) {
                    if (data.from() == route.from() && data.isDefault()) {
                        $fg(element).attr("checked", true);
                    }
                });

                $fg(element).on("click", function () {
                    return ko.utils.arrayFilter(vm.activeElement().routings(), function (
                        route
                    ) {
                        route.isDefault(false);
                        if (route.id() == data.id()) route.isDefault(true);
                    });
                });
            }
        };

        ko.bindingHandlers.hoverToggle = {
            init: function (
                element,
                valueAccessor,
                allBindings,
                viewModel,
                bindingContext
            ) {
                var guid = valueAccessor();
                if (ko.isObservable(guid)) guid = guid();
                var showObj = $fg("div.rect[id=" + guid + "]");

                ko.utils.registerEventHandler(element, "mouseover", function () {
                    ko.utils.toggleDomNodeCssClass(
                        element,
                        ko.utils.unwrapObservable("bg-light"),
                        true
                    );
                    showObj.addClass("show-route");
                });
                ko.utils.registerEventHandler(element, "mouseout", function () {
                    ko.utils.toggleDomNodeCssClass(
                        element,
                        ko.utils.unwrapObservable("bg-light"),
                        false
                    );
                    showObj.removeClass("show-route");
                });
                ko.utils.registerEventHandler(element, "click", function () {
                    ko.utils.toggleDomNodeCssClass(
                        element,
                        ko.utils.unwrapObservable("bg-light"),
                        false
                    );
                    showObj.removeClass("show-route");
                });
            }
        };

        viewModel = function () {
            var self = this;

            self.devices = ko.observableArray([]);
            self.physicals = ko.observableArray([]);
            self.objects = ko.observableArray([]);

            self.createdElements = ko.observableArray(jsonData);
            self.activeElement = ko.observable(null);
            // self.selectedRoutingElement = ko.observable(null);
            self.searchElementKeyword = ko.observable("");
            self.filteredCreatingElementsByRoutable = ko.observableArray([]);
            self.canvasProperties = ko.observable(
                new canvasModel({
                    zoom: 50,
                    width: farmGraphModule.elements.farmDrawPluginOptions.canvas.width,
                    height: farmGraphModule.elements.farmDrawPluginOptions.canvas.height
                })
            );
            self.textColor = ko.observable();

            self.routingTypes = ko.observableArray(routingTypes);

            // self.selectedRoutingType = ko.observable(self.routingTypes()[0]);
            self.changeRoutingType = function (routingType) {
                if (typeof routingType == "undefined")
                    routingType = self.routingTypes()[0];

                // self.selectedRoutingType(routingType);
                self.routingButtonVisible();

                var activeElement = self.activeElement();
                activeElement.routingType(routingType);

                if (routingType === self.routingTypes()[0] /*ldn*/) {
                    var activeElementRoutings = self.activeElement().routings();

                    if (activeElementRoutings.length > 4) {
                        var removeSize = activeElementRoutings.length - 4;

                        var start = activeElementRoutings.length - removeSize;

                        self
                            .activeElement()
                            .routings()
                            .splice(start, removeSize);
                    }
                }
            };

            self.selectRoutingElement = function (data) {
                var $this = this;
                return ko.utils.arrayFilter(self.activeElement().routings(), function (
                    route
                ) {
                    if (route.id() == data.id()) {
                        route.to({
                            guid: $this.guid(),
                            name: $this.formData().Name
                        });
                    }
                });
            };

            self.newRoutingVisible = ko.observable(true);

            //routing add button visibility function
            self.routingButtonVisible = function () {
                var activeElement = self.activeElement();
                if (!activeElement.routings) return;

                var ldnSize = 4,
                    ddsSize = 6,
                    selectedRtType = activeElement.routingType().id(),
                    routingCount = ko.utils.arrayFilter(activeElement.routings(), function (
                        route
                    ) {
                        return route.isDeleted() == false;
                    }).length;

                if (
                    (selectedRtType == 1 && routingCount >= ldnSize) ||
                    (selectedRtType == 2 && routingCount >= ddsSize)
                )
                    self.newRoutingVisible(false);
                else self.newRoutingVisible(true);
            };

            // self.getRoutingMaxID = function () {
            //   var activeElement = self.activeElement();
            //   return Math.max.apply(Math, activeElement.routings().map(function (o) { return o.id() })) + 1;
            // }

            self.addNewRouting = function () {
                var activeElement = self.activeElement();
                if (!activeElement) return;

                // var maxId = self.getRoutingMaxID();

                var deletedRouting = $fg.grep(activeElement.routings(), function (
                    route,
                    i
                ) {
                    return route.isDeleted() == true;
                })[0];

                var to = {
                    guid: "",
                    name: ""
                };

                if (deletedRouting) {
                    deletedRouting.to(to);
                    deletedRouting.isDefault(false);
                    deletedRouting.isDeleted(false);
                    self.routingButtonVisible();
                    return;
                }

                activeElement.routings.push(
                    new routingModel({
                        id: farmGraphModule.guid(),
                        from: activeElement.guid(),
                        to: to,
                        isDefault: false,
                        isDeleted: false
                    })
                );
                self.routingButtonVisible();
            };

            self.removeRouting = function () {
                var $this = this;
                // self.activeElement().routings.remove($this);
                ko.utils.arrayFilter(self.activeElement().routings(), function (route) {
                    if ($this.id() == route.id()) route.isDeleted(true);
                });
                self.routingButtonVisible();
            };

            // self.RoutingSelectableElements = ko.computed(function () {
            //   if (self.activeElement() == null) return;
            //   if(!self.activeElement().routingEnabled()) return;

            //   self.filteredCreatingElementsByRoutable([]);
            //   var filter = self.searchElementKeyword();

            //   var routeableElements = self.createdElements();
            //   if(self.activeElement().routingType().id()===self.routingTypes()[0].id()/*ldn*/){
            //       console.log('routeable ldn');
            //   }
            //   else if(self.activeElement().routingType().id()===self.routingTypes()[1].id()/*dds*/){
            //     console.log('routeable dds')
            //   }

            //   routeableElements.some(function iter(o, i, a) {
            //     if (o !== self.activeElement() && self.activeElement().routingEnabled()) {
            //       var hasRoute =
            //         ko.utils.arrayFilter(self.activeElement().routings(), function (
            //           item
            //         ) {
            //           return item.to().guid === o.guid()
            //             && item.isDeleted() === false;
            //         }).length > 0;

            //       if (hasRoute == false)
            //         self.filteredCreatingElementsByRoutable.push(o);
            //     }

            //     var children =
            //       typeof o.children === "function" ? o.children() : o.children;
            //     return children && children.some(iter);
            //   });

            //   if (filter) {
            //     self.filteredCreatingElementsByRoutable(
            //       ko.utils.arrayFilter(
            //         self.filteredCreatingElementsByRoutable(),
            //         function (item) {
            //           return (
            //             item
            //               .formData()
            //               .Name.toLowerCase()
            //               .indexOf(filter.toLowerCase()) > -1
            //           );
            //         }
            //       )
            //     );
            //   }
            // });

            self.setDefaultRouting = function (data) {
                return ko.utils.arrayFilter(self.activeElement().routings(), function (
                    route
                ) {
                    route.isDefault(false);
                    if (route.id() == data.id()) {
                        route.isDefault(true);
                    }
                });
            };

            self.getActiveElement = ko.pureComputed(
                {
                    read: function () {
                        return self.activeElement()
                            ? self.activeElement()
                            : {
                                name: "Not Selected",
                                position: ko.observable({ x: 0, y: 0, w: 0, h: 0 }),
                                absolutePosition: ko.observable({ x: 0, y: 0, w: 0, h: 0 })
                            };
                    },
                    write: function () {
                        var positionToSnap = farmGraphModule.elements.drawArea.farmDraw.snapToGrid(
                            self.activeElement().position().x,
                            self.activeElement().position().y,
                            self.activeElement().position().w,
                            self.activeElement().position().h
                        );
                        var absolutePositionToSnap = farmGraphModule.elements.drawArea.farmDraw.snapToGrid(
                            self.activeElement().absolutePosition().x,
                            self.activeElement().absolutePosition().y,
                            self.activeElement().position().w,
                            self.activeElement().position().h
                        );
                        self.activeElement().position(positionToSnap);
                        self.activeElement().absolutePosition(absolutePositionToSnap);

                        //set canvas element position
                        $fg("div[id=" + self.activeElement().guid() + "]").css({
                            width: self.activeElement().position().w,
                            height: self.activeElement().position().h,
                            top: self.activeElement().position().y,
                            left: self.activeElement().position().x
                        });
                        localStorage.setItem("JSONData", ko.toJSON(self.createdElements()));
                    }
                },
                viewModel
            );

            self.setElementPosition = function (pos) {
                pos = {
                    left:
                        typeof pos.left == "number"
                            ? pos.left
                            : self.getActiveElement().position().x,
                    top:
                        typeof pos.top == "number"
                            ? pos.top
                            : self.getActiveElement().position().y,
                    width:
                        typeof pos.width == "number"
                            ? pos.width
                            : self.getActiveElement().position().w,
                    height:
                        typeof pos.height == "number"
                            ? pos.height
                            : self.getActiveElement().position().h
                };

                pos = farmGraphModule.elements.drawArea.farmDraw.snapToGrid(
                    pos.left,
                    pos.top,
                    pos.width,
                    pos.height
                );

                self.getActiveElement().position(pos);

                return pos;
            };

            self.setElementAbsolutePosition = function (ui) {

                var offsetAbsolute = farmGraphModule.calcRalativeToAbsolutePosition(ui.helper);

                var absolutePos = {
                    left:
                        typeof offsetAbsolute.x == "number"
                            ? offsetAbsolute.x
                            : self.getActiveElement().absolutePosition().x,
                    top:
                        typeof offsetAbsolute.y == "number"
                            ? offsetAbsolute.y
                            : self.getActiveElement().absolutePosition().y,
                    width:
                        typeof offsetAbsolute.w == "number"
                            ? offsetAbsolute.w
                            : self.getActiveElement().absolutePosition().w,
                    height:
                        typeof offsetAbsolute.h == "number"
                            ? offsetAbsolute.h
                            : self.getActiveElement().absolutePosition().h
                };

                absolutePos = farmGraphModule.elements.drawArea.farmDraw.snapToGrid(
                    absolutePos.x,
                    absolutePos.y,
                    absolutePos.w,
                    absolutePos.h
                );

                var relativePos = self.setElementPosition(ui.position);
                self.getActiveElement().absolutePosition(offsetAbsolute);

                return { relative: relativePos, absolute: absolutePos };
            };

            self.setEnable = function (acceptable) {
                var data = self
                    .devices()
                    .concat(self.physicals())
                    .concat(self.objects());

                ko.utils.arrayForEach(data, function (el) {
                    ko.utils.arrayFilter(acceptable, function (acc) {

                        if (acc == el.id()) {
                            el.status(true);
                        }
                    });
                });
                return true;
            };

            self.deleteElement = function () {
                var activeElement = self.activeElement();

                removeAllRoutingRelations = function (item) {
                    if (!item.routingEnabled().output) return;

                    if (item.routings().length > 0) {
                        var ruleForRoutingType =
                            item.routingType().id() == self.routingTypes()[0].id()
                                ? item.parentGuid() == activeElement.parentGuid() ||
                                item.guid() == activeElement.parentGuid()
                                : true;

                        if (ruleForRoutingType) {
                            ko.utils.arrayForEach(item.routings(), function (route, i) {
                                if (route.to().guid == activeElement.guid()) {
                                    item.routings().splice(i, 1);
                                }
                            });
                        }
                    }
                };

                // remove active element
                if (activeElement) {
                    self.createdElements().some(function iter(o, i, a) {
                        removeAllRoutingRelations(o);
                        if (o.guid() === activeElement.guid()) {
                            a.splice(i, 1);
                            $fg("div[id=" + activeElement.guid() + "]").remove();
                            self.activeElement(null);
                        }
                        var children =
                            typeof o.children === "function" ? o.children() : o.children;
                        return children && children.some(iter);
                    });
                    localStorage.setItem("JSONData", ko.toJSON(self.createdElements()));
                }
            };

            self.setTextColor = function () {
                var rgb = self.activeElement().color();
                var colors = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                var brightness = 5;

                var r = colors[1];
                var g = colors[2];
                var b = colors[3];

                var ir = Math.floor((255 - r) * brightness);
                var ig = Math.floor((255 - g) * brightness);
                var ib = Math.floor((255 - b) * brightness);
                return "rgb(" + ir + "," + ig + "," + ib + ")";
            };

            self.setDisableAllTypes = function () {
                var data = self
                    .devices()
                    .concat(self.physicals())
                    .concat(self.objects());
                ko.utils.arrayForEach(data, function (el) {
                    el.status(false);
                });
                $fg('input[name="farmCheckBox"]').prop("checked", false);
            };

            self.getTypeOptions = function (id) {
                if (!id) return;
                var data = self
                    .devices()
                    .concat(self.physicals())
                    .concat(self.objects());
                var el = ko.utils.arrayFirst(data, function (type) {
                    return type.id() == id;
                });
                return el;
            };

            self.loadFarmElements = function () {
                ko.utils.arrayForEach(
                    farmGraphModule.elements.jsonElements.devices,
                    function (el) {
                        // obj.status = ko.observable(false);
                        self.devices.push($fg.extend(true, {}, new jsonToModel(el)));
                    }
                );
                ko.utils.arrayForEach(
                    farmGraphModule.elements.jsonElements.physicals,
                    function (el) {
                        // obj.status = ko.observable(false);
                        self.physicals.push($fg.extend(true, {}, new jsonToModel(el)));
                    }
                );
                ko.utils.arrayForEach(
                    farmGraphModule.elements.jsonElements.objects,
                    function (el) {
                        // obj.status = ko.observable(false);
                        self.objects.push($fg.extend(true, {}, new jsonToModel(el)));
                    }
                );
            };

            self.pushElement = function (parentGuid, element) {
                var newElement = new jsonToModel(ko.toJS(element));
                if (parentGuid == null) self.createdElements.push(newElement);

                self.getCreatedElement(parentGuid, function (data) {
                    data.children.push(newElement);
                });
                localStorage.setItem("JSONData", ko.toJSON(self.createdElements()));
            };

            self.getCreatedElement = function (guid, callback) {
                if (!guid) return;


                self.createdElements().some(function iter(o, i, a) {

      


                    if (o.guid() == guid) {
                        callback(o);
                    }
                    var children =
                        typeof o.children === "function" ? o.children() : o.children;
                    return children && children.some(iter);
                });
            };

            self.editElement = function () {
                var activeGuid = self.activeElement().guid();
                $fg("div[id=" + activeGuid + "]").dblclick();
                return;
            };

            self.setElement = function (option) {
                self.getCreatedElement(option.guid(), function (callback) {
                    callback.formData(option.formData());
                    localStorage.setItem("JSONData", ko.toJSON(self.createdElements()));
                });
            };

            self.selectElement = function (guid) {
                if (!guid) return;


                self.getCreatedElement(guid, function (item) {

                    self.activeElement(item);

                    var textColor = self.setTextColor(item.color);
                    self.textColor(textColor);

                    if (item.routingEnabled().output) {
                        self.changeRoutingType(item.routingType());
                        self.routingButtonVisible();
                    }
                });
            };

            self.getSelectableRouteElement = function () {
                var activeElement = self.activeElement();
                if (!activeElement) return;

                self.filteredCreatingElementsByRoutable([]);
                var routeableElements = self.createdElements();

                routeableElements.some(function iter(o, i, a) {
                    if (o !== activeElement && o.routingEnabled().input) {
                        // var ruleForObjectType = o.

                        var ruleForRoutingType =
                            activeElement.routingType().id() == self.routingTypes()[0].id()
                                ? o.parentGuid() == activeElement.parentGuid() ||
                                o.guid() == activeElement.parentGuid()
                                : true;

                        if (ruleForRoutingType) {
                            var hasRoute =
                                ko.utils.arrayFilter(activeElement.routings(), function (item) {
                                    return (
                                        item.to().guid === o.guid() && item.isDeleted() === false
                                    );
                                }).length > 0;

                            if (hasRoute == false) {
                                self.filteredCreatingElementsByRoutable.push(o);
                            }
                        }
                    }

                    var children =
                        typeof o.children === "function" ? o.children() : o.children;
                    return children && children.some(iter);
                });
            };

            self.saveCanvas = function () {
                var size = {
                    Length: self.canvasProperties().width(),
                    Width: self.canvasProperties().height()
                };

                farmGraphModule.farmDb.updatefarmSize(size, function (data) {
                    if (data) {
                        farmGraphModule.elements.drawArea.css({
                            width: size.Length + "px",
                            height: size.Width + "px"
                        });
                        farmGraphModule.elements.farm.mCustomScrollbar("update");
                        farmGraphModule.elements.drawArea.farmDraw.reDrawGrid();
                    }
                })
            };

            self.loadFarmElements();
        };

        (function () {
            farmGraphModule.farmDb.getFarm(
                function (farm) {
                    if (farm) {
                        farmGraphModule.elements.farmDrawPluginOptions.canvas.width = farm.width;
                        farmGraphModule.elements.farmDrawPluginOptions.canvas.height = farm.height;
                        vm = new viewModel();
                        ko.applyBindings(vm);
                        farmGraphModule.init(jsonData);
                    }
                }
            )
        })();
    })
});
