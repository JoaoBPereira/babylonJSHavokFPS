import { addPhysicsImposter } from "../physics";
import { GameObject, GameObjectType } from "./gameObject";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

class BoxObject extends GameObject {
    mMesh: BABYLON.Mesh;
    mPhysics: BABYLON.HavokPlugin | null = null;

    async Init(scene: BABYLON.Scene, physics: BABYLON.HavokPlugin | null, position: BABYLON.Vector3, size: BABYLON.Vector3, physicsParameters: BABYLON.PhysicsImpostorParameters): Promise<void> {
        this.mType = GameObjectType.Box;
        this.mPhysics = physics;

        this.mMesh = BABYLON.MeshBuilder.CreateBox(this.mName, { width: size.x, height: size.y, depth: size.z }, scene);
        this.mMesh.position = position;
        this.mMesh.scaling = size;
        this.mMesh.isPickable = true;

        addPhysicsImposter(this.mMesh, BABYLON.PhysicsShapeType.BOX, scene, physicsParameters);
    }

    Rotate(axis: BABYLON.Vector3, amount: number): void {
        this.mMesh?.rotate(axis, amount);
    }

    InitPhysics(): void {
        if (!this.mPhysics) return;

        this.mMesh.metadata.aggregate.body.tag = this;
    }

    Step(timeStep: number): void {}
}

export default BoxObject;
