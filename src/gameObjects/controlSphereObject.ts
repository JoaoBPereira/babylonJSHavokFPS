import * as BABYLON from "@babylonjs/core";
import { addPhysicsImposter } from "../physics";
import { ControlObjectState, GameObject, GameObjectType } from "./gameObject";

class ControlSphereObject extends GameObject {
    mMesh: BABYLON.Mesh;
    mPhysics: BABYLON.HavokPlugin | null = null;
    mState: ControlObjectState;
    mMoveForward: boolean = false;
    mMoveBackward: boolean = false;
    mMoveLeft: boolean = false;
    mMoveRight: boolean = false;
    mMoveUp: boolean = false;

    Init(scene: BABYLON.Scene, physics: BABYLON.HavokPlugin | null, position: BABYLON.Vector3, size: BABYLON.Vector3): void {
        this.mType = GameObjectType.ControlSphere;
        this.mPhysics = physics;

        const segments = 4;
        const diameter = 1;
        this.mMesh = BABYLON.MeshBuilder.CreateSphere("sphere", { segments, diameter }, scene);
        this.mMesh.position = position;

        addPhysicsImposter(this.mMesh, BABYLON.PhysicsShapeType.CAPSULE, scene, { mass: 5.0, friction: 0.95, restitution: 0.0 });

        this.mMesh.position = position;
        this.mMesh.scaling = size;
        this.mMesh.isPickable = false;
        this.mState = ControlObjectState.Idle;
    }

    InitPhysics(): void {
        if (!this.mPhysics) return;

        this.mPhysics.setAngularDamping(this.mMesh.metadata.aggregate.body, 0.9);
        this.mPhysics.setLinearDamping(this.mMesh.metadata.aggregate.body, 0.9);
        this.mPhysics.setActivationControl(this.mMesh.metadata.aggregate.body, BABYLON.PhysicsActivationControl.ALWAYS_ACTIVE);

        this.mMesh.metadata.aggregate.body.setCollisionCallbackEnabled(true);
        const observable = this.mMesh.metadata.aggregate.body.getCollisionObservable();
        observable.add((collisionEvent: any) => {
            this.Collide(collisionEvent);
        });
        this.mMesh.metadata.aggregate.body.tag = this;
    }

    Move(camera: BABYLON.FreeCamera) {
        if (!this.mMesh || !this.mMesh.metadata.aggregate.body) return;

        var forward = camera.getTarget().subtract(camera.position).normalize();
        forward.y = 0;

        var finalVector = new BABYLON.Vector3(0.0, 0.0, 0.0);

        if (this.mMoveForward) finalVector.addInPlace(forward);

        if (this.mMoveBackward) finalVector.addInPlace(forward.scale(-1.0));

        if (this.mMoveRight) {
            var vecRight = BABYLON.Vector3.Cross(forward, camera.upVector).normalize();
            vecRight.y = 0;
            vecRight.scaleInPlace(-1.0);
            finalVector.addInPlace(vecRight);
        }

        if (this.mMoveLeft) {
            var vecLeft = BABYLON.Vector3.Cross(forward, camera.upVector).normalize();
            vecLeft.y = 0;
            finalVector.addInPlace(vecLeft);
        }

        finalVector = finalVector.normalize();
        finalVector.scaleInPlace(10.0);
        //finalVector.y = 0.0;

        if (this.mMoveUp) {
            if (this.mState === ControlObjectState.Falling) return;

            finalVector.addInPlace(new BABYLON.Vector3(0.0, 50.0, 0.0));

            if (this.mState != ControlObjectState.Jumping && this.mState != ControlObjectState.DoubleJumping) {
                this.mMesh.metadata.aggregate.body.linearDamping = 0.01;
                this.mMesh.metadata.aggregate.body.applyImpulse(finalVector, this.mMesh.getAbsolutePosition());
                this.mState = ControlObjectState.Jumping;
            } else if (this.mState == ControlObjectState.Jumping) {
                this.mMesh.metadata.aggregate.body.applyImpulse(finalVector, this.mMesh.getAbsolutePosition());
                this.mState = ControlObjectState.DoubleJumping;
            }
            this.mMoveUp = false;
        }

        if (this.mState !== ControlObjectState.Jumping && this.mState !== ControlObjectState.DoubleJumping && this.mState != ControlObjectState.Falling)
            this.mMesh.metadata.aggregate.body.setLinearVelocity(new BABYLON.Vector3(finalVector.x, this.mMesh.metadata.aggregate.body.getLinearVelocity().y, finalVector.z));

        if (finalVector.equals(BABYLON.Vector3.Zero()) && this.mState !== ControlObjectState.Jumping && this.mState !== ControlObjectState.DoubleJumping && this.mState != ControlObjectState.Falling)
            this.mMesh.metadata.aggregate.body.setLinearVelocity(new BABYLON.Vector3(0, this.mMesh.metadata.aggregate.body.getLinearVelocity().y, 0));
    }

    Step(timeStep: number): void {
        if (!this.mMesh || !this.mMesh.metadata.aggregate.body) return;
        if (
            this.mMesh.metadata.aggregate.body.getLinearVelocity() != null &&
            this.mMesh.metadata.aggregate.body.getLinearVelocity().y < -2.0 &&
            this.mState != ControlObjectState.Jumping &&
            this.mState != ControlObjectState.DoubleJumping
        ) {
            this.mMesh.metadata.aggregate.body.linearDamping = 0.01;
            this.mState = ControlObjectState.Falling;
        }
    }

    Collide(e: any): void {
        if (e.collider.tag.mState == ControlObjectState.Jumping || e.collider.tag.mState == ControlObjectState.DoubleJumping || e.collider.tag.mState == ControlObjectState.Falling) {
            e.collider.tag.mMesh.metadata.aggregate.body.linearDamping = 0.9;
            e.collider.tag.mState = ControlObjectState.Idle;
        }
    }
}

export default ControlSphereObject;
