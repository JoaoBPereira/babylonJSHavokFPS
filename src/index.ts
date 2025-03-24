import Game from "./game";
import "./index.css";
import * as BABYLON from "@babylonjs/core";

let game: Game | null = null;

window.addEventListener("DOMContentLoaded", () => {
    // get the canvas DOM element
    var canvasElement = <HTMLCanvasElement>document.getElementById("renderCanvas");
    var logElement = <HTMLDivElement>document.getElementById("logDiv");

    BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = () => {};

    game = Game.Instance();
    game.Init(canvasElement, logElement);
    document.addEventListener("keydown", (event: KeyboardEvent) => game?.OnKeyDown(event), false);
    document.addEventListener("keyup", (event: KeyboardEvent) => game?.OnKeyUp(event), false);
});
