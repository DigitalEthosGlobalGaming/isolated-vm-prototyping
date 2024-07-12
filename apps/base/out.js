"use strict";
(() => {
  // src/app.ts
  log("Hello worldAAA!");
  on("tick", () => {
    const oldValue = getData("m", 0);
    const newValue = oldValue + 1;
    log("NEW", newValue);
    setData("m", newValue);
  });
  log("TEST");
  log("HERE");
})();
