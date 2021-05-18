import { RBORPage } from "./app.po";

describe("rbor App", () => {
  let page: RBORPage;

  beforeEach(() => {
    page = new RBORPage();
  });

  it("should display message saying app works", () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual("app works!");
  });
});
