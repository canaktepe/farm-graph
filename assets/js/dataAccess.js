farmDbModel = function () {
    var self = this;
    self.serviceUrl = "/Content/FarmGraph.aspx";
    self.getFarm = function (callback) {
        $fg.ajax({
            url: self.serviceUrl + '/GetFarm',
            type: 'POST',
            dataType: "json",
            contentType: 'application/json; charset=utf-8',
            success: function (response) {
                if (response.d) {
                    var data = response.d;

                    return callback({ width: data.Length, height: data.Width });
                }
            },
            error: function (err) {
                return callback(null);
            }
        });
    }

    self.updatefarmSize = function (size, callback) {
        var data = { farm: { Length: size.Length, Width: size.Width } };
        $fg.ajax({
            url: self.serviceUrl + '/UpdateFarmSize',
            type: 'POST',
            data: JSON.stringify(data),
            dataType: "json",
            contentType: 'application/json; charset=utf-8',
            success: function (response) {
                if (response.d) {
                    var data = response.d;
                    return callback(data);
                }
            },
            error: function (err) {
                return callback(null);
            }
        });
    }

    self.getFarmItems = function () {
        $fg.ajax({
            url: self.serviceUrl + '/GetFarmItems',
        })
    }
}
