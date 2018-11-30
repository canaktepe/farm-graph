farmDbModel = function () {
    var self = this;
    self.serviceUrl = "/Content/FarmGraph.aspx";
    self.options = {
        type: 'POST',
        dataType: "json",
        contentType: 'application/json; charset=utf-8'
    };

    self.Post = function (u, data, async, callback) {
        var url = self.serviceUrl + u;
        var options = $fg.extend(true, self.options, {
            url: url,
            data: data,
            async: async,
            success: function (response) {
                if (response) callback(response);
            },
            error: function (error) {
                callback(error);
            }
        });

        $fg.ajax(options);
    }

    self.CreateNewFarmNode = function (farm, callback) {
        var data = JSON.stringify({
            farmNode: {
                Width: farm.width,
                Length: farm.length,
                NodeId: farm.nodeId,
                Name : farm.name
            }
        })
        self.Post('/CreateNewFarmNode', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.GetFarm = function (callback) {
        self.Post("/GetFarm", {}, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback({
                    width: result.Width,
                    height: result.Length
                });
            } else callback(null);
        })
    }

    self.UpdatefarmSize = function (size, callback) {
        var data = JSON.stringify({
            farm: {
                Length: size.Length,
                Width: size.Width
            }
        })
        self.Post("/UpdateFarmSize", data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.GetFarmItems = function (default_data, callback) {
        var template = default_data.devices.concat(default_data.objects).concat(default_data.physicals);
        var data = JSON.stringify({
            template
        });
        self.Post("/GetFarmItems", data, false, function (response) {
            var result = [];
            if (response.d) {
                result = response.d;
            }
            callback(result);
        })
    }

    self.SetFarmItemSizeAndLocation = function (farmItem, callback) {
        var data = JSON.stringify({
            farmItem
        })
        self.Post('/UpdateFarmItemSizeAndLocation', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.RemoveNodeItem = function (fitId, callback) {
        var data = JSON.stringify({
            fitId
        });
        self.Post('/RemoveNodeItem', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.GetNodeItems = function (typeId, callback) {
        var data = JSON.stringify({
            typeId
        });
        self.Post('/GetNodeItems', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.SetNodeItem = function (nodeItem, callback) {
        var data = JSON.stringify({
            nodeItem
        });
        self.Post('/SetNodeItem', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.AddNodeItem = function (nodeItem, callback) {
        var data = JSON.stringify({
            nodeItem
        });
        self.Post('/AddNodeItem', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }
}