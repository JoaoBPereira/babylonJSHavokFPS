export enum GameObjectType {
    None,
    Box,
    Sphere,
    ControlSphere,
    Cyclinder,
    Particle,
    Mesh,
    GrapplingHook,
}

export enum GameObjectVisualType {
    Box,
    Sphere,
    Cyclinder,
    Particle,
    Mesh,
}

export enum ControlObjectState {
    Idle,
    Moving,
    Running,
    Jumping,
    DoubleJumping,
    Falling,
}

export abstract class GameObject {
    mType: GameObjectType = GameObjectType.None;
    mName: string;

    constructor(name: string) {
        this.mName = name;
    }

    abstract Step(timeStep: number | undefined): void;
}
