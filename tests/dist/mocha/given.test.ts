import useGiven from "../../../src/mocha";
import assert from "assert";

const { letGiven, it } = useGiven<{
  five: number;
  six: number;
}>();

describe("Example", () => {
  letGiven('five', () => 5);

  it("simple test", ({ five }) => {
    assert.equal(five, 5);
  });

  it.skip("skipped", ({ five }) => {
    assert.equal(five, 5);
  });

  describe("nested", () => {
    letGiven('six', () => 6);

    it("simple test", ({ five, six }) => {
      assert.equal(five, 5);
      assert.equal(six, 6);
    });
  });

  it("where not defined", ({ six }) => {
    assert.equal(six, undefined);
  });

  describe("overriding", () => {
    letGiven('five', () => 6)

    it("correct", ({ five }) => {
      assert.notEqual(five, 5);
    })
  });

  describe("dependencies given", () => {
    letGiven('six', async five => five + 1, ['five']);

    it("correct", ({ six }) => {
      assert.equal(six, 6);
    });

    describe("changed in nested describe", () => {
      letGiven('five', () => 10);

      it("correct used new value", ({ six }) => {
        assert.equal(six, 11);
      });
    });
  });

  describe("specify dependencies", () => {
    letGiven('six', (five: number) => five + 1, ['five'])

    it("correct", ({ six }) => {
      assert.equal(six, 6);
    });

    describe("with async", () => {
      letGiven('six', async five => five + 2, ['five']);

      it("correct", ({ six }) => {
        assert.equal(six, 7);
      });
    });

    describe("changed in nested describe", () => {
      letGiven('five', () => 10);

      it("correct used new value", ({ six }) => {
        assert.equal(six, 11);
      });
    });
  });
});