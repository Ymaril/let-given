import useGiven from "../../src/useGiven";

const { letGiven, getGiven, it } = useGiven<{
  five: number;
  six: number;
}>();

describe("Example", () => {
  letGiven('five', () => 5);

  it("simple test", ({ five }) => {
    expect(five).toEqual(5);
  });

  describe("nested", () => {
    letGiven('six', () => 6);

    it("simple test", ({ five, six }) => {
      expect(five).toEqual(5);
      expect(six).toEqual(6);
    });
  });

  it("where not defined", ({ six }) => {
    expect(six).toEqual(undefined);
  });

  describe("overriding", () => {
    letGiven('five', () => 6)

    it("correct", ({ five }) => {
      expect(five).not.toEqual(5);
    })
  });

  describe("dependencies given", () => {
    letGiven('six', async () => await getGiven('five') + 1)

    it("correct", ({ six }) => {
      expect(six).toEqual(6);
    });

    describe("changed in nested describe", () => {
      letGiven('five', () => 10);

      it("correct used new value", ({ six }) => {
        expect(six).toEqual(11);
      });
    });
  });

  describe("specify dependencies", () => {
    letGiven('six', (five: number) => five + 1)

    it("correct", ({ six }) => {
      expect(six).toEqual(6);
    });

    describe("changed in nested describe", () => {
      letGiven('five', () => 10);

      it("correct used new value", ({ six }) => {
        expect(six).toEqual(11);
      });
    });
  });
});