/**
 * Fireworks simulation engine – TypeScript port of js/fireworks/simulation.js.
 *
 * All physics, magic numbers, and object pools are preserved exactly.
 * Global state has been replaced with a closure-based SimulationDeps interface.
 *
 * Copyright © 2022 NianBroken. All rights reserved.
 * Github: https://github.com/NianBroken/Firework_Simulator
 * Gitee: https://gitee.com/nianbroken/Firework_Simulator
 * 本项目采用 Apache-2.0 许可证
 */

import {
	COLOR,
	COLOR_CODES,
	COLOR_CODES_W_INVIS,
	COLOR_TUPLES,
	GRAVITY,
	INVISIBLE,
	PI_2,
	PI_HALF,
	SKY_LIGHT_NONE,
} from "@/fireworks/constants";
import { MyMath } from "@/lib/math";
import type { LatticeResult } from "@/lib/math";
import { fireworksAppConfig } from "@/config/appConfig";
import type { Stage } from "@/lib/stage";
import type { SoundManager } from "@/fireworks/audio";
import type { WordBurstTracker } from "@/fireworks/wordBurst";
import type { FireworksState } from "@/stores/fireworksStore";
import type { ShellOptions as BaseShellOptions } from "@/fireworks/shells";
import type { ShellInstance } from "@/fireworks/shells";
import {
	isRunning,
	qualitySelector,
	skyLightingSelector,
	scaleFactorSelector,
	shellSizeSelector,
} from "@/fireworks/selectors";

// ---------------------------------------------------------------------------
// Particle instance types
// ---------------------------------------------------------------------------

/** A single star particle in the simulation. */
interface StarInstance {
	visible: boolean;
	heavy: boolean;
	x: number;
	y: number;
	prevX: number;
	prevY: number;
	color: string;
	speedX: number;
	speedY: number;
	life: number;
	fullLife: number;
	size: number;
	spinAngle: number;
	spinSpeed: number;
	sparkFreq: number;
	sparkSpeed: number;
	sparkTimer: number;
	sparkColor: string;
	sparkLife: number;
	sparkLifeVariation: number;
	spinRadius: number;
	strobe: boolean;
	strobeFreq?: number;
	onDeath: ((star: StarInstance) => void) | null;
	secondColor: string | null;
	transitionTime: number;
	colorChanged: boolean;
	updateFrame: number;
}

/** A single spark particle in the simulation. */
interface SparkInstance {
	x: number;
	y: number;
	prevX: number;
	prevY: number;
	color: string;
	speedX: number;
	speedY: number;
	life: number;
}

/** A single burst-flash instance. */
interface BurstFlashInstance {
	x: number;
	y: number;
	radius: number;
}

/** Map of color-code string to particle array. */
type ParticleCollection<T> = Record<string, T[]>;

// ---------------------------------------------------------------------------
// Dependency interface
// ---------------------------------------------------------------------------

/**
 * External dependencies the simulation needs from the host application.
 *
 * All mutable per-frame values are accessed via getter functions so the
 * simulation never caches stale state.
 */
export interface SimulationDeps {
	/** Current application state snapshot. */
	getState: () => FireworksState;
	/** Current simulation speed multiplier. */
	getSimSpeed: () => number;
	/** Current speed-bar opacity (0 = hidden). */
	getSpeedBarOpacity: () => number;
	/** Trails canvas stage. */
	trailsStage: Stage;
	/** Main canvas stage. */
	mainStage: Stage;
	/** Sound manager for playing effects. */
	soundManager: SoundManager;
	/** Word-burst tracker for deciding when to show word bursts. */
	wordBurstTracker: WordBurstTracker;
	/** DOM container for sky-colour background. */
	canvasContainer: HTMLElement;
}

// ---------------------------------------------------------------------------
// Shell options (extends base with disableWord for sub-shell creation)
// ---------------------------------------------------------------------------

/**
 * Shell configuration accepted by the Shell constructor.
 * Extends BaseShellOptions with `disableWord` (used by sub-shells in burst)
 * and makes `shellSize` optional (sub-shells don't set it).
 */
export interface SimulationShellOptions
	extends Omit<BaseShellOptions, "shellSize"> {
	shellSize?: number;
	disableWord?: boolean;
}

// ---------------------------------------------------------------------------
// Simulation return type
// ---------------------------------------------------------------------------

export interface Simulation {
	/** Main per-frame update. Call from ticker. */
	update(frameTime: number, lag: number): void;
	/** Shell constructor. Compatible with ShellCtor from shells.ts. */
	Shell: new (options: SimulationShellOptions) => ShellInstance;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSimulation(deps: SimulationDeps): Simulation {
	// -----------------------------------------------------------------------
	// Closure state (replaces globals)
	// -----------------------------------------------------------------------

	let currentFrame = 0;
	let currentQuality = 2;
	let currentIsLowQuality = false;
	let currentIsHighQuality = false;
	let currentWordShellEnabled = false;
	let currentSimSpeed = 1;
	let currentSpeedBarOpacity = 0;

	const currentSkyColor = { r: 0, g: 0, b: 0 };
	const targetSkyColor = { r: 0, g: 0, b: 0 };
	const wordDotCache = new Map<string, LatticeResult>();

	// -----------------------------------------------------------------------
	// Pool helpers
	// -----------------------------------------------------------------------

	function createParticleCollection<T>(): ParticleCollection<T> {
		const collection: ParticleCollection<T> = {} as ParticleCollection<T>;
		for (const colorCode of COLOR_CODES_W_INVIS) {
			collection[colorCode] = [];
		}
		return collection;
	}

	// -----------------------------------------------------------------------
	// BurstFlash pool
	// -----------------------------------------------------------------------

	const BurstFlash = {
		active: [] as BurstFlashInstance[],
		_pool: [] as BurstFlashInstance[],

		_new(): BurstFlashInstance {
			return {} as BurstFlashInstance;
		},

		add(x: number, y: number, radius: number): BurstFlashInstance {
			const instance = this._pool.pop() || this._new();
			instance.x = x;
			instance.y = y;
			instance.radius = radius;
			this.active.push(instance);
			return instance;
		},

		returnInstance(instance: BurstFlashInstance): void {
			this._pool.push(instance);
		},
	};

	// -----------------------------------------------------------------------
	// Star pool
	// -----------------------------------------------------------------------

	const Star = {
		airDrag: 0.98,
		airDragHeavy: 0.992,
		active: createParticleCollection<StarInstance>(),
		_pool: [] as StarInstance[],

		_new(): StarInstance {
			return {} as StarInstance;
		},

		add(
			x: number,
			y: number,
			color: string,
			angle: number,
			speed: number,
			life: number,
			speedOffsetX?: number,
			speedOffsetY?: number,
			size = 3,
		): StarInstance {
			const instance = this._pool.pop() || this._new();
			instance.visible = true;
			instance.heavy = false;
			instance.x = x;
			instance.y = y;
			instance.prevX = x;
			instance.prevY = y;
			instance.color = color;
			instance.speedX = Math.sin(angle) * speed + (speedOffsetX || 0);
			instance.speedY = Math.cos(angle) * speed + (speedOffsetY || 0);
			instance.life = life;
			instance.fullLife = life;
			instance.size = size;
			instance.spinAngle = Math.random() * PI_2;
			instance.spinSpeed = 0.8;
			instance.spinRadius = 0;
			instance.sparkFreq = 0;
			instance.sparkSpeed = 1;
			instance.sparkTimer = 0;
			instance.sparkColor = color;
			instance.sparkLife = 750;
			instance.sparkLifeVariation = 0.25;
			instance.strobe = false;
			instance.strobeFreq = undefined;
			instance.onDeath = null;
			instance.secondColor = null;
			instance.transitionTime = 0;
			instance.colorChanged = false;
			instance.updateFrame = 0;
			this.active[color].push(instance);
			return instance;
		},

		returnInstance(instance: StarInstance): void {
			if (instance.onDeath) {
				instance.onDeath(instance);
			}
			instance.onDeath = null;
			instance.secondColor = null;
			instance.transitionTime = 0;
			instance.colorChanged = false;
			this._pool.push(instance);
		},
	};

	// -----------------------------------------------------------------------
	// Spark pool
	// -----------------------------------------------------------------------

	const Spark = {
		drawWidth: 0,
		airDrag: 0.9,
		active: createParticleCollection<SparkInstance>(),
		_pool: [] as SparkInstance[],

		_new(): SparkInstance {
			return {} as SparkInstance;
		},

		add(
			x: number,
			y: number,
			color: string,
			angle: number,
			speed: number,
			life: number,
		): SparkInstance {
			const instance = this._pool.pop() || this._new();
			instance.x = x;
			instance.y = y;
			instance.prevX = x;
			instance.prevY = y;
			instance.color = color;
			instance.speedX = Math.sin(angle) * speed;
			instance.speedY = Math.cos(angle) * speed;
			instance.life = life;
			this.active[color].push(instance);
			return instance;
		},

		returnInstance(instance: SparkInstance): void {
			this._pool.push(instance);
		},
	};

	// -----------------------------------------------------------------------
	// Random colour (simple version — no notSame/notColor logic)
	// -----------------------------------------------------------------------

	function randomColor(): string {
		return COLOR_CODES[(Math.random() * COLOR_CODES.length) | 0];
	}

	// -----------------------------------------------------------------------
	// createParticleArc
	// -----------------------------------------------------------------------

	function createParticleArc(
		start: number,
		arcLength: number,
		count: number,
		randomness: number,
		particleFactory: (angle: number) => void,
	): void {
		const angleDelta = arcLength / count;
		const end = start + arcLength - angleDelta * 0.5;

		if (end > start) {
			for (let angle = start; angle < end; angle = angle + angleDelta) {
				particleFactory(angle + Math.random() * angleDelta * randomness);
			}
			return;
		}

		for (let angle = start; angle > end; angle = angle + angleDelta) {
			particleFactory(angle + Math.random() * angleDelta * randomness);
		}
	}

	// -----------------------------------------------------------------------
	// getWordDots
	// -----------------------------------------------------------------------

	function getWordDots(word: string): LatticeResult | null {
		if (!word) {
			return null;
		}

		const fontSize = MyMath.randomInt(
			fireworksAppConfig.wordFontSizeMin,
			fireworksAppConfig.wordFontSizeMax,
		);
		const cacheKey = `${word}:${fontSize}`;
		if (!wordDotCache.has(cacheKey)) {
			wordDotCache.set(
				cacheKey,
				MyMath.literalLattice(
					word,
					fireworksAppConfig.wordPointDensity,
					fireworksAppConfig.wordFontFamily,
					`${fontSize}px`,
				),
			);
		}

		return wordDotCache.get(cacheKey)!;
	}

	// -----------------------------------------------------------------------
	// createBurst
	// -----------------------------------------------------------------------

	function createBurst(
		count: number,
		particleFactory: (angle: number, speedMultiplier: number) => void,
		startAngle = 0,
		arcLength = PI_2,
	): void {
		const radius = 0.5 * Math.sqrt(count / Math.PI);
		const circumference = 2 * radius * Math.PI;
		const halfCircumference = circumference / 2;

		for (let ringIndex = 0; ringIndex <= halfCircumference; ringIndex += 1) {
			const ringAngle = (ringIndex / halfCircumference) * PI_HALF;
			const ringSize = Math.cos(ringAngle);
			const partsPerFullRing = circumference * ringSize;
			const partsPerArc = partsPerFullRing * (arcLength / PI_2);
			const angleIncrement = PI_2 / partsPerFullRing;
			const angleOffset = Math.random() * angleIncrement + startAngle;
			const maxRandomAngleOffset = angleIncrement * 0.33;

			for (
				let particleIndex = 0;
				particleIndex < partsPerArc;
				particleIndex += 1
			) {
				const randomAngleOffset = Math.random() * maxRandomAngleOffset;
				const angle =
					angleIncrement * particleIndex + angleOffset + randomAngleOffset;
				particleFactory(angle, ringSize);
			}
		}
	}

	// -----------------------------------------------------------------------
	// createWordBurst
	// -----------------------------------------------------------------------

	function createWordBurst(
		wordText: string,
		particleFactory: (
			point: { x: number; y: number },
			color: string,
			strobe: boolean,
			strobeColor: string,
		) => void,
		centerX: number,
		centerY: number,
	): void {
		const map = getWordDots(wordText);
		if (!map) {
			return;
		}

		const centerOffsetX = map.width / 2;
		const centerOffsetY = map.height / 2;
		const color = randomColor();
		const strobed = Math.random() < 0.5;
		const strobeColor = strobed ? randomColor() : color;

		for (let index = 0; index < map.points.length; index += 1) {
			const point = map.points[index];
			particleFactory(
				{
					x: centerX + (point.x - centerOffsetX),
					y: centerY + (point.y - centerOffsetY),
				},
				color,
				strobed,
				strobeColor,
			);
		}
	}

	// -----------------------------------------------------------------------
	// Effect functions
	// -----------------------------------------------------------------------

	function crossetteEffect(star: StarInstance): void {
		const startAngle = Math.random() * PI_HALF;
		createParticleArc(startAngle, PI_2, 4, 0.5, (angle) => {
			Star.add(
				star.x,
				star.y,
				star.color,
				angle,
				Math.random() * 0.6 + 0.75,
				600,
			);
		});
	}

	function floralEffect(star: StarInstance): void {
		const count = 12 + 6 * currentQuality;
		createBurst(count, (angle, speedMultiplier) => {
			Star.add(
				star.x,
				star.y,
				star.color,
				angle,
				speedMultiplier * 2.4,
				1000 + Math.random() * 300,
				star.speedX,
				star.speedY,
			);
		});
		BurstFlash.add(star.x, star.y, 46);
		deps.soundManager.playSound("burstSmall");
	}

	function fallingLeavesEffect(star: StarInstance): void {
		createBurst(7, (angle, speedMultiplier) => {
			const newStar = Star.add(
				star.x,
				star.y,
				INVISIBLE,
				angle,
				speedMultiplier * 2.4,
				2400 + Math.random() * 600,
				star.speedX,
				star.speedY,
			);
			newStar.sparkColor = COLOR.Gold;
			newStar.sparkFreq = 144 / currentQuality;
			newStar.sparkSpeed = 0.28;
			newStar.sparkLife = 750;
			newStar.sparkLifeVariation = 3.2;
		});
		BurstFlash.add(star.x, star.y, 46);
		deps.soundManager.playSound("burstSmall");
	}

	function crackleEffect(star: StarInstance): void {
		const count = currentIsHighQuality ? 32 : 16;
		createParticleArc(0, PI_2, count, 1.8, (angle) => {
			Spark.add(
				star.x,
				star.y,
				COLOR.Gold,
				angle,
				Math.pow(Math.random(), 0.45) * 2.4,
				300 + Math.random() * 200,
			);
		});
	}

	// -----------------------------------------------------------------------
	// Shell class
	// -----------------------------------------------------------------------

	class Shell implements ShellInstance {
		// All ShellOptions fields (copied via Object.assign in constructor)
		shellSize!: number;
		spreadSize!: number;
		starLife!: number;
		starLifeVariation!: number;
		starCount!: number;
		color!: string | string[];
		secondColor?: string | null;
		glitter?: string;
		glitterColor!: string;
		pistil?: boolean;
		pistilColor?: string | false;
		streamers?: boolean;
		ring?: boolean;
		crossette?: boolean;
		floral?: boolean;
		fallingLeaves?: boolean;
		horsetail?: boolean;
		strobe?: boolean;
		strobeColor?: string | null;
		crackle?: boolean;
		starDensity?: number;

		// Extra fields not in ShellOptions
		disableWord!: boolean;
		forceWordBurst?: boolean;
		comet: StarInstance | null = null;

		constructor(options: SimulationShellOptions) {
			Object.assign(this, options);
			this.starLifeVariation = options.starLifeVariation ?? 0.125;
			this.color = options.color || randomColor();
			this.glitterColor =
				options.glitterColor ||
				(typeof this.color === "string" ? this.color : randomColor());
			this.disableWord = options.disableWord ?? false;

			if (!this.starCount) {
				const density = options.starDensity || 1;
				const scaledSize = this.spreadSize / 54;
				this.starCount = Math.max(6, scaledSize * scaledSize * density);
			}
		}

		launch(position: number, launchHeight: number): void {
			const width = deps.trailsStage.width;
			const height = deps.trailsStage.height;
			const horizontalPadding = 60;
			const verticalPadding = 50;
			const minimumHeightPercent = 0.45;
			const minimumHeight = height - height * minimumHeightPercent;
			const launchX =
				position * (width - horizontalPadding * 2) + horizontalPadding;
			const launchY = height;
			const burstY =
				minimumHeight - launchHeight * (minimumHeight - verticalPadding);
			const launchDistance = launchY - burstY;
			const launchVelocity = Math.pow(launchDistance * 0.04, 0.64);

			const comet = (this.comet = Star.add(
				launchX,
				launchY,
				typeof this.color === "string" && this.color !== "random"
					? this.color
					: COLOR.White,
				Math.PI,
				launchVelocity * (this.horsetail ? 1.2 : 1),
				launchVelocity * (this.horsetail ? 100 : 400),
			));

			comet.heavy = true;
			comet.spinRadius = MyMath.random(0.32, 0.85);
			comet.sparkFreq = currentIsHighQuality ? 8 : 32 / currentQuality;
			comet.sparkLife = 320;
			comet.sparkLifeVariation = 3;

			if (this.glitter === "willow" || this.fallingLeaves) {
				comet.sparkFreq = 20 / currentQuality;
				comet.sparkSpeed = 0.5;
				comet.sparkLife = 500;
			}

			if (this.color === INVISIBLE) {
				comet.sparkColor = COLOR.Gold;
			}

			if (Math.random() > 0.4 && !this.horsetail) {
				comet.secondColor = INVISIBLE;
				comet.transitionTime = Math.pow(Math.random(), 1.5) * 700 + 500;
			}

			comet.onDeath = (activeComet) => this.burst(activeComet.x, activeComet.y);
			deps.soundManager.playSound("lift");
		}

		burst(x: number, y: number): void {
			const speed = this.spreadSize / 96;
			let color: string | null = null;
			let onDeath: ((star: StarInstance) => void) | undefined;
			let sparkFreq: number | undefined;
			let sparkSpeed: number | undefined;
			let sparkLife: number | undefined;
			let sparkLifeVariation = 0.25;
			let playedDeathSound = false;

			if (this.crossette) {
				onDeath = (star) => {
					if (!playedDeathSound) {
						deps.soundManager.playSound("crackleSmall");
						playedDeathSound = true;
					}
					crossetteEffect(star);
				};
			}

			if (this.crackle) {
				onDeath = (star) => {
					if (!playedDeathSound) {
						deps.soundManager.playSound("crackle");
						playedDeathSound = true;
					}
					crackleEffect(star);
				};
			}

			if (this.floral) {
				onDeath = floralEffect;
			}
			if (this.fallingLeaves) {
				onDeath = fallingLeavesEffect;
			}

			if (this.glitter === "light") {
				sparkFreq = 400;
				sparkSpeed = 0.3;
				sparkLife = 300;
				sparkLifeVariation = 2;
			} else if (this.glitter === "medium") {
				sparkFreq = 200;
				sparkSpeed = 0.44;
				sparkLife = 700;
				sparkLifeVariation = 2;
			} else if (this.glitter === "heavy") {
				sparkFreq = 80;
				sparkSpeed = 0.8;
				sparkLife = 1400;
				sparkLifeVariation = 2;
			} else if (this.glitter === "thick") {
				sparkFreq = 16;
				sparkSpeed = currentIsHighQuality ? 1.65 : 1.5;
				sparkLife = 1400;
				sparkLifeVariation = 3;
			} else if (this.glitter === "streamer") {
				sparkFreq = 32;
				sparkSpeed = 1.05;
				sparkLife = 620;
				sparkLifeVariation = 2;
			} else if (this.glitter === "willow") {
				sparkFreq = 120;
				sparkSpeed = 0.34;
				sparkLife = 1400;
				sparkLifeVariation = 3.8;
			}

			sparkFreq = (sparkFreq ?? 0) / currentQuality;

			const starFactory = (angle: number, speedMultiplier: number) => {
				const standardInitialSpeed = this.spreadSize / 1800;
				const star = Star.add(
					x,
					y,
					color || randomColor(),
					angle,
					speedMultiplier * speed,
					this.starLife + Math.random() * this.starLife * this.starLifeVariation,
					this.horsetail ? this.comet?.speedX : 0,
					this.horsetail ? this.comet?.speedY : -standardInitialSpeed,
				);

				if (this.secondColor) {
					star.transitionTime = this.starLife * (Math.random() * 0.05 + 0.32);
					star.secondColor = this.secondColor;
				}

				if (this.strobe) {
					star.transitionTime = this.starLife * (Math.random() * 0.08 + 0.46);
					star.strobe = true;
					star.strobeFreq = Math.random() * 20 + 40;
					if (this.strobeColor) {
						star.secondColor = this.strobeColor;
					}
				}

				star.onDeath = onDeath ?? null;

				if (this.glitter) {
					star.sparkFreq = sparkFreq!;
					star.sparkSpeed = sparkSpeed!;
					star.sparkLife = sparkLife!;
					star.sparkLifeVariation = sparkLifeVariation;
					star.sparkColor = this.glitterColor;
					star.sparkTimer = Math.random() * star.sparkFreq;
				}
			};

			const dotStarFactory = (
				point: { x: number; y: number },
				pointColor: string,
				strobe: boolean,
				strobeColorArg: string,
			) => {
				const standardInitialSpeed = this.spreadSize / 1800;

				if (strobe) {
					const dotSpeed = Math.random() * 0.1 + 0.05;
					const star = Star.add(
						point.x,
						point.y,
						pointColor,
						Math.random() * PI_2,
						dotSpeed,
						this.starLife +
							Math.random() * this.starLife * this.starLifeVariation +
							dotSpeed * 1000,
						this.horsetail ? this.comet?.speedX : 0,
						this.horsetail ? this.comet?.speedY : -standardInitialSpeed,
						2,
					);

					star.transitionTime = this.starLife * (Math.random() * 0.08 + 0.46);
					star.strobe = true;
					star.strobeFreq = Math.random() * 20 + 40;
					star.secondColor = strobeColorArg;
				} else {
					Spark.add(
						point.x,
						point.y,
						pointColor,
						Math.random() * PI_2,
						Math.pow(Math.random(), 0.15) * 1.4,
						this.starLife +
							Math.random() * this.starLife * this.starLifeVariation +
							1000,
					);
				}

				Spark.add(
					point.x + 5,
					point.y + 10,
					pointColor,
					Math.random() * PI_2,
					Math.pow(Math.random(), 0.05) * 0.4,
					this.starLife +
						Math.random() * this.starLife * this.starLifeVariation +
						2000,
				);
			};

			if (typeof this.color === "string") {
				color = this.color === "random" ? null : this.color;
				if (this.ring) {
					const ringStartAngle = Math.random() * Math.PI;
					const ringSquash = Math.pow(Math.random(), 2) * 0.85 + 0.15;
					createParticleArc(0, PI_2, this.starCount, 0, (angle) => {
						const initialSpeedX = Math.sin(angle) * speed * ringSquash;
						const initialSpeedY = Math.cos(angle) * speed;
						const nextSpeed = MyMath.pointDist(
							0,
							0,
							initialSpeedX,
							initialSpeedY,
						);
						const nextAngle =
							MyMath.pointAngle(0, 0, initialSpeedX, initialSpeedY) +
							ringStartAngle;
						const star = Star.add(
							x,
							y,
							color || randomColor(),
							nextAngle,
							nextSpeed,
							this.starLife +
								Math.random() * this.starLife * this.starLifeVariation,
						);

						if (this.glitter) {
							star.sparkFreq = sparkFreq!;
							star.sparkSpeed = sparkSpeed!;
							star.sparkLife = sparkLife!;
							star.sparkLifeVariation = sparkLifeVariation;
							star.sparkColor = this.glitterColor;
							star.sparkTimer = Math.random() * star.sparkFreq;
						}
					});
				} else {
					createBurst(this.starCount, starFactory);
				}
			} else if (Array.isArray(this.color)) {
				if (Math.random() < 0.5) {
					const start = Math.random() * Math.PI;
					const oppositeStart = start + Math.PI;
					const arc = Math.PI;
					color = this.color[0];
					createBurst(this.starCount, starFactory, start, arc);
					color = this.color[1];
					createBurst(this.starCount, starFactory, oppositeStart, arc);
				} else {
					color = this.color[0];
					createBurst(this.starCount / 2, starFactory);
					color = this.color[1];
					createBurst(this.starCount / 2, starFactory);
				}
			} else {
				throw new Error(`无效的烟花颜色配置: ${this.color as string}`);
			}

			if (
				deps.wordBurstTracker.shouldCreateBurst(
					{
						disableWord: this.disableWord,
						comet: !!this.comet,
						forceWordBurst: this.forceWordBurst,
					},
					currentWordShellEnabled,
				)
			) {
				// Simple randomWord: pick from default words
				const words = fireworksAppConfig.defaultWords;
				const word = words[(Math.random() * words.length) | 0];
				createWordBurst(word, dotStarFactory, x, y);
			}

			if (this.pistil) {
				new Shell({
					spreadSize: this.spreadSize * 0.5,
					starLife: this.starLife * 0.6,
					starLifeVariation: this.starLifeVariation,
					starDensity: 1.4,
					color: this.pistilColor as string,
					glitter: "light",
					disableWord: true,
					glitterColor:
						typeof this.pistilColor === "string" &&
						this.pistilColor === COLOR.Gold
							? COLOR.Gold
							: COLOR.White,
				}).burst(x, y);
			}

			if (this.streamers) {
				new Shell({
					spreadSize: this.spreadSize * 0.9,
					starLife: this.starLife * 0.8,
					starLifeVariation: this.starLifeVariation,
					starCount: Math.floor(Math.max(6, this.spreadSize / 45)),
					color: COLOR.White,
					disableWord: true,
					glitter: "streamer",
				}).burst(x, y);
			}

			BurstFlash.add(x, y, this.spreadSize / 4);

			if (this.comet) {
				const maxDiff = 2;
				const sizeDifferenceFromMax = Math.min(
					maxDiff,
					shellSizeSelector(deps.getState()) - this.shellSize,
				);
				const soundScale =
					(1 - sizeDifferenceFromMax / maxDiff) * 0.3 + 0.7;
				deps.soundManager.playSound("burst", soundScale);
			}
		}
	}

	// -----------------------------------------------------------------------
	// colorSky
	// -----------------------------------------------------------------------

	function colorSky(speed: number): void {
		const maxSkySaturation = skyLightingSelector(deps.getState()) * 15;
		const maxStarCount = 500;
		let totalStarCount = 0;

		targetSkyColor.r = 0;
		targetSkyColor.g = 0;
		targetSkyColor.b = 0;

		for (const colorCode of COLOR_CODES) {
			const tuple = COLOR_TUPLES[colorCode];
			const count = Star.active[colorCode].length;
			totalStarCount += count;
			targetSkyColor.r += tuple.r * count;
			targetSkyColor.g += tuple.g * count;
			targetSkyColor.b += tuple.b * count;
		}

		const intensity = Math.pow(
			Math.min(1, totalStarCount / maxStarCount),
			0.3,
		);
		const maxColorComponent = Math.max(
			1,
			targetSkyColor.r,
			targetSkyColor.g,
			targetSkyColor.b,
		);

		targetSkyColor.r =
			(targetSkyColor.r / maxColorComponent) * maxSkySaturation * intensity;
		targetSkyColor.g =
			(targetSkyColor.g / maxColorComponent) * maxSkySaturation * intensity;
		targetSkyColor.b =
			(targetSkyColor.b / maxColorComponent) * maxSkySaturation * intensity;

		const colorChange = 10;
		currentSkyColor.r +=
			((targetSkyColor.r - currentSkyColor.r) / colorChange) * speed;
		currentSkyColor.g +=
			((targetSkyColor.g - currentSkyColor.g) / colorChange) * speed;
		currentSkyColor.b +=
			((targetSkyColor.b - currentSkyColor.b) / colorChange) * speed;

		deps.canvasContainer.style.backgroundColor = `rgb(${currentSkyColor.r | 0}, ${currentSkyColor.g | 0}, ${currentSkyColor.b | 0})`;
	}

	// -----------------------------------------------------------------------
	// render
	// -----------------------------------------------------------------------

	function render(speed: number, width: number, height: number): void {
		const { dpr } = deps.mainStage;
		const trailsContext = deps.trailsStage.ctx;
		const mainContext = deps.mainStage.ctx;

		if (skyLightingSelector(deps.getState()) !== SKY_LIGHT_NONE) {
			colorSky(speed);
		}

		const scaleFactor = scaleFactorSelector(deps.getState());
		trailsContext.scale(dpr * scaleFactor, dpr * scaleFactor);
		mainContext.scale(dpr * scaleFactor, dpr * scaleFactor);

		trailsContext.globalCompositeOperation = "source-over";
		trailsContext.fillStyle = `rgba(0, 0, 0, ${deps.getState().config.longExposure ? 0.0025 : 0.175 * speed})`;
		trailsContext.fillRect(0, 0, width, height);
		mainContext.clearRect(0, 0, width, height);

		while (BurstFlash.active.length) {
			const flash = BurstFlash.active.pop()!;
			const burstGradient = trailsContext.createRadialGradient(
				flash.x,
				flash.y,
				0,
				flash.x,
				flash.y,
				flash.radius,
			);
			burstGradient.addColorStop(0.024, "rgba(255, 255, 255, 1)");
			burstGradient.addColorStop(0.125, "rgba(255, 160, 20, 0.2)");
			burstGradient.addColorStop(0.32, "rgba(255, 140, 20, 0.11)");
			burstGradient.addColorStop(1, "rgba(255, 120, 20, 0)");
			trailsContext.fillStyle = burstGradient;
			trailsContext.fillRect(
				flash.x - flash.radius,
				flash.y - flash.radius,
				flash.radius * 2,
				flash.radius * 2,
			);
			BurstFlash.returnInstance(flash);
		}

		trailsContext.globalCompositeOperation = "lighten";

		trailsContext.lineWidth = 3;
		trailsContext.lineCap = currentIsLowQuality ? "square" : "round";
		mainContext.strokeStyle = "#fff";
		mainContext.lineWidth = 1;
		mainContext.beginPath();

		for (const colorCode of COLOR_CODES) {
			const stars = Star.active[colorCode];
			trailsContext.strokeStyle = colorCode;
			trailsContext.beginPath();

			for (const star of stars) {
				if (!star.visible) {
					continue;
				}

				trailsContext.lineWidth = star.size;
				trailsContext.moveTo(star.x, star.y);
				trailsContext.lineTo(star.prevX, star.prevY);
				mainContext.moveTo(star.x, star.y);
				mainContext.lineTo(
					star.x - star.speedX * 1.6,
					star.y - star.speedY * 1.6,
				);
			}

			trailsContext.stroke();
		}

		mainContext.stroke();

		trailsContext.lineWidth = Spark.drawWidth;
		trailsContext.lineCap = "butt";
		for (const colorCode of COLOR_CODES) {
			const sparks = Spark.active[colorCode];
			trailsContext.strokeStyle = colorCode;
			trailsContext.beginPath();
			for (const spark of sparks) {
				trailsContext.moveTo(spark.x, spark.y);
				trailsContext.lineTo(spark.prevX, spark.prevY);
			}
			trailsContext.stroke();
		}

		if (currentSpeedBarOpacity) {
			const speedBarHeight = 6;
			mainContext.globalAlpha = currentSpeedBarOpacity;
			mainContext.fillStyle = COLOR.Blue;
			mainContext.fillRect(
				0,
				height - speedBarHeight,
				width * currentSimSpeed,
				speedBarHeight,
			);
			mainContext.globalAlpha = 1;
		}

		trailsContext.setTransform(1, 0, 0, 1, 0, 0);
		mainContext.setTransform(1, 0, 0, 1, 0, 0);
	}

	// -----------------------------------------------------------------------
	// update (main entry point)
	// -----------------------------------------------------------------------

	function update(frameTime: number, lag: number): void {
		const state = deps.getState();
		if (!isRunning(state)) {
			return;
		}

		// Refresh per-frame state from deps
		currentSimSpeed = deps.getSimSpeed();
		currentSpeedBarOpacity = deps.getSpeedBarOpacity();
		currentQuality = qualitySelector(state);
		currentIsLowQuality = currentQuality === 1;
		currentIsHighQuality = currentQuality === 3;
		currentWordShellEnabled = state.config.wordShell;

		const width = deps.trailsStage.width;
		const height = deps.trailsStage.height;
		const timeStep = frameTime * currentSimSpeed;
		const speed = currentSimSpeed * lag;

		currentFrame += 1;

		const starDrag = 1 - (1 - Star.airDrag) * speed;
		const starDragHeavy = 1 - (1 - Star.airDragHeavy) * speed;
		const sparkDrag = 1 - (1 - Spark.airDrag) * speed;
		const gravityAcceleration = (timeStep / 1000) * GRAVITY;

		for (const colorCode of COLOR_CODES_W_INVIS) {
			const stars = Star.active[colorCode];
			for (let index = stars.length - 1; index >= 0; index -= 1) {
				const star = stars[index];
				if (star.updateFrame === currentFrame) {
					continue;
				}

				star.updateFrame = currentFrame;
				star.life -= timeStep;

				if (star.life <= 0) {
					stars.splice(index, 1);
					Star.returnInstance(star);
					continue;
				}

				const burnRate = Math.pow(star.life / star.fullLife, 0.5);
				const inverseBurnRate = 1 - burnRate;

				star.prevX = star.x;
				star.prevY = star.y;
				star.x += star.speedX * speed;
				star.y += star.speedY * speed;

				if (star.heavy) {
					star.speedX *= starDragHeavy;
					star.speedY *= starDragHeavy;
				} else {
					star.speedX *= starDrag;
					star.speedY *= starDrag;
				}

				star.speedY += gravityAcceleration;

				if (star.spinRadius) {
					star.spinAngle += star.spinSpeed * speed;
					star.x += Math.sin(star.spinAngle) * star.spinRadius * speed;
					star.y += Math.cos(star.spinAngle) * star.spinRadius * speed;
				}

				if (star.sparkFreq) {
					star.sparkTimer -= timeStep;
					while (star.sparkTimer < 0) {
						star.sparkTimer +=
							star.sparkFreq * 0.75 +
							star.sparkFreq * inverseBurnRate * 4;
						Spark.add(
							star.x,
							star.y,
							star.sparkColor,
							Math.random() * PI_2,
							Math.random() * star.sparkSpeed * burnRate,
							star.sparkLife * 0.8 +
								Math.random() *
									star.sparkLifeVariation *
									star.sparkLife,
						);
					}
				}

				if (star.life < star.transitionTime) {
					if (star.secondColor && !star.colorChanged) {
						star.colorChanged = true;
						star.color = star.secondColor;
						stars.splice(index, 1);
						Star.active[star.secondColor].push(star);
						if (star.secondColor === INVISIBLE) {
							star.sparkFreq = 0;
						}
					}

					if (star.strobe) {
						star.visible =
							Math.floor(star.life / star.strobeFreq!) % 3 === 0;
					}
				}
			}

			const sparks = Spark.active[colorCode];
			for (let index = sparks.length - 1; index >= 0; index -= 1) {
				const spark = sparks[index];
				spark.life -= timeStep;

				if (spark.life <= 0) {
					sparks.splice(index, 1);
					Spark.returnInstance(spark);
					continue;
				}

				spark.prevX = spark.x;
				spark.prevY = spark.y;
				spark.x += spark.speedX * speed;
				spark.y += spark.speedY * speed;
				spark.speedX *= sparkDrag;
				spark.speedY *= sparkDrag;
				spark.speedY += gravityAcceleration;
			}
		}

		render(speed, width, height);
	}

	// -----------------------------------------------------------------------
	// Public API
	// -----------------------------------------------------------------------

	return { update, Shell };
}
