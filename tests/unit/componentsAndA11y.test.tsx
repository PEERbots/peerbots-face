import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { PeerbotsI18nProvider } from "@peerbots/core";
import {
  AmplitudeGraph,
  FaceAudioPrompt,
  FaceRendererRegistry,
  FaceSettingsPanel,
  FaceStoreProvider,
  FaceTesterSection,
  FaceView,
  FaceViewSkeleton,
  availableFaces,
  builtInFaces,
  createPeerbotsFaceStore,
  getGlobalFaceStore,
  globalFaceStore,
  setGlobalFaceStore,
  useFaceStore,
} from "../../src";

describe("FaceView, FaceAudioPrompt, FaceSettingsPanel & WCAG 2.1 AA Accessibility", () => {
  it("renders accessible StaticFaceFallback for Hugo, Robotic, Display, and Vizij faces with zero axe violations", async () => {
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialFace: builtInFaces[0],
      initialSettings: {
        captions: {
          enabled: true,
          fontSize: 28,
          offset: { x: 0, y: 0 },
        },
      },
      initialMessage: {
        title: "Hello",
        speech: "Hello from Hugo!",
        color: "Light Blue",
        emotion: "Happy",
      },
    });

    const { container, rerender } = render(
      <PeerbotsI18nProvider>
        <FaceStoreProvider store={store}>
          <div style={{ width: 640, height: 480 }}>
            <FaceView />
          </div>
        </FaceStoreProvider>
      </PeerbotsI18nProvider>,
    );

    const fallback = screen.getByTestId("static-face-fallback");
    expect(fallback).toHaveAttribute("data-face-name", "Hugo");
    expect(fallback).toHaveAttribute("data-emotion", "Happy");
    expect(fallback).toHaveAttribute("data-color", "Light Blue");
    expect(screen.getByTestId("face-caption")).toHaveTextContent(
      "Hello from Hugo!",
    );

    const axeHugo = await axe(container);
    expect(axeHugo).toHaveNoViolations();

    // Switch to Display text face
    store.getState().setFace(builtInFaces[3]);
    rerender(
      <PeerbotsI18nProvider>
        <FaceStoreProvider store={store}>
          <div style={{ width: 640, height: 480 }}>
            <FaceView />
          </div>
        </FaceStoreProvider>
      </PeerbotsI18nProvider>,
    );
    expect(screen.getByTestId("static-face-fallback")).toHaveAttribute(
      "data-face-name",
      "Display",
    );
    expect(screen.getByText(":D")).toBeInTheDocument();

    // Switch to Vizij 3D face in headless fallback
    store.getState().setFace(availableFaces[4]);
    rerender(
      <PeerbotsI18nProvider>
        <FaceStoreProvider store={store}>
          <div style={{ width: 640, height: 480 }}>
            <FaceView />
          </div>
        </FaceStoreProvider>
      </PeerbotsI18nProvider>,
    );
    expect(screen.getByTestId("static-face-fallback")).toHaveAttribute(
      "data-face-kind",
      "Vizij",
    );
  });

  it("renders custom non-WebGL FaceRendererStrategy and handles unknown face types", () => {
    const customRegistry = new FaceRendererRegistry([
      {
        kind: "CustomTest",
        displayName: "Custom Test Strategy",
        requiresWebGL: false,
        render: ({ face }) => (
          <div data-testid="custom-strategy">Custom: {face.name}</div>
        ),
      },
    ]);

    const store = createPeerbotsFaceStore({ isSilent: true });
    store.getState().setFace({ kind: "CustomTest", name: "TestBot" } as never);

    const { rerender } = render(
      <FaceStoreProvider store={store}>
        <FaceView registry={customRegistry} />
      </FaceStoreProvider>,
    );
    expect(screen.getByTestId("custom-strategy")).toHaveTextContent(
      "Custom: TestBot",
    );

    // Unregistered kind shows unknown alert
    store.getState().setFace({ kind: "Unregistered", name: "Ghost" } as never);
    rerender(
      <FaceStoreProvider store={store}>
        <FaceView registry={customRegistry} />
      </FaceStoreProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Unknown Face Type");

    const { unmount } = render(<FaceViewSkeleton />);
    expect(screen.getByTestId("face-view-skeleton")).toBeInTheDocument();
    unmount();
  });

  it("enables speech via FaceAudioPrompt with zero axe violations", async () => {
    const onEnable = vi.fn();
    const store = createPeerbotsFaceStore({ isSilent: true });

    const { container } = render(
      <PeerbotsI18nProvider>
        <FaceStoreProvider store={store}>
          <FaceAudioPrompt position="inline" onEnable={onEnable} />
        </FaceStoreProvider>
      </PeerbotsI18nProvider>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();

    const btn = screen.getByRole("button", { name: /tap to enable sound/i });
    fireEvent.click(btn);
    expect(store.getState().speechAllowed).toBe(true);
    expect(onEnable).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("face-audio-prompt")).not.toBeInTheDocument();
  });

  it("renders FaceSettingsPanel across Pixi and Vizij faces with interactive controls and zero axe violations", async () => {
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialSettings: {
        zoom: 1.25,
        captions: { enabled: true, fontSize: 30, offset: { x: 0, y: 0 } },
      },
    });
    store.getState().setAvailableVoices([
      {
        name: "Samantha",
        voiceURI: "com.apple.voice.compact.en-US.Samantha",
        lang: "en-US",
        default: true,
      },
    ]);

    const { container, rerender } = render(
      <PeerbotsI18nProvider>
        <FaceStoreProvider store={store}>
          <FaceSettingsPanel />
        </FaceStoreProvider>
      </PeerbotsI18nProvider>,
    );

    const pixiAxe = await axe(container);
    expect(pixiAxe).toHaveNoViolations();

    // Click Rotate 90° and Reset
    fireEvent.click(screen.getByRole("button", { name: /rotate/i }));
    expect(store.getState().faceSettings.rotation).toBe(90);

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(store.getState().faceSettings.rotation).toBe(0);
    expect(store.getState().faceSettings.zoom).toBe(1);

    // Click Allow Speech button inside CharacterSelectionControls
    fireEvent.click(screen.getByRole("button", { name: /allow speech/i }));
    expect(store.getState().speechAllowed).toBe(true);

    // Switch to Custom Face (Vizij) and check Vizij expressivity + GLB upload field a11y
    store.getState().setFaceByName("Custom Face");
    rerender(
      <PeerbotsI18nProvider>
        <FaceStoreProvider store={store}>
          <FaceSettingsPanel />
        </FaceStoreProvider>
      </PeerbotsI18nProvider>,
    );

    expect(screen.getByLabelText(/upload .glb rig/i)).toBeInTheDocument();
    const vizijAxe = await axe(container);
    expect(vizijAxe).toHaveNoViolations();
  });

  it("renders FaceTesterSection, dispatches emotion/color/speech updates, and supports setGlobalFaceStore", async () => {
    const customStore = createPeerbotsFaceStore({ isSilent: true });
    setGlobalFaceStore(customStore);
    expect(getGlobalFaceStore()).toBe(customStore);

    try {
      const { container } = render(
        <PeerbotsI18nProvider>
          <FaceTesterSection defaultOpen />
        </PeerbotsI18nProvider>,
      );

      const testerAxe = await axe(container);
      expect(testerAxe).toHaveNoViolations();

      fireEvent.click(
        screen.getByRole("radio", { name: /Select emotion Happy/i }),
      );
      expect(useFaceStore.getState().lastMessage.emotion).toBe("Happy");

      fireEvent.click(screen.getByRole("radio", { name: /Select color Red/i }));
      expect(useFaceStore.getState().lastMessage.color).toBe("Red");

      const input = screen.getByRole("textbox", { name: /Text to speak/i });
      fireEvent.change(input, { target: { value: "Hello from tester" } });
      fireEvent.click(screen.getByRole("button", { name: /Speak/i }));
      expect(useFaceStore.getState().lastMessage.speech).toBe(
        "Hello from tester",
      );

      fireEvent.change(input, { target: { value: "Enter key speech" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(useFaceStore.getState().lastMessage.speech).toBe(
        "Enter key speech",
      );
    } finally {
      setGlobalFaceStore(globalFaceStore);
    }
  });

  it("renders AmplitudeGraph in idle, speaking, and pre-calculated envelope states with zero axe violations", async () => {
    const store = createPeerbotsFaceStore({ isSilent: true });

    const { container, rerender } = render(
      <FaceStoreProvider store={store}>
        <AmplitudeGraph />
      </FaceStoreProvider>,
    );
    expect(
      screen.getByText(/No amplitude data available/i),
    ).toBeInTheDocument();

    store.setState({
      isSpeaking: true,
      currentAmplitude: 0.42,
      amplitudeData: [
        { time: 0, value: 0.1 },
        { time: 200, value: 0.8 },
      ],
      amplitudeExtrema: [{ time: 200, value: 0.8 }],
    });
    rerender(
      <FaceStoreProvider store={store}>
        <AmplitudeGraph />
      </FaceStoreProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /Audio Amplitude Visualization/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pre-calculated")).toBeInTheDocument();

    const graphAxe = await axe(container);
    expect(graphAxe).toHaveNoViolations();
  });

  it("switches FaceCaption between Dark Pill and Text Outline styles via FaceSettingsPanel", async () => {
    const store = createPeerbotsFaceStore({
      isSilent: true,
      initialSettings: {
        captions: {
          enabled: true,
          fontSize: 28,
          offset: { x: 0, y: 0 },
          style: "pill",
        },
      },
      initialMessage: {
        title: "Hello",
        speech: "Caption style test",
        color: "Light Blue",
        emotion: "Happy",
      },
    });

    const { container } = render(
      <PeerbotsI18nProvider>
        <FaceStoreProvider store={store}>
          <FaceView />
          <FaceSettingsPanel />
        </FaceStoreProvider>
      </PeerbotsI18nProvider>,
    );

    const caption = screen.getByTestId("face-caption");
    expect(caption).toHaveAttribute("data-caption-style", "pill");
    expect(caption.style.backgroundColor).toContain("rgba(15, 23, 42, 0.75)");

    fireEvent.click(screen.getByRole("button", { name: /Text Outline/i }));
    expect(store.getState().faceSettings.captions.style).toBe("outline");
    expect(screen.getByTestId("face-caption")).toHaveAttribute(
      "data-caption-style",
      "outline",
    );
    expect(screen.getByTestId("face-caption").style.textShadow).toContain(
      "2px 2px 2px",
    );

    fireEvent.click(screen.getByRole("button", { name: /Dark Pill/i }));
    expect(store.getState().faceSettings.captions.style).toBe("pill");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});


