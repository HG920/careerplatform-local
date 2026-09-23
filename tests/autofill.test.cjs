const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// The browser helpers live in Electron's main-process module. Evaluate its
// pure functions with Electron stubbed, without opening a window or website.
const source = fs.readFileSync(path.join(__dirname, "../electron/browser-view.js"), "utf8");
const context = {
  require: (name) => name === "electron" ? {} : require(name),
  module: { exports: {} },
  URL,
};
vm.runInNewContext(`${source}\nmodule.exports.__test = { matchBasicField, isNeverGuessField, isOpenEndedQuestionField, portalContext };`, context);
const { matchBasicField, isNeverGuessField, isOpenEndedQuestionField, portalContext } = context.module.exports.__test;

const profile = { name: "陈奕宏", email: "me@example.invalid" };

test("full name is filled, but split names are never guessed", () => {
  assert.equal(matchBasicField({ label: "Full Name", placeholder: "", name: "" }, profile), "陈奕宏");
  for (const label of ["First Name", "Last Name", "given_name", "Family Name", "姓", "名", "姓氏", "名字"]) {
    const field = { label, placeholder: "", name: "", tag: "input", type: "text" };
    assert.equal(matchBasicField(field, profile), null, label);
    assert.equal(isNeverGuessField(field), true, label);
  }
});

test("open-ended text inputs join textareas in answer memory", () => {
  assert.equal(isOpenEndedQuestionField({ tag: "textarea", label: "自我介绍", placeholder: "", name: "" }), true);
  assert.equal(isOpenEndedQuestionField({ tag: "input", type: "text", label: "为什么申请这个岗位？", placeholder: "", name: "" }), true);
  assert.equal(isOpenEndedQuestionField({ tag: "input", type: "text", label: "邮箱", placeholder: "", name: "" }), false);
  assert.equal(isOpenEndedQuestionField({ tag: "input", type: "number", label: "相关经历年数", placeholder: "", name: "" }), false);
});

test("company context survives own-site paths but isolates shared job board paths", () => {
  assert.equal(portalContext("https://careers.example.com/apply/123"), portalContext("https://careers.example.com/candidate/456"));
  assert.notEqual(portalContext("https://app.mokahr.com/apply/acme"), portalContext("https://app.mokahr.com/apply/other"));
  assert.equal(portalContext("https://app.mokahr.com/apply/a?tenant=acme"), portalContext("https://app.mokahr.com/candidate/b?tenant=acme"));
});
