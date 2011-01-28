/** =======================================================================
 *  Vincent Hardy
 *  License terms: see svg-wow.org
 *  CC0 http://creativecommons.org/publicdomain/zero/1.0/
 *  ======================================================================= */

YUI.add("camera", function (Y) {

    /**
     * Constructor. A <code>Camera</code> makes it easy to move the
     * viewpoint in an SVG graphics.
     *
     * It is used as so:
     * <code>
     * // Create a new travelling path with the initial camera position
     * var ctp = new Camera({
     *      target: elt, // The SVG element with the target coordinate system.
     *      position: {x: 10, y: 40},
     *      zoom: 2,
     *      direction: 90 // angle made with (1, 0) vector
     *      viewport: {width: 400, height: 300}, // The camera viewport
     *      frameLength: 40 // Time between camera movements, in milliseconds
     * });
     *
     * ctp.addTravelSegment({
     *      position: {x: 80, y: 80},
     *      zoom: 1,
     *      direction: 45,
     *      controlPoints: {
     *          start: {x: 30, y: 20},
     *          end: {x: 80, y: 80}
     *      },
     *      runLength: 500, // milliseconds
     *      interpolators: {
     *          direction: function(p) {},
     *          zoom: function (p) {},
     *          position: function (p) {}
     *      },
     *      customData: ... // custom data you want to be able to get in the fired events
     * );
     *
     * ctp.action();
     * </code>
     *
     * @param config the initial camera position and target element.
     */
    var Camera = function (config) {
        var c = {
            settings: [{
                position: {
                    x: 0,
                    y: 0
                }
            }],
            segments: []
        };
        var fs = c.settings[0];

        c.target = config.target;
        c.viewport = config.viewport;
        c.frameLength = config.frameLength;
        fs.position = config.position;
        fs.zoom = config.zoom;
        fs.direction = config.direction;

        this._config = c;
    };

    Camera.events = {
        segmentComplete: "segmentComplete",
        complete: "complete"
    };

    Y.augment(Camera, Y.EventTarget);

    /**
     * Adds a new travel segment. A travel segment has the following properties:
     * - position (x/y)
     * - zoom
     * - direction (in degrees)
     * - controlPoints (start(x/y), end(x/y))
     * - length (in millisseconds)
     * - interpolators: direction, zoom and position.
     *
     * @param seg the new segment configuration
     */
    Camera.prototype.addTravelSegment = function (seg) {
        var previousEndRunLength = 0,
        segments = this._config.segments,
        nSegments = segments.length;

        if (nSegments > 0) {
            previousEndRunLength = segments[nSegments - 1].endRunLength;
        }

        this._config.settings.push({
            position: seg.position,
            zoom: seg.zoom,
            direction: seg.direction
        });

        this._config.segments.push({
            name: seg.name,
            controlPoints: seg.controlPoints,
            startRunLength: previousEndRunLength,
            endRunLength: previousEndRunLength + seg.runLength,
            runLength: seg.runLength,
            interpolators: seg.interpolators,
            customData: (seg.customData ? seg.customData : null)
        });
    };

    /**
     * @see #addTravelSegment
     */
    Camera.prototype.addTravelSegments = function (segments) {
        for (var i = 0; i < segments.length; i++) {
            this.addTravelSegment(segments[i]);
        }
    };

    /**
     * Runs the camera along the travelling segments.
     */
    Camera.prototype.action = function () {
        // Move to the initial position
        this._travelTo(this._config.settings[0]);

        // Now, set a timer to move to the next position after each segment
        var that = this;
        var curSegmentIndex = 0, curSegment, segments = this._config.segments,
        nSegments = segments.length;
        var timerId, settings = this._config.settings;
        var startTime = (new Date()).getTime();

        var moveCamera = function () {
            var curTime = (new Date()).getTime();
            var curRunLength = curTime - startTime;
            var p = 0, setting, s, e, pos, zoom, dir;

            // Check if we are still in the current segment
            if (curRunLength > curSegment.endRunLength) {
                // We have moved past the current segment.
                that.fire({
                    type: Camera.events.segmentComplete,
                    segmentIndex: curSegmentIndex,
                    segment: segments[curSegmentIndex]
                });
                      
                // Move to the next segment
                for (var i = curSegmentIndex + 1; i < nSegments; i++) {
                    if (segments[i].endRunLength >= curRunLength) {
                        curSegmentIndex = i;
                        curSegment = segments[curSegmentIndex];
                        break;
                    }
                }

                if (i === nSegments) {
                    // We ran past the last segment
                    curSegmentIndex = nSegments - 1;
                    curSegment = segments[curSegmentIndex];
                    curRunLength = curSegment.endRunLength;
                    clearInterval(timerId);
                    that.fire(Camera.events.complete);
                }


            }

            p = (curRunLength - curSegment.startRunLength) / curSegment.runLength;
            pos = curSegment.interpolators.position;
            zoom = curSegment.interpolators.zoom;
            dir = curSegment.interpolators.direction;

            s = settings[curSegmentIndex];
            e = settings[curSegmentIndex + 1]; // There is one more settings

            setting = {
                position: {
                    x: pos(p, s.position.x, e.position.x - s.position.x, 1),
                    y: pos(p, s.position.y, e.position.y - s.position.y, 1)
                },
                direction: dir(p, s.direction, e.direction - s.direction, 1),
                zoom: zoom(p, s.zoom, e.zoom - s.zoom, 1)
            };

            that._travelTo(setting);
        };

        if (nSegments > 0) {
            curSegment = segments[curSegmentIndex];
            timerId = setInterval(moveCamera, this._config.frameLength);
        }
    };

    /**
     * Moves the camera to the given position
     *
     * @param setting description with position, angle and scale
     */
    Camera.prototype._travelTo = function (setting) {
        var t = this._config.target;
        var m = t.getMatrix();
        var vp = this._config.viewport;

        m.toIdentity();

        // Move to viewport center
        m.translate(vp.width / 2, vp.height / 2);

        // Apply scale and rotate
        m.scale(setting.zoom).rotate(setting.direction);

        // Center on object
        m.translate(-setting.position.x, -setting.position.y);

        t.setMatrix(m);
    };

    var sw = window.sw;
    if (window.sw === undefined) {
        window.sw = {};
        sw = window.sw;
    }

    sw.tools = sw.tools || {};
    sw.tools.Camera = Camera;

});