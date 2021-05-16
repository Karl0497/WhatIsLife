///<reference path="BaseAttribute.ts" />

class Hunger extends BaseAttribute {
    Value: number = 100;
    CriticalThreshold = 10; // Threshold - condition for a few things
    HungryThreshold = 60 // Threshold that triggers the Hungry status
    DrainRate = 20 // per day
    FoodValue = 30 // value increase per Food consumed
    
    Update(): void {
        if (isNewDay){
            this.Value -= this.DrainRate;
        }
    }
}