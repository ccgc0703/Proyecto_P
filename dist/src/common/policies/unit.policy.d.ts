export declare class UnitPolicy {
    private readonly unitRestrictedRoles;
    canManageUnit(user: any, targetUnitId?: string): boolean;
    assertCanManageUnit(user: any, targetUnitId?: string): void;
}
