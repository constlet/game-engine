
// App Class
class App {

    // constructor
    constructor(name, settings = {}) {
        console.log(App.resourceType);
        console.log(App.resourceTypeString);
        
        // settings
        this.name = name || "New Project";
        this.settings = {
            fps: -1,
            mode3D: false, 
            clearColor: "#000",
            clearDisplayBuffer: true,
            manualUpdate: false,
            showFPS: true,
            debug: true,
      contextSettings: {
        antialias: false,
        preserveDrawingBuffer: false,
        preferWebGl2: true,
        powerPreference: "high-performance",
        alpha: false
      }
        };
        Object.assign(this.settings, settings);

        // lifecycle hooks
        this.onInit = null;
        this.onUpdate = null;
        this.onDestroy = null;
        
        // canvas
        this.canvas = null;
        this.ctx = null;
        
        // states
        this.started = false;
        this.updating = false;
        this.initialized = false;
        
        // timing
        this.dt = 0;            // app delta time
        this.time = 0;          // app run time elapsed
        this.timeStart = 0;     // app start time
        this.timeLast = 0;      // app last frame time
        this.fps = 0;           // app fps
        this.fpsReal = 0;       // app fps real
        this.frameCounter = 0;  // app frame counter (per second)

        // animation
        this.animationFrame = null;
        
        // inputs
        this.inputs = {
            mouse: {
                
            },
            keyboard: {
                
            }
        }
        
        // events
        this.events = {};
        
        // resources
        this.resources = {      // resources data
            IMAGE: {},
            AUDIO: {},
            VIDEO: {},
            MODEL: {},
        };    
        this.resources$ = null; // resources div
        
        // cameras
        
        // shaders
        
        // >>> FRAME Fallback System
        window.requestAnimationFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(_animationTimestamp) { return setTimeout(this.update, 1000 / 60) }; // simulate calling code 60 
        window.cancelAnimationFrame = window.cancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            function(requestID) { clearTimeout(requestID) }; // fall back
        
        // init
        this._init();
    }
    
    // app init
    _init() {
        if (!this.initialized) {
            this.initialized = true;
            this._initCanvas();
            this._initResources();
            this._initEvents();
            
            // init event
            if (typeof this.onInit === "function") {
                this.onInit();
            }
        }
    }
    
    // app start
    start() {
        this.started = true;
        this.startTime = 0;

        // start animation frame (main loop)
        if (!this.settings.manualUpdate) {
            if (!this.animationFrame) {
                this.animationFrame = window.requestAnimationFrame(this.update.bind(this));
            }
        }
    }
    
    // app stop
    stop() {
        this.started = false;
        this.updating = false;
        if (this.animationFrame) {
            window.cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    // app destroy
    destroy() {
        
        // stop animation frame
        this.stop();
        
        // destroy canvas
        this._destroyCanvas();
        
        // destroy resources
        this.clearResources();
        
        // destroy event
        if (typeof this.onDestroy === "function") {
            this.onDestroy();
        }
        
        this.initialized = false;
    }
    
    update(time) {
        this.updating = true;
        
        // canvas refs
        const { ctx, canvas } = this;
        
        // timing
        this.time = time - this.startTime;
        this.dt = time - this.timeLast;
        this.timeLast = time;

        // fps
        this.fpsReal += this.dt;
        this.frameCounter += 1;
        if (this.fpsReal >= 1000 && this.frameCounter > 0)
        {
            this.fps = this.frameCounter;
            this.frameCounter = 0;
        }
        this.fpsReal %= 1000;
        
        // clear the canvas
        if (this.settings.clearDisplayBuffer) {
            const w = canvas.width;
            const h = canvas.height;
            if (this.settings.clearColor) {
                if (ctx.fillStyle !== this.settings.clearColor) {
                    ctx.fillStyle = this.settings.clearColor;
                }
                ctx.fill();
            }
            else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            ctx.restore();
        }
        
        // update event
        if (typeof this.onUpdate === "function") {
            this.onUpdate(this.dt);
        } 
        
        // ui
        
        // debug
        if (this.settings.showFPS) {
            ctx.font = '32px Arial';
            ctx.fillStyle = "#ffffff";
            ctx.fillText("" + this.fps, 10, 34);
            ctx.restore();
        }
        
        // frame states
        if (this.settings.fps > 0)
        {
            // frame cap -> fps
            setTimeout(() => {
                this.animationFrame = window.requestAnimationFrame(this.update.bind(this));
            }, 1000 / this.settings.fps);
        }
        else {
            // no frame cap
            this.animationFrame = window.requestAnimationFrame(this.update.bind(this));
        }

    }
    
    // Events //
    _initEvents() {
        const { events } = this;
        
        // window 
        events.windowResize = (e) => {
            this._resizeCanvas();
        }
        window.addEventListener("resize", events.windowResize.bind(this));
    }
    
    // Canvas //
    _initCanvas() {

        // setup body
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";

        /*
            Use multiple canvas's for layers
        */ 
        // setup canvas
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.style.width = "100vw";
            this.canvas.style.height = "100vh";
            document.body.appendChild(this.canvas);
        }
        this.canvas.id = "scene";
        
        // setup context
        const renderingType = this.settings.mode3D ? "webgl2" : "2d";
        const ctx = this.canvas.getContext(renderingType, this.settings.contextSettings);
        this.ctx = ctx;
        ctx.shadowColor = null;
        ctx.save(); // save ctx draw state and settings

        // fix DPI
        this._resizeCanvas();
    }
    
    _destroyCanvas() {
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
    }
    
    _resizeCanvas(width = "100vw", height = "100vh") {
        if (!this.initialized) return;
        const { canvas, ctx, settings } = this;
        
        canvas.style.width = width;
        canvas.style.height = height;
        
        // get DPI
        let dpi = window.devicePixelRatio;

        //get CSS height
        //the + prefix casts it to an integer
        //the slice method gets rid of "px"
        let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
        //get CSS width
        let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
        //scale the canvas
        canvas.setAttribute('height', style_height * dpi);
        canvas.setAttribute('width', style_width * dpi);
        
        // clear background
        const w = canvas.width;
        const h = canvas.height;
        ctx.rect(0, 0, w, h);
        ctx.fillStyle = settings.clearColor;
        ctx.fill();
        ctx.restore();
    }
    
    setCanvas(canvasElement) {
        if (typeof canvasElement === "element")
            this.canvas = canvasElement;

        if (this.initialized) {
            this._initCanvas();
        }
    }
    
    // Resources //
    static resourceType = {
        NONE: 0,
        IMAGE: 1,
        AUDIO: 2,
        VIDEO: 3,
        MODEL: 4
    }
    static resourceTypeString = {};
    
    _initResources() {
        const resources$ = document.createElement("div");
        resources$.style.display = "none";
        this.resources$ = resources$;
    }
    
    addResource(type, id, src, preload = true) {
        const { resourceType, resourceTypeString } = App;

        const typeString = resourceTypeString["" + type];
        
        if (this.checkResourceExists(type, id)) {
            console.log("resource already exists:", typeString, id);
            return null;
        }
        
        // resource id
        // let resId = id;
        // while (!this.resources[typeString].hasOwnProperty(resId)) {
        //     resId = ("resource_" + typeString.toLowerCase() + "_" Math.round(Math.random() * 10000000));
        //     console.log("Asset Id:", assetId);
        // }
  
        // create resource elements
        let element = null;
        switch (type) {
            case resourceType.IMAGE: 
                element = document.createElement("img");
                element.setAttribute("crossorigin", "anonymous");
                element.src = src;
                break;
                
           case resourceType.AUDIO: 
                element = document.createElement("audio");
                element.setAttribute("crossorigin", "anonymous");
                element.src = src;                
                break;
                
           case resourceType.VIDEO: 
                element.setAttribute("crossorigin", "anonymous");
                element = document.createElement("video");
                element.src = src;                
                break;
            
            case resourceType.NONE:
            default:
                //console.log("");
                break;
        }
        
        // create resource data
        const resource = {
            id,
            src,
            type,
            typeString,
            element,
            preload,
            loaded: false,
            loading: false,
            failed: false,
            loadedAt: -1,
        } 
        
        // append data
        this.resources[typeString][id] = resource;
        
        // preload
        if (preload) {
            this._loadResource(resource);
        }
        
        return resource;
    }
    
    removeResource(type, id) {
        if (this.checkResourceExists(type, id)) {
            const { resourceType, resourceTypeString } = App;
            const typeString = resourceTypeString["" + type];
            const resource = this.resources[typeString][id];
            
            // unload
            if (resource.element) {
                resource.element.remove();
                resource.element = null;
            }
            
            // delete data
            delete this.resources[typeString][id];
        }
    }
    
    clearResources() {
        for (let type in this.resources) {
            const resourcesTypes = this.resources[type];
            for (let id in resourcesTypes) {
                this.removeResource(type, id);
            }
        }
    }
    
    getResource(type, id) {
        if (this.checkResourceExists(type, id)) {
            
            const { resourceTypeString } = App;
            const typeString = resourceTypeString["" + type];
            
            const resource = this.resources[typeString][id];
            if (!resource.loaded) {
                this._loadResource(resource);
            }
            return resource;
        }
        
        return null;
    }
        
    checkResourceExists(type, id) {
        const { resourceTypeString } = App;
        const typeString = resourceTypeString["" + type];
        if (typeString &&
            id &&
            this.resources.hasOwnProperty(typeString)) {
            const resourceTypeGroup = this.resources[typeString];
            if (resourceTypeGroup.hasOwnProperty(id)) {
                return true;
            }
        }
        return false;
    }
    
    _loadResource(resource) {
        if (resource) {
            if (!resource.loaded && !resource.failed && !resource.loading) {
                resource.loading = true;
                
                // element resource
                if (resource.element) {
                    this.resources$.appendChild(resource.element);
                    resource.element.addEventListener('load', (event) => {
                        resource.loadedAt = Date.now();
                        resource.loading = false;
                        resource.loaded = true;
                        // debug
                        if (this.settings.debug) console.log('Resource loaded:', resource);                
                    });
                    resource.element.addEventListener('error', (event) => {
                        resource.loading = false;
                        resource.failed = true;
                        // debug
                        if (this.settings.debug) console.log('Resource failed to load:', resource);
                    });
                }
            }
        }
    }
        
    // Rendering //
    drawImage(id, x, y, w, h, color = "") {
        const { canvas, ctx } = this;
        const { element } = this.getResource(App.resourceType.IMAGE, id);
        
        if (color) {
            ctx.fillStyle = color;
        }

    let wh = [];
    if (w > 0 && h > 0)
    {
      wh = [w, h];
    }

        ctx.drawImage(element, Math.round(x), Math.round(y), ...wh);
        ctx.restore();
    }

  drawText(text, x, y, color = "") {
    const { canvas, ctx } = this;
        
        if (color) {
            ctx.fillStyle = color;
        }
        ctx.fillText(text, x, y);
        ctx.restore();
    }

  drawGradient(x, y, w, h, color1, color2) {
    const { canvas, ctx } = this;
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
        ctx.restore();
  }
    
    // Utilities //
    
 
    // engine init
    __staticInit = (function() {
        
        // flip resource type enum
        Object.keys(App.resourceType).forEach((key) => {
            App.resourceTypeString["" + App.resourceType[key]] = key;
        });
        
    })();
}

class ResourceManager extends App {
    
}



// fire up app
const options = {
    fps: -1,
    mode3D: false, 
    clearColor: "",
    clearDisplayBuffer: true,
    manualUpdate: false,
    showFPS: true,
    debug: true,
    contextSettings: {
        antialias: false,
        preserveDrawingBuffer: false,
        preferWebGl2: true,
        powerPreference: "high-performance",
        alpha: true
    }
};
const app = new App("Test Project", options);

// add resources
app.addResource(App.resourceType.IMAGE, "s_pixelCar", "https://images-na.ssl-images-amazon.com/images/I/21%2Bj-HRynIL.png", true);

// update
app.onUpdate = (dt) => {
    const x = 200 + Math.cos(app.time / 1000) * 100;
    const y = 0;
  //app.drawGradient(0, 0, app.canvas.width, app.canvas.height, "#C178DF", "#65B7F4");
    app.drawImage("s_pixelCar", x, y, 100, 100);
  app.drawText("Hello World!", x, y + 100, "#fff");
};

// start app
app.start();