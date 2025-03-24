import * as BABYLON from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import type Level from "./level";

export const initPhysics = async (level: Level) => {
    const url = import.meta.env.DEV ? "node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm" : "HavokPhysics.wasm";
    const response = await fetch(url);
    const wasmBinary = await response.arrayBuffer();
    const havokInstance = await HavokPhysics({ wasmBinary });
    level.mPhysics = new BABYLON.HavokPlugin(true, havokInstance);
    level.mScene?.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), level.mPhysics);
};

export const addPhysicsImposter = (
    mesh: BABYLON.Mesh,
    shape: BABYLON.PhysicsShapeType.SPHERE | BABYLON.PhysicsShapeType.CAPSULE | BABYLON.PhysicsShapeType.BOX | BABYLON.PhysicsShapeType.MESH,
    scene: BABYLON.Scene,
    physicsParameters: BABYLON.PhysicsImpostorParameters
) => {
    mesh.metadata = {};
    mesh.metadata.aggregate = new BABYLON.PhysicsAggregate(mesh, shape, physicsParameters, scene);
};
