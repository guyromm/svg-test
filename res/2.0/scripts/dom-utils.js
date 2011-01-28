/** =======================================================================
 *  Vincent Hardy
 *  License terms: see svg-wow.org
 *  CC0 http://creativecommons.org/publicdomain/zero/1.0/
 *  ======================================================================= */

(function () {
    // Use the sw (svgWow!) prefix for all the library.
    window.sw = window.sw ? window.sw : {};

    /**
     * Global function for getting an element by id concisely.
     */
    if (window.$ === undefined) {
        window.$ = function (id) {
            return document.getElementById(id);
        };
    }
    // Namespace constants
    sw.svgNS = "http://www.w3.org/2000/svg";
    sw.xlinkNS = "http://www.w3.org/1999/xlink";
    sw.wowNS = "http://www.svgopen.org/2004/svgWow";
    sw.xhtmlNS = "http://www.w3.org/1999/xhtml";
    
    // Default namespace prefixes
    var defaultNamespacePrefixes = {
        svg: sw.svgNS,
        xlink: sw.xlinkNS,
        sw: sw.wowNS,
        xhtml: sw.xhtmlNS
    };

    // =========================================================================
    // DOM Helpers
    // =========================================================================
    sw.firstElement = function () {
        var c = this.firstChild;
        var result = null;

        while (c !== null) {
            if (c.nodeType === Node.ELEMENT_NODE) {
                result = c;
                break;
            }
            c = c.nextSibling;
        }

        return result;
    };

    sw.nextElement = function () {
        var s = this.nextSibling;
        var result = null;

        while (s !== null) {
            if (s.nodeType === Node.ELEMENT_NODE) {
                result = s;
                break;
            }
            s = s.nextSibling;
        }

        return result;
    };

    sw.prevElement = function () {
        var s = this.prevSibling;
        var result = null;

        while (s !== null) {
            if (s.nodeType === Node.ELEMENT_NODE) {
                result = s;
                break;
            }
            s = s.prevSibling;
        }

        return result;
    };

    sw.removeAllChildren = function () {
        var c = this.firstChild;
        var nc;
        while (c !== null) {
            nc = c.nextSibling;
            this.removeChild(c);
            c = nc;
        }
    };

    sw.getMatrix = function () {
        var m = undefined, txf, svg;
        if (this.transform !== undefined) {
            txf = this.transform.baseVal.consolidate();
            if (txf === null) {
                svg = this.ownerSVGElement;
                m = svg.createSVGMatrix();
                txf = this.transform.baseVal.createSVGTransformFromMatrix(m);
                this.transform.baseVal.initialize(txf);
            } else {
                m = txf.matrix;
            }
        }
        return m;
    }

    sw.setMatrix = function (m) {
        var txf, svg;
        if (this.transform !== undefined) {
            svg = this.ownerSVGElement;
            txf = this.transform.baseVal.createSVGTransformFromMatrix(m);
            this.transform.baseVal.initialize(txf);
        }
        return this;
    }

    sw.getShowHandler = function () {
        var that = this;
        return function () {
            that.setAttribute("display", "inline");
        }
    };

    sw.getHideHandler = function () {
        var that = this;
        return function () {
            that.setAttribute("display", "none");
        }
    };

    /**
     * Global function for toggling the current display value.
     *
     * @param id the id of the element whose display should be toggled between
     *        'block' and 'none'
     */
    function toggleDisplay(id) {
        var elm = $(id);
        if(elm) {
            elm.style.display = (elm.style.display == "none" ? "block" : "none");
        }
    }

    // =============================================================================
    // Simple SVG API
    //
    // @see: http://www.w3.org/Graphics/SVG/WG/wiki/Simple_SVG_API
    // =============================================================================

    // List of SVG elements on which the setAttributes method is made available
    sw.svgElements = [
        "a",
        "altGlyph",
        "altGlyphDef",
        "altGlyphItem",
        "animate",
        "animateColor",
        "animateMotion",
        "animateTransform",
        "circle",
        "clipPath",
        "color-profile",
        "cursor",
        "definition-src",
        "defs",
        "desc",
        "ellipse",
        "feBlend",
        "feColorMatrix",
        "feComponentTransfer",
        "feComposite",
        "feConvolveMatrix",
        "feDiffuseLighting",
        "feDisplacementMap",
        "feDistantLight",
        "feFlood",
        "feFuncA",
        "feFuncB",
        "feFuncG",
        "feFuncR",
        "feGaussianBlur",
        "feImage",
        "feMerge",
        "feMergeNode",
        "feMorphology",
        "feOffset",
        "fePointLight",
        "feSpecularLighting",
        "feSpotLight",
        "feTile",
        "feTurbulence",
        "filter",
        "font",
        "font-face",
        "font-face-format",
        "font-face-name",
        "font-face-src",
        "font-face-uri",
        "foreignObject",
        "g",
        "glyph",
        "glyphRef",
        "hkern",
        "image",
        "line",
        "linearGradient",
        "marker",
        "mask",
        "metadata",
        "missing-glyph",
        "mpath",
        "path",
        "pattern",
        "polygon",
        "polyline",
        "radialGradient",
        "rect",
        "script",
        "set",
        "stop",
        "style",
        "svg",
        "switch",
        "symbol",
        "text",
        "textPath",
        "title",
        "tref",
        "tspan",
        "use",
        "view",
        "vkern"
    ];

    /**
     * This method automatically loads and creates DOM nodes.
     *
     * The symtax for the object is as follows;
     * - the tag property gives the object's tag name
     * - the ns property gives the object's namespace. Optional, defaults to the
     *   SVG namespace.
     * - the children property is a set of sub-objects with the same syntax.
     *
     * @param p_desc the object describing the element to create and initialize.
     * @param p_oInsertBefore Optional. the child before which the loaded content
     *        should be inserted
     * @return the element that was created.
     */
    sw.loadContent = function (p_desc, p_oInsertBefore) {
        var content;

        if (typeof p_desc === "string") {
            content = document.createTextNode(p_desc);
            this.appendChild(document.createTextNode(p_desc));
        } else if (typeof p_desc === "object") {
            // Save the reserved values first.
            var tagOrig = p_desc.tag;
            var nsOrig = p_desc.ns;
            var childrenOrig = p_desc.children;

            // Now, process the element.
            var tag = p_desc.tag;

            if (tag === undefined) {
                throw new Error(
                            "the element description requires a 'tag' property");
            }

            var ns = sw.svgNS;

            if (p_desc.ns !== undefined) {
                ns = p_desc.ns;
            }

            content = document.createElementNS(ns, tag);

            if (content === null || content === undefined) {
                throw new Error("was not able to create an element with tag " +
                                     tag + " in namespace " + ns);
            }

            var children = p_desc.children;

            delete p_desc.children;
            delete p_desc.tag;
            delete p_desc.ns;

            content.setAttributes(p_desc);

            if (children !== undefined && children !== null) {
                var nChildren = children.length;
                if (typeof nChildren === "number") {
                    for (var i = 0; i < nChildren; i++) {
                        var c = content.loadContent(children[i]);
                    }
                }
            }

            // Restore
            p_desc.children = childrenOrig;
            p_desc.tag = tagOrig;
            p_desc.ns = nsOrig;

            if (p_oInsertBefore === undefined) {
                p_oInsertBefore = null;
            }

            if (this.insertBefore !== undefined) {
                this.insertBefore(content, p_oInsertBefore);
            }
            sw.initIds(content);
        } else {
            throw new Error("loadContent requires an object or string parameter");
        }

        return content;
    }

    /**
    * The setAttributes method to be installed on all element classes.
    *
    * @param attributes an object with the attributes to set on the object this
    *        method is called on.
    */
    sw.setAttributes = function (attributes) {
        var value,
            ns = null,
            nsPrefix,
            nsIndex;

        for (var p in attributes) {
            if (attributes.hasOwnProperty(p) === true) {
                nsIndex = p.indexOf(":");
                if (nsIndex !== -1) {
                    nsPrefix = p.substring(0, nsIndex);
                    ns = this.lookupNamespaceURI(nsPrefix);
                    if (ns === null) {
                        // No namespace declaration was found on the node.
                        // This may be because the node is not in the tree
                        // yet. The best thing which can be done here is to
                        // check if we can find the namespace definition on the
                        // document element.
                        ns = document.documentElement.lookupNamespaceURI(nsPrefix);

                        // If the namespace is still not found, check the
                        // default list of known namespaces
                        if (defaultNamespacePrefixes[nsPrefix] !== undefined) {
                            ns = defaultNamespacePrefixes[nsPrefix];
                        }
                    }
                } else {
                    ns = null;
                }
                value = attributes[p];
                try {
                    this.setAttributeNS(ns, p, value);
                } catch (e) {
                    console.log("could not set " + p + " for " + ns + " to " + value);
                }
            }
        }
    };

    /**
     * Get a number of attributes on this element and return them in an object.
     *
     * @param attr1, ... attrN a variable length list of attributes to retrieve
     *        from this element.
     * @return an object whose properties are the requested attribute values
     */
    sw.getAttributes = function () {
        var result = {};
        var nsIndex = -1;
        var attribute;
        var ns = null;
        var nsPrefix;

        for (var i = 0; i < arguments.length; i++) {
            attribute = arguments[i];
            nsIndex = attribute.indexOf(":");
            if (nsIndex !== -1) {
                nsPrefix = attribute.substring(0, nsIndex);
                ns = this.lookupNamespaceURI(nsPrefix);
                if (ns === null) {
                    ns = svg.lookupNamespaceURI(nsPrefix);
                }
            } else {
                ns = null;
            }
            result[attribute] = this.getAttributeNS(ns, attribute);
        }

        return result;
    }

    /**
     * Utility to get the bounds of an object in the nearest viewport space.
     */
    sw.getViewportBBox = function () {
        var bbox = this.getBBox();
        var vBbox = null;
        var viewport = this.nearestViewportElement;
        var ctm = this.getTransformToElement(viewport);
        if (bbox !== null) {
            // This is one of the short-comings of SVG: there is no way to get
            // the bbox in the desired coordinate space. So we have to transform
            // the bounds and compute the box from that, which leads to
            // boxes which might be larger than needed (e.g., where there are
            // rotations). However, for common cases, this is doing the job.
            var points = [
                {x: bbox.x, y: bbox.y},
                {x: bbox.x + bbox.width, y: bbox.y},
                {x: bbox.x, y: bbox.y + bbox.height},
                {x: bbox.x + bbox.width, y: bbox.y + bbox.height}
            ];

            var tPoints = [
                {}, {}, {}, {}
            ];

            for (var i = 0; i < 4; i++) {
                ctm.transformPoint(points[i], tPoints[i]);
            }

            var minX = tPoints[0].x;
            var minY = tPoints[0].y;
            var maxX = tPoints[0].x;
            var maxY = tPoints[0].y;

            for (i = 1; i < 4; i++) {
                if (tPoints[i].x < minX) {
                    minX = tPoints[i].x;
                } else if (tPoints[i].x > maxX) {
                    maxX = tPoints[i].x;
                }

                if (tPoints[i].y < minY) {
                    minY = tPoints[i].y;
                } else if (tPoints[i].y > maxY) {
                    maxY = tPoints[i].y;
                }
            }

            vBbox = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }
        return vBbox;
    };

    /**
     * Transforms a point.
     *
     * @param p_pt an object with x/y properties
     * @param p_oResult an object where the transformed point is stored
     * @return the result
     */
    sw.transformPoint = function (p_pt, p_oResult) {
        var result = p_oResult;
        if (p_oResult === undefined) {
            result = {};
        }

        result.x = this.a * p_pt.x + this.c * p_pt.y + this.e;
        result.y = this.b * p_pt.x + this.d * p_pt.y + this.f;

        return result;
    };

    /**
     * Sets the matrix to identity
     */
    sw.toIdentity = function () {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
        return this;
    };


    /**
    * Installs the setAttributes method on the prototype object which holds the
    * setAttribute (no 's') method.
    *
    * @param documentElement if undefined, defaults to document.documentElement,
    *        assuming an SVG root.
    * @param scope if undefined, defaults to the global scope.
    */
    sw.init = function (documentElement, scope) {
        if (documentElement === undefined) {
            documentElement = document.documentElement;
        }
        if (scope === undefined) {
            scope = window;
        }
        var errors = {};

        var hasErrors = false;

        for (var i = 0; i < sw.svgElements.length; i++) {
            var tag = sw.svgElements[i];
            var elt = document.createElementNS(sw.svgNS, tag);
            if (elt !== null && elt !== undefined) {
                var proto = elt.constructor.prototype;
                if (proto.setAttributes === undefined) {
                    proto.setAttributes = sw.setAttributes;
                }
                if (proto.getAttributes === undefined) {
                    proto.getAttributes = sw.getAttributes;
                }
                if (proto.loadContent === undefined) {
                    proto.loadContent = sw.loadContent;
                }
                if (proto.firstElmeent === undefined) {
                    proto.firstElement = sw.firstElement;
                }
                if (proto.nextElement === undefined) {
                    proto.nextElement = sw.nextElement;
                }
                if (proto.prevElement === undefined) {
                    proto.prevElement= sw.prevElement;
                }
                if (proto.removeAllChildren === undefined) {
                    proto.removeAllChildren = sw.removeAllChildren;
                }
                if (proto.getMatrix === undefined) {
                    proto.getMatrix = sw.getMatrix;
                }
                if (proto.setMatrix === undefined) {
                    proto.setMatrix = sw.setMatrix;
                }
                if (proto.getViewportBBox === undefined) {
                    proto.getViewportBBox = sw.getViewportBBox;
                }
                if (proto.getHideHandler === undefined) {
                    proto.getHideHandler = sw.getHideHandler;
                }
                if (proto.getShowHandler === undefined) {
                    proto.getShowHandler = sw.getShowHandler;
                }
            } else {
                errors[tag] = "Constructed element was " + elt;
                hasErrors = true;
            }
        }

        // Hook a transformPoint and toIdentity on SVGMatrix
        var svg = documentElement;
        var isSVG = true;
        if (svg.nodeName !== "svg") {
            svg = document.createElementNS(sw.svgNS, "svg");
            isSVG = false;
        }

        var m = svg.createSVGMatrix();
        if (m.constructor.prototype.transformPoint === undefined) {
            m.constructor.prototype.transformPoint = sw.transformPoint;
        }
        if (m.constructor.prototype.toIdentity === undefined) {
            m.constructor.prototype.toIdentity = sw.toIdentity;
        }

        if (hasErrors === true) {
           throw new Error("Could not install setAttributes on all elements");
        }

        document.constructor.prototype.loadContent = sw.loadContent;

        sw.initIds(documentElement);

        // Make the root 'svg' element available in the global scope
        if (isSVG) {
            scope.svg = documentElement;
        }
    }

    /**
     * Processes ids on elements and sets a variable of that name on their parents.
     *
     * @param elt the element to process. Its children are processed recursively.
     */
    sw.initIds = function (elt) {
        var id = elt.id;
        if (id !== undefined &&
            id !== null &&
            id !== "" &&
            (typeof id === "string") &&
            elt.parentNode !== undefined &&
            elt.parentNode !== null &&
            elt.parentNode[id] === undefined) {
            sw.addElementShortHand(id, elt, elt.parentNode);
        }

        var c = elt.firstChild;
        while (c !== null) {
            if (c.nodeType === Node.ELEMENT_NODE) {
                sw.initIds(c);
            }
            c = c.nextSibling;
        }
    }

    /**
     * Adds a property of the name "id" to the parent chain, starting with the
     * parent parameter. If the parent itself has an id, then the property is set
     * on that node. Otherwise, the property is set on the first ancestor with an
     * id
     *
     * @param id the name of the property to set
     * @param node the value of the property to set
     * @param parent the first candidate parent on which the property might be set
     */
    sw.addElementShortHand = function(id, node, parent) {
        // Note that parent.id is the value of the 'id' attribute on parent
        // whereas parent[id] is the value of the property with the name of the
        // id parameter (e.g., 'myRect') on parent.
        if (parent.id !== undefined && parent.id !== "") {
            if (parent[id] === undefined) {
                parent[id] = node;
            }
        } else if (parent.parentNode !== null && parent.parentNode !== parent) {
            sw.addElementShortHand(id, node, parent.parentNode);
        } else {
            if (document[id] === undefined) {
                document[id] = node;
            }
        }
    }


    /**
     * Helper method to find out if an element is a descendant of a given parent
     * node.
     *
     * @param candidate the element that may be the descendant of the parent.
     * @param parent the parent under which the candidate may be
     */
    sw.isDescendantOf = function (candidate, parent) {
        var isDescendant = false;
        var p = candidate;

        while (p !== parent && p.parentNode !== null) {
            p = p.parentNode;
        }

        return (p === parent);
    }

    /**
     * Helper method: converts a <code>String</code> to an <code>Element</code>
     * and throws an error if the element cannot be found. If the parameter is
     * not a string, it is returned as is.
     */
    sw.stringToElement = function (p_element) {
        var element = p_element;

        if (typeof p_element === "string") {
            element = document.getElementById(p_element);
        }

        if (element === null) {
            throw new Error ("Could not find element with id " + p_element);
        }

        return element;
    }
})();