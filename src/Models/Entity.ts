class Entity {
    Position: p5.Vector
    Speed: number = 5;
    VisionRadius: number = 150;
    Velocity: p5.Vector = p5.Vector.random2D().mult(this.Speed);

    // Targets for different purposes
    FoodTarget: Food = null;
    Partner: Entity = null;


    Gender: Gender = random(Object.values(Gender));
    RotationAngle: number = 45; // The Entity will turn randomly x degree to the left or right
    RotationAngleRadian: number; // The above as radian
    NoiseRandomness: number = 20 // %chance to turn each frame
    get Age(): number {
        return days - this.DayStart;;
    }
    Weight: number = 0;

    Hunger: Hunger = new Hunger(this);
    ReproducetiveNeed: ReproductiveNeed = new ReproductiveNeed(this);
    Statuses: Status[] = []; // Temporary statuses that get recalculated every frame

    private DayStart: number;
    constructor(position?: p5.Vector) {
        this.RotationAngleRadian = PI / 180 * this.RotationAngle;
        this.Spawn(position);
        this.DayStart = days;
    }

    private Spawn(position: p5.Vector): void {
        if (position) {
            this.Position = createVector(position.x, position.y);
        }
        else {
            this.Position = createVector(random(width), random(height));
        }
    }

    public Update(): void {     
        let tempStatuses: Status[] = [];
        StatusConditions.forEach((condition: (e: Entity) => boolean, status: Status) => {
            if (condition(this)) {
                tempStatuses.push(status);
            }
        });

        this.Statuses = tempStatuses;

        this.Hunger.Update();
        this.ReproducetiveNeed.Update();

        if (this.FindFood()) {
            this.GetFood();
        }
        else if (this.FindPartner()) {
            this.MoveToPartner();
        }
        else {
            this.Wander();
        }

        this.Position.add(this.Velocity);

        // Reset Velocity
        this.Velocity.normalize().mult(this.Speed);
    }

    private GetFood(): any {
        if (this.Position.equals(this.FoodTarget.Position)) {
            this.FoodTarget.Consumed = true;
            this.FoodTarget = null;
            this.Hunger.Value += this.Hunger.FoodValue;
            this.Weight += 1;
        }
        else {
            // Get Direction to food
            let directionToFood: p5.Vector = createVector();
            directionToFood.x = this.FoodTarget.Position.x - this.Position.x;
            directionToFood.y = this.FoodTarget.Position.y - this.Position.y;

            this.Velocity = directionToFood;
            // Limit the max distance we can move
            this.Velocity.limit(min(directionToFood.mag(), this.Speed));
        }
    }

    private FindFood(): boolean {
        if (!this.Statuses.includes(Status.Hungry)) {
            return false;
        }

        // Is currently targeted food sourced consumed by someone else?
        if (this.FoodTarget?.Consumed) {
            this.FoodTarget = null;
        }
        // Find a new one
        else {
            for (let food of foodList) {
                if (VectorHelper.Distance(this.Position, food.Position) <= this.VisionRadius) {
                    this.FoodTarget = food;
                    break;
                }
            }
        }

        return this.FoodTarget != null;
    }

    private FindPartner(): boolean {
        if (!this.Statuses.includes(Status.UrgeToReproduce)) {
            return false;
        }

        if (this.Partner == null){
            for (let candidate of entities) {
                let condition: boolean = candidate.Gender != this.Gender && candidate.Statuses.includes(Status.UrgeToReproduce) && VectorHelper.Distance(this.Position, candidate.Position) <= this.VisionRadius + candidate.VisionRadius;
                if (condition) {
                    this.Partner = candidate;
                    candidate.Partner = this;
                    return true;
                }
            }
        }

        return this.Partner != null;
    }

    private MoveToPartner(): any {
        if (this.Position.equals(this.Partner.Position)) {
            // Reproduce
            let child: Entity = new Entity(this.Position);
            newBorn.push(child);

            this.Partner.ReproducetiveNeed.Reset();
            this.ReproducetiveNeed.Reset();
            this.Partner = null;
        }
        else {
            // Move to Partner
            let directtionToTarget: p5.Vector = createVector();
            directtionToTarget.x = this.Partner.Position.x - this.Position.x;
            directtionToTarget.y = this.Partner.Position.y - this.Position.y;

            this.Velocity = directtionToTarget;
            // Limit the max distance we can move
            this.Velocity.limit(min(directtionToTarget.mag(), this.Speed));
        }
    }

    public Wander(): void {
        if (NumberHelper.RandomPercentage(this.NoiseRandomness)) {
            this.Velocity = this.Velocity.rotate(random(-this.RotationAngleRadian, this.RotationAngleRadian))
        }

        // If it goes out of bound, +180degree to the angle
        if (this.Position.x + this.Velocity.x >= width || this.Position.x + this.Velocity.x <= 0) {
            this.Velocity.x *= -1;
        }

        if (this.Position.y + this.Velocity.y >= height || this.Position.y + this.Velocity.y <= 0) {
            this.Velocity.y *= -1;
        }
    }
    public Show(): void {
        let cMale = color(255, 204, 0);
        let cFemale = color(255, 51, 204);
        let cHungry = color(255, 0, 0);
        if (this.Gender == Gender.Male) {
            stroke(cMale);
        }
        else {
            stroke(cFemale);
        }

        if (this.Statuses.includes(Status.Hungry)) {
            stroke(cHungry);
        }
        // Radius
        if (visionCheckBox.checked()) {
            strokeWeight(1);
            noFill();
            circle(this.Position.x, this.Position.y, this.VisionRadius * 2);
        }


        // The entity
        strokeWeight(Config.EnableWeightVisual ? this.Weight + 10 : 20);
        point(this.Position.x, this.Position.y);

        // Line to food
        strokeWeight(1);
        if (this.FoodTarget != null) {
            line(this.Position.x, this.Position.y, this.FoodTarget.Position.x, this.FoodTarget.Position.y);
        }

        // Debug info
        if (debugCheckBox.checked()) {
            color('black');
            fill('black')
            textSize(18);
            stroke('black')
            text('Age: ' + this.Age, this.Position.x - 10, this.Position.y - 15);
            text('Hunger: ' + this.Hunger.Value, this.Position.x - 10, this.Position.y - 35);
            text('ReproductionNeed: ' + this.Statuses.includes(Status.UrgeToReproduce) + " (Partner:" + this.Partner + ")", this.Position.x - 10, this.Position.y - 50);
        }
    }
}