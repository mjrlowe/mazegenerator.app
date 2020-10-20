import { Maze } from "https://x.nest.land/maze_generator@0.3.0/mod.js";

const mazeSettingsForm = document.getElementById("mazeSettingsForm");
const drawerTab = document.getElementById("drawerTab");
const pngButton = document.getElementById("pngButton");
const txtButton = document.getElementById("txtButton");

let animationTime = 0;
let playing;
updatePlaying(true);

let maze;

function stepAnimation() {
  let inputtedAnimationRate = parseFloat(mazeSettingsForm.animationRate.value);
  const animationRate = Math.pow(1 - parseFloat(inputtedAnimationRate), 3);

  if (animationRate === 0) {
    maze.generate();
  } else {
    animationTime += 0.01 / animationRate;
    while (animationTime > 0 && !maze.finishedGenerating) {
      maze.step();
      animationTime--;
    }
  }

  updateDisplay();
}

function updateUrl() {
  const params = {};
  for (const input of mazeSettingsForm.elements) {
    if (input.type == "number" || input.type == "range") {
      let value = parseFloat(input.value);
      if (input.hasAttribute("min")) {
        value = Math.max(parseFloat(input.getAttribute("min")), value);
      }
      if (input.hasAttribute("max")) {
        value = Math.min(parseFloat(input.getAttribute("max")), value);
      }
      if (value != parseFloat(input.value)) {
        input.value = value;
      }
      if (isNaN(value)) value = 0;
      if (input.name != "") params[input.name] = value;
    } else {
      if (input.name != "") params[input.name] = input.value;
    }
  }

  history.replaceState(null, "", "#" + new URLSearchParams(params).toString());
  //console.log("Updated Maze URL: " + location.href);
}

function generate() {
  maze = Maze.create({
    width: parseInt(mazeSettingsForm.gridWidth.value),
    height: parseInt(mazeSettingsForm.gridHeight.value),
    seed:
      parseInt(mazeSettingsForm.randomSeed.value) ??
      mazeSettingsForm.randomSeed.value ??
      0,
    algorithm: mazeSettingsForm.algorithm.value
  });

  if (playing) {
    stepAnimation();
  } else {
    updateDisplay();
  }
}

function randomizeSeed() {
  const randomSeed = mazeSettingsForm.randomSeed;
  randomSeed.value = Math.floor(Math.random() * parseInt(randomSeed.max));
}

function animate() {
  requestAnimationFrame(animate);

  if (!playing) return;

  stepAnimation();
}

function updateDisplay() {
  let canvas = document.getElementsByTagName("canvas")[0];
  let ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = mazeSettingsForm.backgroundColor.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  maze.display({
    mainColor: mazeSettingsForm.mainColor.value,
    backgroundColor: mazeSettingsForm.backgroundColor.value,
    lineThickness: mazeSettingsForm.lineThickness.value,
    asLine: mazeSettingsForm.asLine.checked,
    lineCap: mazeSettingsForm.lineCap.value,
    coloringMode: mazeSettingsForm.coloringMode.value,
    colorScheme: mazeSettingsForm.colorScheme.value
  });
}

function loadStateFromUrl() {
  const params = new URLSearchParams(location.hash.slice(1));
  for (const entry of params) {
    const input = mazeSettingsForm[entry[0]];
    if (input != undefined) input.value = entry[1];
  }
}

function updatePlaying(newValue) {
  playing = newValue;
  mazeSettingsForm.playButton.innerText = playing ? "pause" : "play";
}

window.addEventListener("hashchange", function() {
  loadStateFromUrl();
  generate();
});

mazeSettingsForm.addEventListener("input", function(event) {
  if (event.target.name === "animationRate") {
    updateUrl();
  } else if (
    event.target.name === "mainColor" ||
    event.target.name === "backgroundColor" ||
    event.target.name === "lineThickness" ||
    event.target.name === "asLine" ||
    event.target.name === "lineCap"
  ) {
    updateUrl();
    updateDisplay();
  } else if (event.target.name != "fileName") {
    // Don't reset on editing the filename.
    generate();
  }
});

mazeSettingsForm.addEventListener("click", function(event) {
  if (event.target.id === "randomSeedButton") {
    randomizeSeed();
    generate();
  } else if (event.target.id === "resetButton") {
    console.log("resetting", maze);
    generate();
  } else if (event.target.id === "playButton") {
    updatePlaying(!playing);
  } else if (event.target.id == "stepButton") {
    updatePlaying(false);
    maze.step();
    updateDisplay();
  }
});

drawerTab.addEventListener("click", function() {
  if (document.documentElement.classList.contains("closed-drawer")) {
    document.documentElement.classList.remove("closed-drawer");
  } else {
    document.documentElement.classList.add("closed-drawer");
  }
});

pngButton.addEventListener("click", function() {
  const fileName = document.getElementById("fileName");
  const dataUrl = canvas.toDataURL("image/png");
  const anchor = document.createElement("a");
  const url = dataUrl;
  anchor.href = url;
  anchor.download = fileName.value;
  anchor.target = "_blank";
  anchor.dispatchEvent(new MouseEvent("click"));
});

txtButton.addEventListener("click", function() {
  let text = "Downloaded from: " + location.href + "\n";
  text += maze.getString();

  const fileName = document.getElementById("fileName");
  const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
  const anchor = document.createElement("a");
  const url = dataUrl;
  anchor.href = url;
  anchor.download = fileName.value + ".txt";
  anchor.target = "_blank";
  anchor.dispatchEvent(new MouseEvent("click"));
});

if (location.hash != "") {
  loadStateFromUrl();
}
requestAnimationFrame(animate);
generate();

/*
todo:
can I improve tooltip accessiblity? maybe with aria-live and javascript setting innerHTML?
should I be using label elements?

download as jpg, svg, gif (pdf, mp4)
*/
