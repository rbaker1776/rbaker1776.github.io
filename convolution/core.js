

const plotScale = 2.5;

class Plotter
{
    constructor(canvas, updateFunc)
    {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.aspect = canvas.width / canvas.height;
        this.update = updateFunc;

        this.resize = this.resize.bind(this);
        this.redraw = this.redraw.bind(this);
    }

    drawAxes()
    {
        this.ctx.beginPath();

        this.ctx.moveTo(0, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);

        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawGrid()
    {
        this.ctx.beginPath();
       
        const interval = Math.pow(10, Math.floor(Math.log10(plotScale)));

        for (let i = 1; i <= Math.floor(plotScale * this.aspect / interval); i++)
        {
            const drawXR = (this.canvas.width / 2) + (i * interval) * (this.canvas.height / (2 * plotScale));
            const drawXL = (this.canvas.width / 2) - (i * interval) * (this.canvas.height / (2 * plotScale));
            this.ctx.moveTo(drawXR, 0);
            this.ctx.lineTo(drawXR, this.canvas.height);
            this.ctx.moveTo(drawXL, 0);
            this.ctx.lineTo(drawXL, this.canvas.height);
        }

        for (let i = 1; i <= Math.floor(plotScale / interval); i++)
        {
            const drawYT = (this.canvas.height / 2) + (i * interval) * (this.canvas.height / (2 * plotScale));
            const drawYB = (this.canvas.height / 2) - (i * interval) * (this.canvas.height / (2 * plotScale));
            this.ctx.moveTo(0, drawYT);
            this.ctx.lineTo(this.canvas.width, drawYT);
            this.ctx.moveTo(0, drawYB);
            this.ctx.lineTo(this.canvas.width, drawYB);
        }

        this.ctx.strokeStyle = "grey";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    plotFunction(func, color)
    {
        let yPrev = (this.canvas.height / 2) * (1 - func[0] / plotScale);
        this.ctx.beginPath();
        this.ctx.moveTo(-1, yPrev);

        for (let i = 0; i < func.length; ++i)
        {
            const drawX = i;
            const drawY = Math.min(Math.max(
                ((this.canvas.height / 2) * (1 - func[i] / plotScale))
            , -3), this.canvas.height + 3);

            this.ctx.lineTo(drawX, drawY);

            yPrev = drawY;
        }

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
    }

    redraw() { return this.update.call(this); }

    resize()
    {
        const width = window.innerWidth;
        const height = 300;

        this.canvas.width = width * window.devicePixelRatio;
        this.canvas.height = height * window.devicePixelRatio;
        this.aspect = width / height;

        this.ctx.scale(window, window.devicePixelRatio, window.devicePixelRatio);

        this.redraw();
    }
}

function evaluate(func, tMin, tMax, deltaT)
{
    func = parse(func);
    func = func.replace(/\bt\b/g, "(t * deltaT + tMin)");

    return Array.from(
        { length: Math.ceil((tMax - tMin) / deltaT) },
        (_, t) => eval(func)
    );
}

function convolve(ft, gt, deltaT)
{
    let convolution = Array.from(
        { length: ft.length + gt.length - 1 },
        (_, t) => {
            let sum = 0;
            for (let T = Math.max(0, t - (ft.length - 1)); T < Math.min(t, ft.length - 1); T++)
                sum += ft[t - T] * gt[T] * deltaT;
            return sum;
        }
    ).slice(Math.floor(ft.length / 2), Math.floor(ft.length * 3 / 2)); 

    return convolution;
}

function dropdownFunc(selection)
{
    switch (selection)
    {
        case "unitStep":    return "u(t)";
        case "pulse":       return "u(t) - u(t-1)";
        case "expDecay":    return "exp(-t) * u(t)";
        case "triangle":    return "t * u(t) * u(1-t) + (2-t) * u(t-1) * u(2-t)";
        case "dampedSine":  return "sin(4*t) * exp(-t) * u(t)";
        case "dampedSq":    return "(-1)^floor(2*t) * exp(-floor(2*t)/2) * u(t)"
        case "biphasic":    return "exp(-t) * (u(t) * u(1-t) - u(t-1) * u(2-t))";
        case "triphasic":   return "exp(-t/2) * (u(t) * u(1-t) - u(t-1) * u(2-t) + u(t-2) * u(3-t))";
        default: return "";
    }
}

functionPlotter = new Plotter(document.getElementById("plotCanvas"), function() {
    const inputFt = parse(document.getElementById("fInput").value);
    const inputGt = parse(document.getElementById("gInput").value)

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawAxes();
    this.drawGrid();
    
    const expansionFactor = 2;

    const tMin = -expansionFactor * this.aspect * plotScale;
    const deltaT = -2 * tMin / (this.canvas.width * expansionFactor);

    const ft = evaluate(inputFtField.value, tMin, -tMin, deltaT);
    const gt = evaluate(inputGtField.value, tMin, -tMin, deltaT);
    const convolution = convolve(ft, gt, deltaT);

    const beginIdx = ft.length * (1 / 2 - 1 / (2 * expansionFactor));
    const endIdx = ft.length * (1 / 2 + 1 / (2 * expansionFactor));

    if (displayGtBox.checked)
        this.plotFunction(gt.slice(beginIdx, endIdx), "orange");
    if (displayFtBox.checked)
        this.plotFunction(ft.slice(beginIdx, endIdx), "red");
    if (displayConvolutionBox.checked)
        this.plotFunction(convolution.slice(beginIdx, endIdx), "cyan");
});

slidePlotter = new Plotter(document.getElementById("slideCanvas"), function() {
    const inputFt = parse(document.getElementById("fInput").value)
    const inputGt = parse(document.getElementById("gInput").value)

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawAxes();
    this.drawGrid();
    
    const expansionFactor = 2;

    const tMin = -expansionFactor * this.aspect * plotScale;
    const deltaT = -2 * tMin / (this.canvas.width * expansionFactor);
    const tOffset = tOffsetSlider.value;

    const ft = evaluate(inputFtField.value, tMin, -tMin, deltaT);
    const gt = evaluate(inputGtField.value, tMin, -tMin, deltaT);
    const convolution = convolve(ft, gt, deltaT);

    const beginIdx = ft.length * (1 / 2 - 1 / (2 * expansionFactor));
    const endIdx = ft.length * (1 / 2 + 1 / (2 * expansionFactor));

    const ftTrimmed = ft.slice(beginIdx, endIdx);
    const gtBackwards = Array.from(
        { length: gt.length / expansionFactor},
        (_, i) => gt[Math.floor(endIdx + tOffset / deltaT) - i]
    );

    this.ctx.beginPath();

    for (let i = 0; i < ftTrimmed.length; i++)
    {
        if (ftTrimmed[i] != 0 && gtBackwards[i] != 0)
        {
            this.ctx.moveTo(i, this.canvas.height / 2);
            const drawY = Math.min(Math.max(
                ((this.canvas.height / 2) * (1 - (ftTrimmed[i] * gtBackwards[i]) / plotScale))
            , -1), this.canvas.height + 1);

            this.ctx.lineTo(i, drawY);
        }
    }

    this.ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.plotFunction(gtBackwards, "orange");
    this.plotFunction(ftTrimmed, "red");
    this.plotFunction(convolution.slice(beginIdx, endIdx), "cyan");
});

const e = Math.exp(1);

function dd(t)
{
    return ((
        t == 0 
    ) ? (1 / 0.00001) : 0);
}

const inputFtField = document.getElementById("fInput");
const inputGtField = document.getElementById("gInput");

const optionsFt = document.getElementById("fOptions");
const optionsGt = document.getElementById("gOptions");

const displayFtBox = document.getElementById("toggleFt");
const displayGtBox = document.getElementById("toggleGt");
const displayConvolutionBox = document.getElementById("toggleConvolution");

const tOffsetSlider = document.getElementById("tOffsetSlider");

//functionPlotter.canvas.addEventListener("wheel", functionPlotter.zoom);
//slidePlotter.canvas.addEventListener("wheel", slidePlotter.zoom);

window.addEventListener("resize", function() {
    functionPlotter.resize();
    slidePlotter.resize();
});

inputFtField.addEventListener("keydown", function(event) {
    optionsFt.value = "default"; 
    setTimeout(functionPlotter.redraw, 100);
    setTimeout(slidePlotter.redraw, 100);
});

inputGtField.addEventListener("keydown", function(event) {
    optionsGt.value = "default"; 
    setTimeout(functionPlotter.redraw, 100);
    setTimeout(slidePlotter.redraw, 100);
});

optionsFt.addEventListener("change", function() {
    const selection = optionsFt.value;
    inputFtField.value = dropdownFunc(selection);
    functionPlotter.redraw();
    slidePlotter.redraw();
});

optionsGt.addEventListener("change", function() {
    const selection = optionsGt.value;
    inputGtField.value = dropdownFunc(selection);
    functionPlotter.redraw();
    slidePlotter.redraw();
});

displayFtBox.addEventListener("change", (event) => {
    setTimeout(functionPlotter.redraw, 100);
    setTimeout(slidePlotter.redraw, 100);
});

displayGtBox.addEventListener("change", (event) => {
    setTimeout(functionPlotter.redraw, 100);
    setTimeout(slidePlotter.redraw, 100);
});

displayConvolutionBox.addEventListener("change", (event) => {
    setTimeout(functionPlotter.redraw, 100);
    setTimeout(slidePlotter.redraw, 100);
});

tOffsetSlider.addEventListener("input", (event) => {
    setTimeout(slidePlotter.redraw, 100);
});

functionPlotter.resize();
slidePlotter.resize();
