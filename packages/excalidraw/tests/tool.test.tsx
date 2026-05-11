import React from "react";

import { resolvablePromise } from "@excalidraw/common";

import { Excalidraw } from "../index";

import { findShapeByKey, getToolbarTools } from "../components/shapes";

import { Pointer } from "./helpers/ui";
import { act, render } from "./test-utils";

import type { AppClassProperties, ExcalidrawImperativeAPI } from "../types";

describe("setActiveTool()", () => {
  const h = window.h;

  let excalidrawAPI: ExcalidrawImperativeAPI;

  const mouse = new Pointer("mouse");

  beforeEach(async () => {
    const excalidrawAPIPromise = resolvablePromise<ExcalidrawImperativeAPI>();
    await render(
      <Excalidraw
        onExcalidrawAPI={(api) => excalidrawAPIPromise.resolve(api as any)}
      />,
    );
    excalidrawAPI = await excalidrawAPIPromise;
  });

  it("should expose setActiveTool on package API", () => {
    expect(excalidrawAPI.setActiveTool).toBeDefined();
    expect(excalidrawAPI.setActiveTool).toBe(h.app.setActiveTool);
  });

  it("should set the active tool type", async () => {
    expect(h.state.activeTool.type).toBe("selection");
    act(() => {
      excalidrawAPI.setActiveTool({ type: "rectangle" });
    });
    expect(h.state.activeTool.type).toBe("rectangle");

    mouse.down(10, 10);
    mouse.up(20, 20);

    expect(h.state.activeTool.type).toBe("selection");
  });

  it("should create heart as a generic element", async () => {
    act(() => {
      excalidrawAPI.setActiveTool({ type: "heart" });
    });

    mouse.down(10, 10);
    mouse.up(60, 60);

    expect(h.elements[0].type).toBe("heart");

    act(() => {
      excalidrawAPI.setActiveTool({ type: "rectangle" });
    });

    mouse.down(70, 70);
    mouse.up(120, 120);

    expect(Object.keys(h.elements[0]).sort()).toEqual(
      Object.keys(h.elements[1]).sort(),
    );
  });

  it("should support tool locking", async () => {
    expect(h.state.activeTool.type).toBe("selection");
    act(() => {
      excalidrawAPI.setActiveTool({ type: "rectangle", locked: true });
    });
    expect(h.state.activeTool.type).toBe("rectangle");

    mouse.down(10, 10);
    mouse.up(20, 20);

    expect(h.state.activeTool.type).toBe("rectangle");
  });

  it("should set custom tool", async () => {
    expect(h.state.activeTool.type).toBe("selection");
    act(() => {
      excalidrawAPI.setActiveTool({ type: "custom", customType: "comment" });
    });
    expect(h.state.activeTool.type).toBe("custom");
    expect(h.state.activeTool.customType).toBe("comment");
  });
});
describe("getToolbarTools()", () => {
  const getToolValues = (preferredSelectionTool: "selection" | "lasso") =>
    getToolbarTools({
      state: {
        preferredSelectionTool: {
          type: preferredSelectionTool,
        },
      },
    } as AppClassProperties).map((tool) => tool.value);

  it("does not include lasso when selection is preferred", () => {
    const toolValues = getToolValues("selection");

    expect(toolValues.filter((value) => value === "selection")).toHaveLength(1);
    expect(toolValues.filter((value) => value === "lasso")).toHaveLength(0);
    expect(toolValues).toContain("heart");
  });

  it("replaces selection with lasso when lasso is preferred", () => {
    const toolValues = getToolValues("lasso");

    expect(toolValues.filter((value) => value === "lasso")).toHaveLength(1);
    expect(toolValues.filter((value) => value === "selection")).toHaveLength(0);
  });

  it("maps heart and eraser shortcuts", () => {
    const app = {
      state: {
        preferredSelectionTool: {
          type: "selection",
        },
      },
    } as AppClassProperties;

    expect(findShapeByKey("0", app)).toBe("heart");
    expect(findShapeByKey("e", app)).toBe("eraser");
  });
});
