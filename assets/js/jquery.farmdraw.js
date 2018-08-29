/*
== Jquery Farm Draw Plugin == 
Version: 1.0.0
Plugin URI: http://canaktepe.com
Author: Can Aktepe
Author URI: http://canaktepe.com
License: MIT License (MIT)
*/

/*
Copyright Can Aktepe (email: info@canaktepe.com)
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
The code below is fairly long, fully commented and should be normally used in development. 
For production, use either the minified jquery.farmdraw.min.js script or 
the production-ready jquery.farmdraw.min.js which contains the plugin 
and dependencies (minified). 
*/
(function ($) {
    $.fn.farmDraw = function (options) {
        var defaults = {
            drawNewButton: '',
            drawNewButtonAddText: 'Add New Item',
            drawNewButtonCancelText: 'Cancel Draw',
            canvas: {
                class: '',
                width: 300,
                height: 300,
                grid: false,
                snapGrid: true,
                gridSize: [50, 50]
            },
            rectangle: {
                activeClass: 'active',
                minWidth: 30,
                minHeight: 30,
                color: 'lightgrey',
                border: '',
                borderSize: 1,
                borderColor: '#333',
                selectable: false,
                draggable: false,
                resizable: false,
                showActive: true
            },
            onDrawStart: function (e) { },
            onDraw: function (e) { },
            onDrawComplete: function (e) { }
        };

        var settings = $.extend(true, {}, defaults, options);

        function snapElementToGrid(x, y, w, h) {
            var position = { x, y, w, h };
            if (settings.canvas.snapGrid) {
                position = {
                    x: Math.round(x / settings.canvas.gridSize[0]) * settings.canvas.gridSize[0],
                    y: Math.round(y / settings.canvas.gridSize[1]) * settings.canvas.gridSize[1],
                    w: Math.round(w / settings.canvas.gridSize[0]) * settings.canvas.gridSize[0],
                    h: Math.round(h / settings.canvas.gridSize[1]) * settings.canvas.gridSize[1]
                }
            }
            return position;
        }


        function drawBoxmouseOver(e) {
            drawingEnabled ? $(e.currentTarget).css("cursor", "crosshair") : $(e.currentTarget).css("cursor", "default")
        }

        function createRectangle(e, w, h) {

            var drawBox = $(e);
            var el = $("<div />").css({
                left: e.drawStartX,
                top: e.drawStartY,
                width: w,
                height: h,
                backgroundColor: settings.rectangle.color,
            });

            el.addClass('rect')

            if (settings.rectangle.border != "")
                el.css({ border: settings.rectangle.border, borderWidth: settings.rectangle.borderSize + 'px', borderColor: settings.rectangle.borderColor })

            settings.canvas.gridSize = settings.canvas.snapGrid ? settings.canvas.gridSize : 0;

            if (settings.rectangle.selectable) {
                el.on('click', function (cev) {
                    e.drawingRect = $(cev.currentTarget);
                    selectRect(e);

                    cev.stopPropagation();
                })
            }

            el.appendTo(drawBox);

            if (settings.rectangle.draggable) {
                el.draggable({
                    containment: 'parent',
                    start: function (event, ui) {
                        e.drawingRect = $(event.currentTarget);
                        selectRect(e);
                    },
                    grid: settings.canvas.gridSize
                });
            }

            if (settings.rectangle.resizable) {
                $("<div>", { class: "ui-resizable-handle ui-resizable-nw", attr: { id: "nwgrip" } }).appendTo(el);
                $("<div>", { class: "ui-resizable-handle ui-resizable-ne", attr: { id: "negrip" } }).appendTo(el);
                $("<div>", { class: "ui-resizable-handle ui-resizable-sw", attr: { id: "swgrip" } }).appendTo(el);
                $("<div>", { class: "ui-resizable-handle ui-resizable-se", attr: { id: "segrip" } }).appendTo(el);

                $("<div>", { class: "ui-resizable-handle ui-resizable-n", attr: { id: "ngrip" } }).appendTo(el);
                $("<div>", { class: "ui-resizable-handle ui-resizable-e", attr: { id: "egrip" } }).appendTo(el);
                $("<div>", { class: "ui-resizable-handle ui-resizable-s", attr: { id: "sgrip" } }).appendTo(el);
                $("<div>", { class: "ui-resizable-handle ui-resizable-w", attr: { id: "wgrip" } }).appendTo(el);
                el.resizable({
                    handles: {
                        'nw': '#nwgrip',
                        'ne': '#negrip',
                        'sw': '#swgrip',
                        'se': '#segrip',
                        'n': '#ngrip',
                        'e': '#egrip',
                        's': '#sgrip',
                        'w': '#wgrip'
                    },
                    minWidth: settings.rectangle.minWidth,
                    minHeight: settings.rectangle.minHeight,
                    containment: 'parent',
                    autoHide: true,
                    grid: settings.canvas.gridSize
                });
            }

            return el;
        };

        function draw(e) {
            var currentX = e.pageX - this.canvasOffsetLeft;
            var currentY = e.pageY - this.canvasOffsetTop;
            var position = calcPosition(this.drawStartX, this.drawStartY, currentX, currentY);
            this.drawingRect.css(position);
            settings.onDraw.call(this, this);
        };

        function startDraw(e) {



            if (!drawingEnabled && settings.drawNewButton !== '') return;



            var target = $(e.target);


            var offset = target.offset();

            this.canvasOffsetLeft = offset.left;
            this.canvasOffsetTop = offset.top;
            this.drawStartX = e.pageX - this.canvasOffsetLeft;
            this.drawStartY = e.pageY - this.canvasOffsetTop;

            var position = snapElementToGrid(this.drawStartX, this.drawStartY, 0, 0);
            this.drawStartX = position.x;
            this.drawStartY = position.y;
            this.drawingRect = createRectangle(target, 0, 0);

            $(this).on('mousemove', $.proxy(draw, this));
            $(this).on('mouseup', $.proxy(endDraw, this));

            settings.onDrawStart.call(this, this);
        }


        function endDraw(e) {


            var currentX = e.pageX - this.canvasOffsetLeft;
            var currentY = e.pageY - this.canvasOffsetTop;
            var position = calcPosition(this.drawStartX, this.drawStartY, currentX, currentY);

            if (position.width < settings.rectangle.minWidth || position.height < settings.rectangle.minHeight) {
                this.drawingRect.remove();
            } else {
                this.drawingRect.css(position);
                selectRect(this);

                drawEnableOrDisable();
                dragEnableOrDisable();
                drawBoxmouseOver(e);
            }

            $(this).off('mousemove');
            $(this).off('mouseup');


            settings.onDrawComplete.call(this, this);
        };



        function selectRect(drawBox) {



            if (!settings.rectangle.showActive) return;

            drawBox.selectedRect && drawBox.selectedRect.removeClass(settings.rectangle.activeClass)
            drawBox.selectedRect = drawBox.drawingRect;
            $('.rect.active').removeClass('active');
            drawBox.selectedRect.addClass(settings.rectangle.activeClass);
        }

        function calcPosition(startX, startY, endX, endY) {
            var width = endX - startX;
            var height = endY - startY;
            var posX = startX;
            var posY = startY;

            if (width < 0) {
                width = Math.abs(width);
                posX -= width;
            }

            if (height < 0) {
                height = Math.abs(height);
                posY -= height;
            }

            var position = snapElementToGrid(posX, posY, width, height);
            return {
                left: position.x,
                top: position.y,
                width: position.w,
                height: position.h
            };
        }

        drawGrid = function (drawBox) {
            var canvas_width = settings.canvas.width,
                canvas_height = settings.canvas.height,
                gridsizeW = settings.canvas.gridSize[0],
                gridsizeH = settings.canvas.gridSize[1];

            var gridCanvas = $('<canvas />', { attr: { width: canvas_width, height: canvas_height } });
            var context = gridCanvas.get(0).getContext("2d");

            for (var x = 0; x <= canvas_width; x += gridsizeW) {
                context.moveTo(x, 0);
                context.lineTo(x, canvas_height);
            }

            for (var y = 0; y <= canvas_height; y += gridsizeH) {
                context.moveTo(0, y);
                context.lineTo(canvas_width, y);
            }

            context.strokeStyle = "#9B9B9B";
            context.stroke();

            var base64 = gridCanvas.get(0).toDataURL();
            drawBox.css('background-image', 'url(' + base64 + ')')
        }

        function drawEnableOrDisable() {
            if (settings.drawNewButton === '') return;
            drawingEnabled = !drawingEnabled
            drawingEnabled ?
                drawNewButton.text(settings.drawNewButtonCancelText) :
                drawNewButton.text(settings.drawNewButtonAddText);
        }

        function dragEnableOrDisable() {
            if (!settings.rectangle.draggable) return;
            var draggables = $('.rect').draggable();
            $.each(draggables, function (i, dragEl) {
                drawingEnabled ? $(dragEl).draggable('disable') : $(dragEl).draggable('enable');
            })
        }

        var drawNewButton,
            drawingEnabled = settings.drawNewButton === '';
        if (!drawingEnabled) {
            drawNewButton = $(settings.drawNewButton)
                .on('click', function () {
                    drawEnableOrDisable();
                    dragEnableOrDisable();
                })
        }

        return this.each(function (i, el) {
            var $base = $(el);

            $base.init = function () {
                if (!$base.is('[id]')) $base.attr({ id: 'drawZone_' + i })

                $base.addClass('farm-draw-zone');
                if (settings.canvas.class !== '') $base.addClass(settings.canvas.class);
                $base.css({
                    width: settings.canvas.width,
                    height: settings.canvas.height
                });

                if (settings.canvas.grid) {
                    drawGrid($base);
                    $base.css("border", "none");
                }


                this.on('mouseover', $.proxy(drawBoxmouseOver, this));
                this.on('mousedown', $.proxy(startDraw, this));
            };

            $base.init();
        });
    };
}(jQuery));