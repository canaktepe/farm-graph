
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
    })
    self.getHeight = ko.computed({
        read: function () {
            return self.height();
        },
        write: function (value) {
            self.height(parseInt(value));
        }
    })
};

jsonToModel = function (data) {
    var self = this;
    self.acceptable = ko.observable(data.acceptable);
    self.children = ko.observableArray();
    if (data.children) {
        if (data.children.length > 0) {
            $.each(data.children, function (i, item) {
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
    self.resizable = ko.observable(data.resizable);
    self.routing = ko.observableArray(data.routing);
    self.status = ko.observable(data.status);
    self.type = ko.observable(data.type);
};

var jsonData = JSON.parse(localStorage.getItem("JSONData")) || [];

farmGraphModule.bindJsonElements(function (callback) {
    if (jsonData.length > 0) {
        jsonData = jsonData.map(function (item) {
            return new jsonToModel(item);
        })
    }

    ko.bindingHandlers.hoverToggle = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var guid = valueAccessor();
            if (ko.isObservable(guid))
                guid = guid()

            var showObj = $("div.rect[id=" + guid + "]");

            ko.utils.registerEventHandler(element, "mouseover", function () {
                ko.utils.toggleDomNodeCssClass(element, ko.utils.unwrapObservable('bg-light'), true);
                showObj.addClass('show-route');
            });
            ko.utils.registerEventHandler(element, "mouseout", function () {
                ko.utils.toggleDomNodeCssClass(element, ko.utils.unwrapObservable('bg-light'), false);
                showObj.removeClass('show-route');
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
        self.selectedRoutingElement = ko.observable(null);
        self.searchElementKeyword = ko.observable('');
        self.filteredCreatingElementsByRoutable = ko.observableArray([]);
        self.canvasProperties = ko.observable(new canvasModel({ zoom: 100, width: farmGraphModule.elements.farmDrawPluginOptions.canvas.width, height: farmGraphModule.elements.farmDrawPluginOptions.canvas.height }))

        self.addRouting = function () {
            if (!self.activeElement() || !self.selectedRoutingElement()) return;
            var route = { guid: self.selectedRoutingElement().guid, name: self.selectedRoutingElement().formData().Name };
            self.activeElement().routing.push(route)
            localStorage.setItem('JSONData', ko.toJSON(self.createdElements()))
            self.selectedRoutingElement(null);
        }

        self.addRoutingCallback = function (elem) {
            if (elem.nodeType === 1) {
                $(elem)
                    .animate({ backgroundColor: '#fc9c9c' }, 200)
                    .animate({ backgroundColor: 'transparent' }, 800);
            }
        }

        self.selectRoutingElement = function (data) {
            self.selectedRoutingElement(data);
        }

        self.deleteRouting = function (item) {
            self.activeElement().routing.remove(item);
            $('div.rect').removeClass('show-route');
            localStorage.setItem('JSONData', ko.toJSON(self.createdElements()))
        }

        self.RoutingSelectableElements = ko.computed(function () {
            if (self.activeElement() == null) return;

            self.filteredCreatingElementsByRoutable([])
            var filter = self.searchElementKeyword();
            self.createdElements().some(function iter(o, i, a) {
                if (o !== self.activeElement()) {
                    var hasRoute = ko.utils.arrayFilter(self.activeElement().routing(), function (item) {
                        var iguid = typeof (item.guid) === "function" ? item.guid() : item.guid;
                        return iguid === o.guid();
                    }).length > 0

                    if (hasRoute == false)
                        self.filteredCreatingElementsByRoutable.push(o)
                }

                var children = (typeof o.children) === "function" ? o.children() : o.children
                return children && children.some(iter);
            });

            if (filter) {
                self.filteredCreatingElementsByRoutable(ko.utils.arrayFilter(self.filteredCreatingElementsByRoutable(), function (item) {
                    return item.formData().Name.toLowerCase().indexOf(filter.toLowerCase()) > -1;
                }))
            }
        })

        self.getActiveElementRouting = ko.computed({
            read: function () {
                var active = self.activeElement();
                if (active) {
                    var data = $.extend([], active.routing())
                    return data.reverse();
                }
                else {
                    return ko.observableArray([]);
                }
            }
        })

        self.getActiveElement = ko.pureComputed({
            read: function () {
                return self.activeElement() ? self.activeElement() : { name: "Not Selected", position: ko.observable({ x: 0, y: 0, w: 0, h: 0 }) };
            },
            write: function () {
                var positionToSnap = farmGraphModule.elements.drawArea.farmDraw.snapToGrid(self.activeElement().position().x, self.activeElement().position().y, self.activeElement().position().w, self.activeElement().position().h);
                self.activeElement().position(positionToSnap)

                //set canvas element position
                $("div[id=" + self.activeElement().guid() + "]").css({
                    width: self.activeElement().position().w,
                    height: self.activeElement().position().h,
                    top: self.activeElement().position().y,
                    left: self.activeElement().position().x,
                })
                localStorage.setItem('JSONData', ko.toJSON(self.createdElements()))
            }
        }, viewModel)

        self.setElementPosition = function (pos) {
            pos = {
                left: typeof(pos.left) == 'number'? pos.left : self.getActiveElement().position().x,
                top: typeof(pos.top) == 'number'? pos.top : self.getActiveElement().position().y,
                width: typeof(pos.width) == 'number'? pos.width : self.getActiveElement().position().w,
                height: typeof(pos.height) == 'number'? pos.height : self.getActiveElement().position().h
            };
            pos = farmGraphModule.elements.drawArea.farmDraw.snapToGrid(pos.left, pos.top, pos.width, pos.height);
            self.getActiveElement().position(pos)

            return pos;
        }

        self.setEnable = function (acceptable) {
            var data = self.devices().concat(self.physicals()).concat(self.objects());
            ko.utils.arrayForEach(data, function (el) {
                ko.utils.arrayFilter(acceptable, function (acc) {
                    if (acc == el.id()) {
                        el.status(true);
                    }
                });
            })
            return true;
        }

        self.deleteElement = function () {
            var elem = self.activeElement();
            if (elem) {
                self.createdElements().some(function iter(o, i, a) {
                    if (o.guid() === elem.guid()) {
                        a.splice(i, 1);
                        $("div[id=" + elem.guid() + "]").remove();
                        self.activeElement(null)
                        localStorage.setItem('JSONData', ko.toJSON(self.createdElements()))
                        return true;
                    }
                    var children = (typeof o.children) === "function" ? o.children() : o.children
                    return children && children.some(iter);
                });
            }
        }

        self.setDisableAllTypes = function () {
            var data = self.devices().concat(self.physicals()).concat(self.objects());
            ko.utils.arrayForEach(data, function (el) {
                el.status(false);
            })
            $('input[name="farmCheckBox"]').prop('checked', false);
        }

        self.getTypeOptions = function (id) {
            if (!id) return;
            var data = self.devices().concat(self.physicals()).concat(self.objects());
            var el = ko.utils.arrayFirst(data, function (type) {
                return type.id() == id;
            });
            return el;
        }

        self.loadFarmElements = function () {
            ko.utils.arrayForEach(farmGraphModule.elements.jsonElements.devices, function (el) {
                // obj.status = ko.observable(false);
                self.devices.push($.extend(true, {}, new jsonToModel(el)))
            })
            ko.utils.arrayForEach(farmGraphModule.elements.jsonElements.physicals, function (el) {
                // obj.status = ko.observable(false);
                self.physicals.push($.extend(true, {}, new jsonToModel(el)))
            })
            ko.utils.arrayForEach(farmGraphModule.elements.jsonElements.objects, function (el) {
                // obj.status = ko.observable(false);
                self.objects.push($.extend(true, {}, new jsonToModel(el)))
            })
        }

        self.pushElement = function (parentGuid, element) {
            var newElement = new jsonToModel(ko.toJS(element));
            if (parentGuid == null)
                self.createdElements.push(newElement);

            self.getCreatedElement(parentGuid, function (data) {
                data.children.push(newElement);
            })
            localStorage.setItem('JSONData', ko.toJSON(self.createdElements()))
        }

        self.getCreatedElement = function (guid, callback) {
            if (!guid) return;
            self.createdElements().some(function iter(o, i, a) {
                if (o.guid() === guid) {
                    callback(o)
                }
                var children = (typeof o.children) === "function" ? o.children() : o.children
                return children && children.some(iter);
            });
        }

        self.editElement = function () {
            var activeGuid = self.activeElement().guid();
            $("div[id=" + activeGuid + "]").dblclick();
            return;
        }

        self.setElement = function (option) {
            self.getCreatedElement(option.guid(), function (callback) {
                callback.formData(option.formData());
                localStorage.setItem('JSONData', ko.toJSON(self.createdElements()))
            })
        }

        self.selectElement = function (guid) {
            if (!guid) return;
            self.getCreatedElement(guid, function (item) {
                self.activeElement(item)
            })
        }

        self.saveCanvas = function () {
            farmGraphModule.elements.drawArea.css({
                width: self.canvasProperties().width() + 'px',
                height: self.canvasProperties().height() + 'px'
            })
            farmGraphModule.elements.farm.mCustomScrollbar("update");
            farmGraphModule.elements.drawArea.farmDraw.reDrawGrid();
        }

        self.loadFarmElements();
    }

    vm = new viewModel();
    ko.applyBindings(vm);

    (function () {
        farmGraphModule.init(jsonData);

    })();



})