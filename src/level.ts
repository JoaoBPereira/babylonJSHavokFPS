import * as BABYLON from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";
import { initPhysics } from "./physics";
import { addPostProcess } from "./addPostProcess";

import ControlSphereObject from "./gameObjects/controlSphereObject";
import type { GameObject } from "./gameObjects/gameObject";
import BoxObject from "./gameObjects/boxObject";

import grass from "/src/assets/grass.webp";

class Level {
    // mLog: Log | null = null;
    mEngine: BABYLON.Engine | BABYLON.WebGPUEngine | null = null;
    mScene: BABYLON.Scene;
    mPhysics: BABYLON.HavokPlugin | null = null;
    mCamera: BABYLON.FreeCamera;
    mObjectsArray: Array<GameObject> | null = null;
    mHero: any | null = null;
    mIsLocked: boolean = false;

    async Init(engine: BABYLON.Engine | BABYLON.WebGPUEngine): Promise<void> {
        //this.mLog = log;
        this.mEngine = engine;

        this.mScene = new BABYLON.Scene(this.mEngine);

        Inspector.Show(this.mScene, {});

        // Create a FreeCamera
        this.mCamera = new BABYLON.FreeCamera("UniversalCamera", new BABYLON.Vector3(0, 5, -10), this.mScene);
        // target the camera to scene origin
        this.mCamera.setTarget(new BABYLON.Vector3(0.0, 0.0, 0.0));
        // attach the camera to the canvas
        this.mCamera.attachControl(this.mEngine.getRenderingCanvas(), true);
        this.mCamera.angularSensibility = 1000;
        this.mCamera.inertia = 0;
        this.mCamera.minZ = 0.45;
        this.mScene.activeCamera = this.mCamera;

        await Promise.all([initPhysics(this)]);

        let inspectorReady = false;
        let inspectorOpen = true;

        if (import.meta.env.MODE === "development") {
            window.addEventListener("keydown", async ({ key }) => {
                if (key.toLowerCase() !== "i") return;

                if (inspectorReady === false) {
                    await import("@babylonjs/core/Debug/debugLayer");
                    await import("@babylonjs/inspector");
                    inspectorReady = true;
                }

                if (inspectorOpen === true) {
                    localStorage.setItem("inspector", "true");
                    this.mScene?.debugLayer.hide();
                } else {
                    localStorage.removeItem("inspector");
                    this.mScene?.debugLayer.show();
                }
            });

            if (localStorage.getItem("inspector")) {
                this.mScene.debugLayer.show();
            }
        }

        for (const texture of this.mScene.textures) {
            texture.updateSamplingMode(1);
        }

        this.mScene.registerBeforeRender(() => this.Step());

        this.mObjectsArray = new Array<GameObject>();

        this.mHero = new ControlSphereObject("Hero");
        this.mHero.Init(this.mScene, this.mPhysics, new BABYLON.Vector3(0.0, 0.5, 0.0), new BABYLON.Vector3(1.0, 1.0, 1.0));
        this.mHero.InitPhysics();
        this.mObjectsArray.push(this.mHero);

        // create a basic light, aiming 0,1,0 - meaning, to the sky
        let light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0.0, 1.0, 0.0), this.mScene);
        light.intensity = 0.7;

        // // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
        let box0 = new BoxObject("BoxTemp");
        box0.Init(this.mScene, this.mPhysics, new BABYLON.Vector3(0.0, 2.0, 5.0), new BABYLON.Vector3(1.0, 1.0, 1.0), { mass: 0.5, friction: 0.95, restitution: 0.05 });
        box0.InitPhysics();
        this.mObjectsArray.push(box0);

        // // create a built-in "sphere" shape; its constructor takes 5 params: name, width, depth, subdivisions, scene
        let box1 = new BoxObject("BoxTemp");
        box1.Init(this.mScene, this.mPhysics, new BABYLON.Vector3(0.0, 2.0, -5.0), new BABYLON.Vector3(1.0, 1.0, 1.0), { mass: 0.5, friction: 0.95, restitution: 0.05 });
        box1.InitPhysics();
        this.mObjectsArray.push(box1);

        var ground = BABYLON.MeshBuilder.CreateGround("ground1", { height: 200.0, width: 200.0, subdivisions: 5.0 }, this.mScene);
        ground.setPositionWithLocalVector(new BABYLON.Vector3(0.0, 0.0, 0));
        let groundMaterial = new BABYLON.StandardMaterial("Ground Material", this.mScene);
        let groundTexture = new BABYLON.Texture(grass, this.mScene);
        groundMaterial.diffuseTexture = groundTexture;
        ground.material = groundMaterial;
        ground.isPickable = false;
        var groundAggregate = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.95, restitution: 0.05 }, this.mScene);

        this.mScene.onPointerDown = (evt) => {
            if (evt.button === 0) this.mEngine?.enterPointerlock();
        };

        addPostProcess(this.mScene, [this.mCamera]);

        this.mScene.debugLayer.show();

        // On click event, request pointer lock
        this.mScene.onPointerObservable.add((pointerInfo: BABYLON.PointerInfo, eventState: BABYLON.EventState) => this.Pointer(pointerInfo, eventState));
    }

    Pointer(pointerInfo: BABYLON.PointerInfo, eventState: BABYLON.EventState): void {
        if (pointerInfo.event.type == "pointerdown") {
            //Left Mouse Button
            if (pointerInfo.event.button === 0) {
                let forward = this.mCamera.getTarget().subtract(this.mCamera.position).normalize();
                let rayPick = new BABYLON.Ray(this.mCamera.position, forward);
                let meshFound = this.mScene.pickWithRay(rayPick, undefined, true);
                if (meshFound != null && meshFound.pickedMesh != null && meshFound.pickedPoint != null) {
                    meshFound.pickedMesh.metadata.aggregate.body.applyImpulse(forward.scale(5.0), meshFound.pickedPoint);
                }
            }
            //Middle Mouse Button
            if (pointerInfo.event.button === 1) {
            }
            //Right Mouse Button
            if (pointerInfo.event.button === 2) {
            }
        }
    }

    OnKeyDown(event: KeyboardEvent): void {
        if (this.mHero === null) return;

        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                this.mHero.mMoveForward = true;
                break;
            case 37: // left
            case 65: // a
                this.mHero.mMoveLeft = true;
                break;
            case 40: // down
            case 83: // s
                this.mHero.mMoveBackward = true;
                break;
            case 39: // right
            case 68: // d
                this.mHero.mMoveRight = true;
                break;
            case 32: // space
                this.mHero.mMoveUp = true;
                break;
        }
    }

    OnKeyUp(event: KeyboardEvent): void {
        if (this.mHero === null) return;
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                this.mHero.mMoveForward = false;
                break;
            case 37: // left
            case 65: // a
                this.mHero.mMoveLeft = false;
                break;
            case 40: // down
            case 83: // a
                this.mHero.mMoveBackward = false;
                break;
            case 39: // right
            case 68: // d
                this.mHero.mMoveRight = false;
                break;
            case 32: //space
                this.mHero.mMoveUp = false;
                break;
        }
    }

    Render(): void {
        this.mScene?.render();
    }

    Step(): void {
        let step = this.mEngine?.getDeltaTime();
        //this.mLog.Log("Step: " + step.toFixed(2));

        this.mHero?.Move(this.mCamera);

        if (this.mCamera && this.mHero && this.mHero.mMesh) {
            this.mCamera.position.x = this.mHero.mMesh.position.x;
            this.mCamera.position.y = this.mHero.mMesh.position.y + 1.0;
            this.mCamera.position.z = this.mHero.mMesh.position.z;
        }

        //Objects Step
        if (this.mObjectsArray !== null) for (let gameObject of this.mObjectsArray) gameObject.Step(step);
    }
}

export default Level;
