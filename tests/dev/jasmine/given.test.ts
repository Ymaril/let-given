import Given from "../../../src/Given";

interface letGiven {
  five: number;
  six: number;
}

const given = new Given<letGiven>();

describe("Example", () => {
  beforeEach(() => {
    given.add('five', () => 5);
  });

  it("simple test", async () => {
    const { five } = await given.loadValues();

    expect(five).toEqual(5);
  });

  describe("circular dependency", () => {
    beforeEach(() => {
      given.add('five', ({ six }) => six + 5, ['six']);
    });

    it("throw error", () => {
      expect(() => {
        given.add('six', ({ five }) => five + 5, ['five'])
      }).toThrow("letGiven 'six' circular dependency");
    });
  });
});