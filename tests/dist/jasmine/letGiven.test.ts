import useGiven from "../../../dist/jasmine";

const { letGiven, it, xit } = useGiven<{
  five: number;
  six: number;
}>();

describe("Example", () => {
  letGiven("five", () => 5);

  it("simple test", ({ five }) => {
    expect(five).toEqual(5);
  });

  xit("skipped", ({ five }) => {
    expect(five).toEqual(5);
  });

  describe("nested", () => {
    letGiven("six", () => 6);

    it("simple test", ({ five, six }) => {
      expect(five).toEqual(5);
      expect(six).toEqual(6);
    });
  });

  it("where not defined", ({ six }) => {
    expect(six).toEqual(undefined);
  });

  describe("overriding", () => {
    letGiven("five", () => 6);

    it("correct", ({ five }) => {
      expect(five).not.toEqual(5);
    });
  });

  describe("dependencies given", () => {
    letGiven("six", async ({ five }) => five + 1, ["five"]);

    it("correct", ({ six }) => {
      expect(six).toEqual(6);
    });

    describe("changed in nested describe", () => {
      letGiven("five", () => 10);

      it("correct used new value", ({ six }) => {
        expect(six).toEqual(11);
      });
    });
  });

  describe("super", () => {
    letGiven("five", ({ five }) => five + 5, ["five"]);

    it("success", ({ five }) => {
      expect(five).toEqual(10);
    });

    describe("nested", () => {
      letGiven("five", ({ five }) => five - 2, ["five"]);

      it("success", ({ five }) => {
        expect(five).toEqual(8);
      });

      describe("depend from another given", () => {
        letGiven("six", () => 6);
        letGiven("five", ({ five, six }) => five + six, ["five", "six"]);

        it("success", ({ five }) => {
          expect(five).toEqual(14);
        });
      });
    });
  });

  describe("specify dependencies", () => {
    letGiven("six", ({ five }) => five + 1, ["five"]);

    it("correct", ({ six }) => {
      expect(six).toEqual(6);
    });

    describe("with async", () => {
      letGiven("six", async ({ five }) => five + 2, ["five"]);

      it("correct", ({ six }) => {
        expect(six).toEqual(7);
      });
    });

    describe("changed in nested describe", () => {
      letGiven("five", () => 10);

      it("correct used new value", ({ six }) => {
        expect(six).toEqual(11);
      });
    });
  });
});
