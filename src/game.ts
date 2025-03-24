import "./index.css";
import Stats from "stats.js";
import * as BABYLON from "@babylonjs/core";
//import "@babylonjs/loaders/glTF";

import Level from "./level";

class Game {
    private static mInstance: Game | null = null;

    mStats: Stats | null = null;
    //mLog: Log | null = null;
    mEngine: BABYLON.Engine | BABYLON.WebGPUEngine | null = null;
    mLevel: Level | null = null;

    static Instance() {
        if (!Game.mInstance) {
            Game.mInstance = new Game();
            // ... any one time initialization goes here ...
        }
        return Game.mInstance;
    }

    async Init(canvasElement: HTMLCanvasElement, logElement: HTMLDivElement): Promise<void> {
        this.mStats = new Stats();
        this.mStats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.mStats.dom);

        //this.mLog = new Log(logElement);

        const antialias = true;
        const adaptToDeviceRatio = true;
        if (navigator.gpu) {
            // load the 3D engine
            this.mEngine = new BABYLON.WebGPUEngine(canvasElement, { antialias, adaptToDeviceRatio });
            await (this.mEngine as BABYLON.WebGPUEngine).initAsync();
        } else {
            this.mEngine = new BABYLON.Engine(canvasElement, antialias, {}, adaptToDeviceRatio);
        }

        // call the createScene function
        this.mLevel = new Level();
        this.mLevel.Init(this.mEngine);
        //this.mLevel.Init(this.mEngine, this.mLog);

        this.mEngine.runRenderLoop(() => {
            this.mStats?.begin();

            this.mLevel?.Step();

            this.mLevel?.Render();

            this.mStats?.end();

            //this.mLog.Display();
        });

        // // the canvas/window resize event handler
        // window.addEventListener("resize", () => {
        //   this.mEngine.resize();
        // });
    }

    OnKeyDown(event: KeyboardEvent): void {
        this.mLevel?.OnKeyDown(event);
    }

    OnKeyUp(event: KeyboardEvent): void {
        this.mLevel?.OnKeyUp(event);
    }
}

export default Game;
