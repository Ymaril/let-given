import Given from "../../../src/Given";

interface letGiven {
  five: number;
  six: number;
}

const given = new Given<letGiven>();

describe("Example", () => {
  beforeEach(() => {
    given.add("five", () => 5);
  });

  it("simple test", async () => {
    const { five } = await given.loadValues();

    expect(five).toEqual(5);
  });

  describe("circular dependency", () => {
    beforeEach(() => {
      given.add("five", ({ six }) => six + 5, ["six"]);
    });

    it("throw error", () => {
      expect(() => {
        given.add("six", ({ five }) => five + 5, ["five"]);
      }).toThrow("letGiven 'six' circular dependency");
    });
  });
});

interface letGiven {
  a: unknown;
  b: unknown;
  c: unknown;
  d: unknown;
  e: unknown;
  f: unknown;
  g: unknown;
}

const given2 = new Given<letGiven>();

function sleep() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

describe("optimal loading", () => {
  let originalTimeout: number;

  beforeEach(() => {
    given2.add("a", sleep, ["b", "c"]);

    given2.add("b", sleep, ["d", "e"]);
    given2.add("c", sleep, ["f", "g"]);

    given2.add("d", sleep);
    given2.add("e", sleep);

    given2.add("f", sleep);
    given2.add("g", sleep);

    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it("success", async () => {
    const startTime = Date.now();

    await given2.loadValues();

    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(3500); //expected 3 seconds
  });
});
