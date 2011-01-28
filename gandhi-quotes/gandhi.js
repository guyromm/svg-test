/** =======================================================================
 *  Vincent Hardy
 *  License terms: see svg-wow.org
 *  CC0 http://creativecommons.org/publicdomain/zero/1.0/
 *  ======================================================================= */
(function () {

    /**
     * See the YUI.use() call at the end of this script to understand how this
     * method is invoked initially.
     *
     * This demo uses an audio track. To make sure that audio is available
     * before animations are allowed to start, the demo shows an animation
     * letting the user know audio is loading until the audio loads or is found
     * in error.
     *
     * Once the audio has loaded, a play button is displayed to let the user
     * start the animation.
     *
     * The demo shows a number of quotes from Gandhi, moving the camera around
     * to zoom in on each one in turn. Once all quotes have been shown, the
     * camera zooms out and the dots in each quote morph first into a set of
     * intermediate shape which then morph into a rendering of Gandhi's face.
     *
     * Finally, a text effect shows the full name of Gandhi and another effect
     * brings up the name of the artist who rendered Gandhi's face.
     * 
     * @param Y the YUI instance.
     */
    function onScriptsReady (Y) {
        var Animate = sw.animation.Animate, Easing = Y.Easing,
            TextEffects = sw.TextEffects, fadeAuthor, cx, cy;

        // Add an effect to the title text to show when the morphing
        // animation ends.
        var title = Y.one("#title"), 
            effect = TextEffects.effects['zoom-out'].applyEffect([title],{
                                                        duration: 0.5,
                                                        offset: 0.11,
                                                        easing: Easing.easingNone
                                                    });
        effect.setStartState();
        
        // Wait for the audio to be ready before allowing the demo to start.
        // =====================================================================
        var animateLoadingAudio,
            animateLoadingOpacity,
            hideLoadingAudio,
            showPlayButton,
            audioTrack;

        hideLoadingAudio = new Animate({
            node: "#loadingAudio",
            from: {opacity: 1},
            to: {opacity: 0},
            duration: 0.5
        });
        
        showPlayButton = new Animate({
            node: "#playButton",
            from: {opacity: 0},
            to: {opacity: 1},
            duration: 3
        });

        animateLoadingOpacity = new Animate({
            node: "#loadingDashes",
            from: {opacity: 0},
            to: {opacity: 1},
            duration: 2,
            iterations: 'infinite',
            direction: 'alternate',
            easing: Easing.easingNone
        });
        animateLoadingAudio = new Animate({
            node: "#loadingDashes",
            from: {transform: {tx: -30}},
            to: {transform: {tx: 80}},
            duration: 4,
            iterations: 'infinite',
            transformTemplate: "translate(#tx,0)",
            easing: Easing.easingNone
        });

        animateLoadingAudio.onEnd(hideLoadingAudio);
        animateLoadingAudio.onBegin(animateLoadingOpacity);
        hideLoadingAudio.onEnd(showPlayButton);
        hideLoadingAudio.onEnd(function () {
            Y.one("#playButton").setStyle("display", "inline").
                                 setStyle("opacity", "0");
        });
        animateLoadingAudio.onBegin(function () {
            Y.one("#loadingAudio").setStyle("display", "inline");
        });
        animateLoadingAudio.run();

        var loader = new sw.AssetLoader(), audio;
        audio = loader.addAudioAsset("../res/3.0/audio/dave-jbd-2",
                                     ["mp3", "ogg", "wav"]);

        loader.on('all-loaded', onAudioReady);
        loader.on('error', onAudioReady);
        loader.loadQueuedAssets();
        
        // The demo really starts when the audio has finished loading
        // =====================================================================
        function onAudioReady () {
            // Stop the loading message. This will start a chain of effects 
            // which end up displaying the play button.
            animateLoadingAudio.stop(1);
                        
            // Now, wait for the user to start the demo
            Y.one("#playButton").on("click", play);
        }
        
        // The demo actually start when the user presses the play button 
        // =====================================================================
        function play () {
            // Hide the playButton. Make sure we do not respond to a second
            // click by removing the handler.
            Y.Event.detach("click", play, "#playButton");            
            showPlayButton.set("reverse", true);
            showPlayButton.run();
            
            // Play the audio track if not in error
            if (audio.get("error") !== null) {
                alert('Could not load audio track: ' +
                                        audio.get('error').code);
            } else {
                audio.play();
            }            

            // Prepare the morphing animation.
            //
            // The morphing is done as so:
            // a. By convention, all the shapes to be morphed are found in the
            //    SVG content and have an id with a predefined prefix.
            // b. The code looks for the initial, intermediate and end version
            //    of the shapes to get the value of their 'd' attribute.
            // c. The code creates animations of the d attribute on the initial
            //    shape which creates the morphing effect.
            //
            var startShapePrefix = 'face',
            startShapeSuffix = 'Initial',
            intermediateShapePrefix = 'face',
            intermediateShapeSuffix = 'Second',
            endShapePrefix = 'face',
            endShapeSuffix = 'Final',
            animations = [],
            easing = function (t, b, c, d) {
                return Easing.elasticOut(t, b, c, d, c * 1, d * 1.2);
            };
        
            sw.init();
    
            var shapeIndex = -1, startShapeId, endShapeId, startShape, 
                endShape, anim, anim2, intermediateShapeId, intermediateShape;

            /**
             * Helper method: checks if there is another shape with the desired
             * prefix, and different suffixes for the various states.
             *
             * In this demo, it looks for face<n>Initial, face<n>Second
             * and face<n>Final on the <n>th iteration.
             */
            function hasNextShape () {
                shapeIndex++;
                startShapeId = startShapePrefix + shapeIndex + startShapeSuffix;
                intermediateShapeId = intermediateShapePrefix + shapeIndex + 
                                         intermediateShapeSuffix;
                endShapeId = endShapePrefix + shapeIndex + endShapeSuffix;
                startShape = Y.one("#" + startShapeId);
                endShape = Y.one("#" + endShapeId);
                intermediateShape = Y.one("#" + intermediateShapeId);
        
                if (intermediateShape === null) {
                    Y.log('intermediate shape ' + intermediateShapeId + ' is null');
                }
                return startShape !== null && 
                       endShape !== null && 
                       intermediateShape !== null;
            }


            while (hasNextShape()) {
                // 'anim' morphs from a small dot (at the end of the quote) to a
                // bigger 'blob'.
                //
                // 'anim2' morphs to the blob to the final shape.
                anim = new Animate({
                    node: startShape,
                    to: {
                        d: intermediateShape.getAttribute('d')
                    },
                    duration: 6 + 2 * Math.random(),
                    easing: easing
                });
                anim2 = new Animate({
                    node: startShape,
                    to: {
                        d: endShape.getAttribute('d')
                    },
                    duration: 6 + 2 * Math.random(),
                    easing: easing
                });
                anim.onEnd(anim2);
                animations.push(anim);
            }

            var viewportWidth = Number(Y.one('svg').get('width')),
                viewportHeight = Number(Y.one('svg').get('height')),
                travelSegments = [],
                textElements = [],
                noInterpolators = {
                    zoom: Easing.easeNone,
                    direction: Easing.easeNone ,
                    position: Easing.easeNone
                },
                camera = new sw.tools.Camera({
                    target: Y.one('#cameraTarget'),
                    viewport: {
                        width: viewportWidth,
                        height: viewportHeight
                    },
                    frameLength: 1,
                    position: {
                        x: viewportWidth / 2,
                        y: viewportHeight / 2
                    },
                    direction: 0,
                    zoom: 0.1
                });

            travelSegments.push({
                name: "initialZoomPan",
                position: {
                    x: viewportWidth / 2,
                    y: viewportHeight / 2
                },
                direction: 0,
                zoom: 1,
                runLength: 5000,
                interpolators: noInterpolators
            });

            // Get the quotes and create a camera travel segment for each.
            var quotes = Y.one("#quotes"), textLength, flyOut = [];
            quotes.setStyle("display", "inline");
            quotes.setStyle("visibility", "hidden");

            quotes.all('text').each(function (node, index, nodeList) {
                var bbox = node._node.getViewportBBox(),

                // Compute the scale based on the bbox and the viewport size
                zoomX = viewportWidth / bbox.width,
                zoomY = viewportHeight / bbox.height,
                zoom = Math.min(zoomX, zoomY),

                // Extract the rotation from the node's matrix.
                m = node._node.getMatrix(),
                angle = -Math.atan2(m.b, m.a) * 180 / Math.PI,

                // Make the duration dependent on the length of the text.
                textLength = node.get("textContent").length,
                readDuration = textLength * 120, // 0.12s per char
                zoomDelta= 0.2 * textLength / 60,
                cx, cy, txf;
                
                textElements.push(node);
        
                travelSegments.push({
                    name: "segment_" + index,
                    position: {
                        x: bbox.x + bbox.width / 2,
                        y: bbox.y + bbox.height / 2
                    },
                    direction: angle,
                    zoom: zoom * 0.7,
                    runLength: 2000,
                    interpolators: noInterpolators
                });
        
                travelSegments.push({
                    name: "pause_" + index,
                    position: {
                        x: bbox.x + bbox.width / 2,
                        y: bbox.y + bbox.height / 2
                    },
                    direction: angle,
                    zoom: zoom * (0.7 + zoomDelta),
                    runLength: readDuration,
                    interpolators: noInterpolators
                });

                bbox = node._node.getBBox();
                txf = node._node.getAttribute("transform");
                cx = bbox.x + bbox.width / 2;
                cy = bbox.y + bbox.height / 2;

                // The flyOut animations are used to fade out the quotes when
                // the morphing animation starts.
                flyOut.push(new Animate({
                    node: node,
                    from: {
                        transform: {tx: 0, ty: 0, r: 0},
                        'fill-opacity': 1
                    },
                    to: {
                        transform: {
                            tx: (-1 + 2 * Math.random()) * viewportWidth,
                            ty: (-1 + 2 * Math.random()) * viewportHeight,
                            r: 360 * Math.random()
                        },
                        'fill-opacity': 0
                    },
                    transformTemplate:
                        txf +
                        "translate(#tx,#ty)" +
                        "rotate(#r," + cx + "," + cy + ")",
                    duration: 2,
                    easing: Easing.easingNone
                }));
                flyOut[flyOut.length - 1].onEnd(function () {
                    node.setStyle('display', 'none');
                });
            });

            // Add a final travel segment to move to a 'full view'
            travelSegments.push({
                name: "finalPosition",
                position: {
                    x: viewportWidth / 2,
                    y: viewportHeight / 2
                },
                direction: 0,
                zoom: 0.9,
                runLength: 1000,
                interpolators: noInterpolators
            });

            travelSegments.push({
                name: "final",
                position: {
                    x: viewportWidth / 2,
                    y: viewportHeight / 2
                },
                direction: 0,
                zoom: 1,
                runLength: 3000,
                interpolators: noInterpolators
            });

            camera.addTravelSegments(travelSegments);

            // When a "pause_n" ends, we hide the text at index n and show the
            // 'face<n>Initial' shape instead.
            camera.on("segmentComplete", function (evt) {
                var segment = evt.segment;
                
                if (segment.name.indexOf("pause_") === 0) {
                    var textIndex = Number(segment.name.substring("pause_".length));
                    // textElements[textIndex].setStyle("display", "none");

                    var shape = Y.one("#" + startShapePrefix +
                        textIndex + startShapeSuffix);
                    if (shape !== null) {
                        shape.setStyle("display", "inline");
                    }
                }                
            });

            var morphNow = function () {
                var n = animations.length;
                Y.Array.each(animations, function (anim) {
                    anim.run();
                });

                // At the end of the morphing animations, we show the artist's name and
                // Gandhi's full name.
                animations[n - 1].onEnd(function () {
                    effect.run(3);
                });
            };
            
            flyOut[0].onBegin(morphNow);

            // At the end of the camera, begin the morphing to Gandhi's portrait
            camera.on("complete", function () {
                for (var i = 0; i < flyOut.length; i++) {
                    flyOut[i].run(0.5);
                }
            });
            
            showPlayButton.onEnd(function () {
                quotes.setStyle("visibility", "visible");
                camera.action();
            }, 1);
        }
    }

    /**
     * Main entry point. Refer to the YUI documentation to understand how the
     * YUI framework loads scripts and handles dependencies.
     *
     * The following declares the modules required by the code (such as
     * 'anim-svg') and their dependencies.
     *
     * The onScriptsReady function is called when the DOM tree is ready.
     */
    YUI({
        groups: {
            svg: {
                combine: false,
                base: "../res/3.0/scripts/yui/",
                modules:  {
                    "node-svg": {
                        path: 'svg/node-svg-debug.js',
                        requires: ['node']
                    },
                    "dom-style-svg": {
                        path: 'svg/dom-style-svg-debug.js',
                        requires: ['node', 'dom-svg']
                    },
                    "dom-svg": {
                        path: 'svg/dom-svg-debug.js',
                        requires: ['dom']
                    },
                    "anim-timing": {
                        path: 'anim-timing/anim-timing-debug.js',
                        requires: ['anim', 'node-svg']
                    },
                    "anim-svg": {
                        path: 'svg/anim-svg-debug.js',
                        requires: ['anim', 'dom-style-svg']
                    },
                    "text-effects": {
                        path: '../tools/text-effects.js',
                        requires: ['anim-svg', 'anim-timing']
                    },
                    "asset-loader": {
                        path: '../tools/asset-loader.js',
                        requires: ['node', 'audio-events']
                    },
                    'audio-events': {
                        path: 'audio/audio-events-debug.js',
                        requires: ['node', 'events']
                    }
                }
            },
            utils: {
                combine: false,
                base: "../res/2.0/scripts/",
                modules: {
                    "dom-utils": {
                        path: "dom-utils.js"
                    }
                }
            }
        }// ,
        // filter: 'debug',
        // timeout: 10000
    }).use('anim-svg', 'anim-timing', 'camera', 'text-effects', 'asset-loader', function(Y) {
        Y.on('contentready', function () {
            onScriptsReady(Y);
        }, 'body');
    });


})();