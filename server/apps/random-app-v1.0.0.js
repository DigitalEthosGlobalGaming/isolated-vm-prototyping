"use strict";
(() => {
  // src/another.ts
  function test() {
    console.log("TEST");
  }

  // src/app.ts
  log("Hello worldsAsAA!");
  on("tick", () => {
    const oldValue = getData("m", 0);
    const newValue = oldValue + 1;
    log("NEW", newValue);
    setData("m", newValue);
    test();
  });
  log("TEST");
  log("HERE");
})();
