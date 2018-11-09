farmDbModel = function () {
    var self = this;
    self.serviceUrl = "/Content/FarmGraph.aspx";
    self.options = {
        type: 'POST',
        dataType: "json",
        contentType: 'application/json; charset=utf-8'
    };

    self.post = function (u, data, async, callback) {
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

    self.getFarm = function (callback) {
        self.post("/GetFarm", {}, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback({ width: result.Width, height: result.Length });
            }
        })
    }

    self.updatefarmSize = function (size, callback) {
        var data = JSON.stringify({ farm: { Length: size.Length, Width: size.Width } })
        self.post("/UpdateFarmSize", data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.getFarmItems = function (default_data, callback) {
        var template = default_data.devices.concat(default_data.objects).concat(default_data.physicals);
        var data = JSON.stringify({ template });
        self.post("/GetFarmItems", data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.setFarmItemSizeAndLocation = function (farmItem, callback) {
        var data = JSON.stringify({ farmItem })
        self.post('/UpdateFarmItemSizeAndLocation', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.RemoveFarmItem = function (guid, callback) {
        var data = JSON.stringify({ guid });
        self.post('/RemoveFarmItem', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.GetNodes = function (typeId, callback) {
        var data = JSON.stringify({ typeId });
        self.post('/GetNodes', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.SetFarmItemDeviceNodeId = function (farmItem, callback) {
        var data = JSON.stringify({ farmItem });
        self.post('/SetFarmItemDeviceNodeId', data, false, function (response) {
            if (response.d) {
                var result = response.d;
                callback(result);
            }
        })
    }

    self.addDeviceTofarmItem = function(farmItem,callback){
        var data = JSON.stringify({farmItem});
        self.post('/addDeviceTofarmItem',data,false,function(response){
            if(response.d){
                var result = response.d;
                callback(result);
            }
        })
    }
}
