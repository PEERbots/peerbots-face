import { useState, useRef, useCallback } from "react";

export type VisualState =
  | "IDLE"
  | "SHOWING"
  | "WAITING_FOR_AUDIO"
  | "PERSISTING"
  | "PAUSED";

export interface MessageVisualStateConfig {
  msPerChar?: number;
  persistenceDuration?: number;
  pauseBeforeNextMsg?: number;
}

export function useMessageVisualState(
  isSpeaking: boolean,
  config: MessageVisualStateConfig = {},
) {
  const {
    msPerChar = 50,
    persistenceDuration = 3000,
    pauseBeforeNextMsg = 500,
  } = config;

  const [displayText, setDisplayText] = useState("");
  const [visualState, setVisualState] = useState<VisualState>("IDLE");

  const stateRef = useRef<VisualState>("IDLE");
  const displayTextRef = useRef("");

  const currentMsgRef = useRef<string | null>(null);
  const nextMsgRef = useRef<string | null>(null);

  const timerRef = useRef(0);
  const charTimerRef = useRef(0);
  const typingIndexRef = useRef(0);

  const startShowing = useCallback(
    (speech: string) => {
      currentMsgRef.current = speech;
      nextMsgRef.current = null;
      stateRef.current = "SHOWING";
      setVisualState("SHOWING");
      typingIndexRef.current = 0;
      charTimerRef.current = 0;

      if (msPerChar <= 0) {
        setDisplayText(speech);
        displayTextRef.current = speech;
        typingIndexRef.current = speech.length;
      } else {
        setDisplayText("");
        displayTextRef.current = "";
      }
    },
    [msPerChar],
  );

  const queueMessage = useCallback(
    (speech: string) => {
      if (stateRef.current === "IDLE" || stateRef.current === "PERSISTING") {
        startShowing(speech);
        return;
      }
      nextMsgRef.current = speech;
    },
    [startShowing],
  );

  const update = useCallback(
    (ms: number) => {
      const prevState = stateRef.current;

      switch (stateRef.current) {
        case "IDLE":
          if (displayTextRef.current !== "") {
            setDisplayText("");
            displayTextRef.current = "";
          }
          if (nextMsgRef.current) {
            startShowing(nextMsgRef.current);
          }
          break;

        case "SHOWING":
          if (!currentMsgRef.current) {
            stateRef.current = "IDLE";
            break;
          }

          if (msPerChar <= 0) {
            if (nextMsgRef.current) {
              stateRef.current = "PAUSED";
              timerRef.current = 0;
            } else {
              stateRef.current = "WAITING_FOR_AUDIO";
            }
            break;
          }

          charTimerRef.current += ms;
          if (charTimerRef.current > msPerChar) {
            const fullText = currentMsgRef.current;
            const charCountToAdd = Math.floor(charTimerRef.current / msPerChar);
            charTimerRef.current %= msPerChar;

            const nextIndex = typingIndexRef.current + charCountToAdd;

            if (nextIndex >= fullText.length) {
              setDisplayText(fullText);
              displayTextRef.current = fullText;
              typingIndexRef.current = fullText.length;

              if (nextMsgRef.current) {
                stateRef.current = "PAUSED";
                timerRef.current = 0;
              } else {
                stateRef.current = "WAITING_FOR_AUDIO";
              }
            } else {
              typingIndexRef.current = nextIndex;
              const partial = fullText.substring(0, nextIndex);
              setDisplayText(partial);
              displayTextRef.current = partial;
            }
          }
          break;

        case "WAITING_FOR_AUDIO":
          if (nextMsgRef.current) {
            stateRef.current = "PAUSED";
            timerRef.current = 0;
            break;
          }

          if (!isSpeaking) {
            stateRef.current = "PERSISTING";
            timerRef.current = 0;
          }
          break;

        case "PERSISTING":
          if (nextMsgRef.current) {
            stateRef.current = "PAUSED";
            timerRef.current = 0;
            break;
          }

          timerRef.current += ms;
          if (timerRef.current > persistenceDuration) {
            stateRef.current = "IDLE";
          }
          break;

        case "PAUSED":
          timerRef.current += ms;
          if (timerRef.current > pauseBeforeNextMsg) {
            if (nextMsgRef.current) {
              startShowing(nextMsgRef.current);
            } else {
              stateRef.current = "WAITING_FOR_AUDIO";
            }
          }
          break;
      }

      if (stateRef.current !== prevState) {
        setVisualState(stateRef.current);
      }
    },
    [
      isSpeaking,
      msPerChar,
      persistenceDuration,
      pauseBeforeNextMsg,
      startShowing,
    ],
  );

  return {
    displayText,
    visualState,
    queueMessage,
    update,
  };
}
