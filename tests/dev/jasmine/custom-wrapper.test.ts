import { useGivenWithWrapper } from "../../../src/useGiven";

const testUI = {
  test: global.it,
};

const { letGiven, test } = useGivenWithWrapper<
  {
    five: number;
    six: number;
  },
  typeof testUI
>(testUI);

describe("Example with custom wrapper", () => {
  letGiven("five", () => 5);

  test("simple test", ({ five }) => {
    expect(five).toEqual(5);
  });

  describe("nested", () => {
    letGiven("six", () => 6);

    test("simple test", ({ five, six }) => {
      expect(five).toEqual(5);
      expect(six).toEqual(6);
    });
  });

  test("where not defined", ({ six }) => {
    expect(six).toEqual(undefined);
  });

  describe("overriding", () => {
    letGiven("five", () => 6);

    test("correct", ({ five }) => {
      expect(five).not.toEqual(5);
    });
  });

  describe("super", () => {
    letGiven("five", ({ five }) => five + 5, ["five"]);

    test("success", ({ five }) => {
      expect(five).toEqual(10);
    });

    describe("nested", () => {
      letGiven("five", ({ five }) => five - 2, ["five"]);

      test("success", ({ five }) => {
        expect(five).toEqual(8);
      });

      describe("depend from another given", () => {
        letGiven("six", () => 6);
        letGiven("five", ({ five, six }) => five + six, ["five", "six"]);

        test("success", ({ five }) => {
          expect(five).toEqual(14);
        });
      });
    });
  });

  describe("dependencies given", () => {
    letGiven("six", async ({ five }) => five + 1, ["five"]);

    test("correct", ({ six }) => {
      expect(six).toEqual(6);
    });

    describe("changed in nested describe", () => {
      letGiven("five", () => 10);

      test("correct used new value", ({ six }) => {
        expect(six).toEqual(11);
      });
    });
  });

  describe("specify dependencies", () => {
    letGiven("six", ({ five }) => five + 1, ["five"]);

    test("correct", ({ six }) => {
      expect(six).toEqual(6);
    });

    describe("wtesth async", () => {
      letGiven("six", async ({ five }) => five + 2, ["five"]);

      test("correct", ({ six }) => {
        expect(six).toEqual(7);
      });
    });

    describe("changed in nested describe", () => {
      letGiven("five", () => 10);

      test("correct used new value", ({ six }) => {
        expect(six).toEqual(11);
      });
    });
  });
});
