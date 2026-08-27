import { useState, useEffect, useRef, useCallback } from "react";

import { DualCanvas } from "@/components/Canvas/DualCanvas";
import { Controls } from "@/components/Controls";
import { Menu } from "@/components/Menu";
import { HelpModal } from "@/components/HelpModal";
import { LoadingInit } from "@/components/LoadingInit";
import { SvgSprite } from "@/components/SvgSprite";

import { StoreContext } from "@/stores/storeContext";
import {
	createFireworksStore,
	type FireworksConfig,
} from "@/stores/fireworksStore";

import { createSimulation } from "@/fireworks/simulation";
import { createInteraction } from "@/fireworks/interaction";
import { createSoundManager } from "@/fireworks/audio";
import { createWordBurstTracker } from "@/fireworks/wordBurst";
import { namedShellTypes } from "@/fireworks/shells";
import { launchShellFromConfig, startSequence } from "@/fireworks/shells";
import { applyResolvedBackground } from "@/fireworks/background";
import {
	IS_DESKTOP,
	IS_HEADER,
	IS_HIGH_END_DEVICE,
	getDefaultScaleFactor,
} from "@/fireworks/device";
import { canPlaySoundSelector } from "@/fireworks/selectors";

import { createBackgroundManager } from "@/lib/backgroundManager";
import { fscreen } from "@/lib/fscreen";
import type { Ticker, Stage } from "@/lib/stage";
import type { PointerEventPayload } from "@/lib/stage";
import type { Background } from "@/stores/fireworksStore";

// ---------------------------------------------------------------------------
// Runtime (computed once at module level)
// ---------------------------------------------------------------------------

const fullscreen = Boolean(fscreen.fullscreenElement);
const defaultScaleFactor = getDefaultScaleFactor();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function App() {
	const [loadingStatus, setLoadingStatus] = useState("正在装配烟花");
	const [ready, setReady] = useState(false);
	const [stageSize, setStageSize] = useState(() => ({
		w: typeof window !== "undefined" ? Math.min(window.innerWidth, 7680) : 800,
		h:
			typeof window !== "undefined"
				? window.innerWidth <= 420
					? window.innerHeight
					: Math.min(window.innerHeight, 4320)
				: 600,
	}));

	// StrictMode-safe refs: never recreated across double-mount
	const storeRef = useRef<ReturnType<typeof createFireworksStore> | null>(null);
	if (!storeRef.current) {
		storeRef.current = createFireworksStore({
			isDesktop: IS_DESKTOP,
			isHeader: IS_HEADER,
			isHighEndDevice: IS_HIGH_END_DEVICE,
			defaultScaleFactor,
			fullscreen,
		});
	}
	const store = storeRef.current;

	const soundManagerRef = useRef<ReturnType<typeof createSoundManager> | null>(
		null,
	);
	const wordBurstTrackerRef = useRef<
		ReturnType<typeof createWordBurstTracker> | null
	>(null);
	const backgroundManagerRef = useRef<
		ReturnType<typeof createBackgroundManager> | null
	>(null);

	if (!soundManagerRef.current) {
		soundManagerRef.current = createSoundManager({
			getCanPlaySound: () => {
				const s = store.getState();
				return !s.paused && s.soundEnabled;
			},
			getSimSpeed: () => interactionRef.current?.getSimSpeed() ?? 1,
		});
	}
	if (!wordBurstTrackerRef.current) {
		wordBurstTrackerRef.current = createWordBurstTracker();
	}

	const interactionRef = useRef<ReturnType<typeof createInteraction> | null>(
		null,
	);
	const simulationRef = useRef<ReturnType<typeof createSimulation> | null>(null);
	const tickerInitializedRef = useRef(false);
	const stageContainerRef = useRef<HTMLDivElement>(null);

	// Stable callback refs so the DualCanvas effect never goes stale
	const callbacksRef = useRef({
		onTickerReady: null as
			| ((ticker: Ticker, trailsStage: Stage, mainStage: Stage) => void)
			| null,
	});
	callbacksRef.current.onTickerReady = handleTickerReady;

	function handleTickerReady(
		ticker: Ticker,
		trailsStage: Stage,
		mainStage: Stage,
	) {
		if (tickerInitializedRef.current) return;
		tickerInitializedRef.current = true;

		const soundManager = soundManagerRef.current!;
		const wordBurstTracker = wordBurstTrackerRef.current!;
		const stageContainer = stageContainerRef.current!;

		// Create backgroundManager early so doInit can use it
		if (!backgroundManagerRef.current) {
			let containerEl: HTMLElement | null =
				stageContainer.querySelector<HTMLElement>(".canvas-container");
			if (!containerEl) containerEl = stageContainer;
			backgroundManagerRef.current = createBackgroundManager({
				container: containerEl,
				onStatusChange: () => {},
			});
		}

		const canvasContainer = stageContainer.querySelector(
			".canvas-container",
		) as HTMLElement;

		const simulation = createSimulation({
			getState: () => store.getState(),
			getSimSpeed: () => interactionRef.current?.getSimSpeed() ?? 1,
			getSpeedBarOpacity: () =>
				interactionRef.current?.getSpeedBarOpacity() ?? 0,
			trailsStage,
			mainStage,
			soundManager,
			wordBurstTracker,
			canvasContainer: canvasContainer ?? stageContainer,
		});
		simulationRef.current = simulation;

		const interaction = createInteraction({
			getState: () => store.getState(),
			mainStage,
			soundManager,
			togglePause: () => {
				const s = store.getState();
				store.setState({ paused: !s.paused });
			},
			toggleSound: () => {
				const s = store.getState();
				store.setState({ soundEnabled: !s.soundEnabled });
			},
			toggleMenu: (open?: boolean) => {
				const next = open ?? !store.getState().menuOpen;
				store.setState({ menuOpen: next });
			},
			isRunning: () => {
				const s = store.getState();
				return !s.paused && !s.menuOpen;
			},
			launchShellFromConfig: (event) => {
				const s = store.getState();
				const state = s;
				const quality = Number(state.config.quality) as 1 | 2 | 3;
				// Read stage dimensions at call time (not closure 0)
				const stageWidth = mainStage.width;
				const stageHeight = mainStage.height;
				launchShellFromConfig(event, {
					quality,
					isHeader: IS_HEADER,
					isDesktop: IS_DESKTOP,
					state,
					shellCtor: simulation.Shell as unknown as Parameters<
						typeof launchShellFromConfig
					>[1]["shellCtor"],
					stageWidth,
					stageHeight,
					registerUserInteraction: () =>
						soundManager.registerInteraction(),
					wordBurstTracker,
				});
			},
			startSequence: () => {
				const s = store.getState();
				const state = s;
				const quality = Number(state.config.quality) as 1 | 2 | 3;
				const stageWidth = mainStage.width;
				const stageHeight = mainStage.height;
				return startSequence({
					quality,
					isHeader: IS_HEADER,
					isDesktop: IS_DESKTOP,
					state,
					shellCtor: simulation.Shell as unknown as Parameters<
						typeof startSequence
					>[0]["shellCtor"],
					stageWidth,
					stageHeight,
					registerUserInteraction: () =>
						soundManager.registerInteraction(),
					wordBurstTracker,
				});
			},
			stageContainer,
			stages: [trailsStage, mainStage],
			scaleFactorSelector: () => store.getState().config.scaleFactor,
		});

		interactionRef.current = interaction;

		ticker.addListener((frameTime, lag) => {
			interaction.updateGlobals(frameTime, lag);
			simulation.update(frameTime, lag);
		});

		interaction.handleResize();
		// Sync DualCanvas size to actual container size after handleResize
		setStageSize({ w: mainStage.width, h: mainStage.height });

		if (IS_HEADER) {
			doInit();
			return;
		}

		setLoadingStatus("正在点燃导火线");
		soundManager.preload().catch(() => {}).finally(doInit);
	}

	function doInit() {
		setReady(true);

		const s = store.getState();
		const shellName = s.config.shell;
		if (shellName !== "Random" && !(shellName in namedShellTypes)) {
			store.setState({
				config: { ...s.config, shell: "Random" },
			});
		}

		store.setState({ paused: false });

		if (Number(store.getState().config.skyLighting) === 0) {
			const container = stageContainerRef.current;
			if (container) {
				container.style.backgroundColor = "#000";
			}
		}

		if (backgroundManagerRef.current) {
			applyResolvedBackground(
				backgroundManagerRef.current,
				store.getState().background,
			);
		}
		// Ensure stages have correct size after container becomes visible
		setTimeout(() => interactionRef.current?.handleResize(), 0);
	}

	// Subscribe to sound state changes
	useEffect(() => {
		const unsub = store.subscribe((state, prevState) => {
			const wasPlaying = prevState ? canPlaySoundSelector(prevState) : false;
			const isPlaying = canPlaySoundSelector(state);
			if (isPlaying && !wasPlaying) {
				soundManagerRef.current?.resumeAll();
			} else if (!isPlaying && wasPlaying) {
				soundManagerRef.current?.pauseAll();
			}
		});
		return unsub;
	}, [store]);

	// Keyboard listener
	useEffect(() => {
		function handleKeydown(e: KeyboardEvent) {
			interactionRef.current?.handleKeydown(e);
		}
		window.addEventListener("keydown", handleKeydown);
		return () => window.removeEventListener("keydown", handleKeydown);
	}, []);

	// Window resize listener
	useEffect(() => {
		function handleResize() {
			interactionRef.current?.handleResize();
			if (interactionRef.current) {
				setStageSize({
					w: interactionRef.current.getStageW() || window.innerWidth,
					h: interactionRef.current.getStageH() || window.innerHeight,
				});
			}
		}
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Fullscreen listener
	useEffect(() => {
		function onFullscreenChange() {
			store.setState({ fullscreen: Boolean(fscreen.fullscreenElement) });
		}
		fscreen.addEventListener("fullscreenchange", onFullscreenChange);
		return () =>
			fscreen.removeEventListener("fullscreenchange", onFullscreenChange);
	}, [store]);

	// Menu callbacks
	const handleConfigChange = useCallback(
		(config: FireworksConfig) => {
			const prev = store.getState().config;
			if (config.wordShell && !prev.wordShell) {
				wordBurstTrackerRef.current?.queueBurst();
			} else if (!config.wordShell && prev.wordShell) {
				wordBurstTrackerRef.current?.reset();
			}

			const prevSkyLighting = Number(prev.skyLighting);
			const nextSkyLighting = Number(config.skyLighting);

			if (nextSkyLighting === 0 && prevSkyLighting !== 0) {
				const container = stageContainerRef.current;
				if (container) {
					container.style.backgroundColor = "#000";
				}
			}

			store.setState({ config });
			// Trigger resize if scaleFactor changed
			if (config.scaleFactor !== prev.scaleFactor) {
				interactionRef.current?.handleResize();
			}
		},
		[store],
	);

	const handleBackgroundApply = useCallback(
		(value: string) => {
			const next: Background = {
				mode: "image",
				value,
				configured: true,
			};
			store.setState({ background: next });
			if (backgroundManagerRef.current) {
				backgroundManagerRef.current.applyBackground({
					mode: "image",
					value,
				});
			}
		},
		[store],
	);

	const handleBackgroundClear = useCallback(() => {
		store.setState({
			background: { mode: "none", value: "", configured: false },
		});
		backgroundManagerRef.current?.clearBackground();
	}, [store]);

	const handleToggleFullscreen = useCallback(() => {
		if (fscreen.fullscreenElement) {
			fscreen.exitFullscreen();
		} else if (stageContainerRef.current) {
			fscreen.requestFullscreen(stageContainerRef.current);
		}
	}, []);

	const handleHelpOpen = useCallback(
		(topic: string) => {
			store.setState({ openHelpTopic: topic });
		},
		[store],
	);

	const handleClose = useCallback(() => {
		store.setState({ menuOpen: false });
	}, [store]);

	// ---------------------------------------------------------------------------
	// Render
	// ---------------------------------------------------------------------------

	return (
		<StoreContext.Provider value={store as unknown as import("zustand").StoreApi<import("@/stores/fireworksStore").FireworksState>}>
			<SvgSprite />
			{!ready && <LoadingInit status={loadingStatus} />}
			<div
				ref={stageContainerRef}
				className={`stage-container${ready ? "" : " remove"}`}
			>
				<DualCanvas
					stageW={stageSize.w || 800}
					stageH={stageSize.h || 600}
					scaleFactor={1}
					onTickerReady={callbacksRef.current.onTickerReady!}
					onPointerStart={(
						payload: PointerEventPayload,
					) => {
						interactionRef.current?.handlePointerStart(payload);
					}}
					onPointerMove={(payload: PointerEventPayload) => {
						interactionRef.current?.handlePointerMove(payload);
					}}
					onPointerEnd={() => {
						interactionRef.current?.handlePointerEnd();
					}}
				/>
				{ready && <Controls />}
				{ready && (
					<Menu
						onConfigChange={handleConfigChange}
						onBackgroundApply={handleBackgroundApply}
						onBackgroundClear={handleBackgroundClear}
						onToggleFullscreen={handleToggleFullscreen}
						onHelpOpen={handleHelpOpen}
						onClose={handleClose}
					/>
				)}
				{ready && <HelpModal />}
			</div>
		</StoreContext.Provider>
	);
}
