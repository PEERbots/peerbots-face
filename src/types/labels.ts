export interface FaceUiLabels {
  loading: string;
  poweredBy: string;
  tapToEnableSound: string;
  allowSpeech: string;
  characterSelection: string;
  face: string;
  uploadGlb: string;
  vizijUploadGlb: string;
  vizijErrorPrefix: string;
  faceCapabilities: string;
  color: string;
  emotion: string;
  speech: string;
  faceSpecificSettings: string;
  faceExpressivity: string;
  eyes: string;
  mouth: string;
  cheeks: string;
  emotionDisplay: string;
  defaultOption: string;
  noneOption: string;
  emoticon: string;
  emoji: string;
  positioning: string;
  autoRotate: string;
  rotate: string;
  reset: string;
  zoom: string;
  horizontalOffset: string;
  verticalOffset: string;
  faceSettings: string;
  onFaceButtons: string;
  showFullScreenButton: string;
  showScrollButton: string;
  speechBehavior: string;
  newButtonSpeech: string;
  interruptSpeech: string;
  queueSpeech: string;
  captions: string;
  fontSize: string;
  verticalPosition: string;
  voiceSelectorLanguage: string;
  voiceSelectorVoice: string;
  unknownFaceType: string;
}

export const DEFAULT_FACE_UI_LABELS: FaceUiLabels = {
  loading: "Loading...",
  poweredBy: "Powered by",
  tapToEnableSound: "Tap to enable sound",
  allowSpeech: "Allow Speech",
  characterSelection: "Character & Voice",
  face: "Character",
  uploadGlb: "Upload .GLB Rig",
  vizijUploadGlb: "Upload a .glb file in Face Settings to preview Custom Face",
  vizijErrorPrefix: "3D Face Error:",
  faceCapabilities: "Face Capabilities",
  color: "Color",
  emotion: "Emotion",
  speech: "Speech",
  faceSpecificSettings: "Face-Specific Settings",
  faceExpressivity: "Face Expressivity",
  eyes: "Eyes",
  mouth: "Mouth",
  cheeks: "Cheeks",
  emotionDisplay: "Emotion Display",
  defaultOption: "Default",
  noneOption: "None",
  emoticon: "Emoticon",
  emoji: "Emoji",
  positioning: "Face Positioning",
  autoRotate: "Auto-Rotate",
  rotate: "Rotate 90°",
  reset: "Reset",
  zoom: "Zoom",
  horizontalOffset: "Horizontal Offset",
  verticalOffset: "Vertical Offset",
  faceSettings: "Face Settings",
  onFaceButtons: "On-Face Controls",
  showFullScreenButton: "Show Fullscreen Button",
  showScrollButton: "Show Scroll-to-Top Button",
  speechBehavior: "Speech Playback Behavior",
  newButtonSpeech: "When new speech arrives",
  interruptSpeech: "Interrupt current speech",
  queueSpeech: "Queue after current speech",
  captions: "Captions",
  fontSize: "Caption Font Size",
  verticalPosition: "Vertical Position",
  voiceSelectorLanguage: "Language",
  voiceSelectorVoice: "Voice",
  unknownFaceType: "Unknown Face Type",
};

export function resolveFaceUiLabels(
  overrides?: Partial<FaceUiLabels>,
): FaceUiLabels {
  if (!overrides) {
    return DEFAULT_FACE_UI_LABELS;
  }
  return {
    ...DEFAULT_FACE_UI_LABELS,
    ...overrides,
  };
}
