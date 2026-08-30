"use client";

import { useCallback, useState } from "react";
import { useStore } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { useFireworksStore } from "@/stores/storeContext";
import { fireworksAppConfig } from "@/config/appConfig";
import { shellNames } from "@/fireworks/shells";
import { buildDefaultConfig, type FireworksConfig } from "@/stores/fireworksStore";
import type { HelpContent } from "@/types/app";
import { Icon } from "./Icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SHELL_SIZE_OPTIONS = ['3"', '4"', '6"', '8"', '12"', '16"'].map((label, index) => ({
  value: String(index),
  label,
}));

const QUALITY_OPTIONS = [
  { label: "低", value: String(fireworksAppConfig.qualityLevels.low) },
  { label: "正常", value: String(fireworksAppConfig.qualityLevels.normal) },
  { label: "高", value: String(fireworksAppConfig.qualityLevels.high) },
];

const SKY_LIGHTING_OPTIONS = [
  { label: "不", value: String(fireworksAppConfig.skyLightingModes.none) },
  { label: "暗", value: String(fireworksAppConfig.skyLightingModes.dim) },
  {
    label: "正常",
    value: String(fireworksAppConfig.skyLightingModes.normal),
  },
];

const SCALE_FACTOR_OPTIONS = fireworksAppConfig.scaleFactorOptions.map((value) => ({
  value: value.toFixed(2),
  label: `${value * 100}%`,
}));

const BACKGROUND_PRESETS = [
  { label: "星空", value: "linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 50%, #0d0d3d 100%)" },
  { label: "暮色", value: "linear-gradient(180deg, #1a0533 0%, #2d1b4e 40%, #0f0a1e 100%)" },
  { label: "深海", value: "linear-gradient(180deg, #001428 0%, #002850 50%, #001428 100%)" },
  { label: "暗夜", value: "linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)" },
  { label: "极光", value: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 30%, #0d2847 60%, #061220 100%)" },
  { label: "紫霞", value: "linear-gradient(135deg, #1a0533 0%, #3d1a5c 40%, #1a0533 100%)" },
];

export interface MenuProps {
  onConfigChange: (config: FireworksConfig) => void;
  onBackgroundApply: (value: string) => void;
  onBackgroundClear: () => void;
  onToggleFullscreen: () => void;
  onHelpOpen: (topic: keyof HelpContent) => void;
  onClose: () => void;
}

export function Menu({
  onConfigChange,
  onBackgroundApply,
  onBackgroundClear,
  onToggleFullscreen,
  onHelpOpen,
  onClose,
}: MenuProps) {
  const store = useFireworksStore();
  const menuOpen = useStore(store, (s) => s.menuOpen);
  const config = useStore(store, (s) => s.config);
  const fullscreen = useStore(store, (s) => s.fullscreen);
  const background = useStore(store, (s) => s.background);

  const [backgroundInput, setBackgroundInput] = useState(
    background.configured ? background.value : "",
  );

  const updateConfig = useCallback(
    (patch: Partial<FireworksConfig>) => {
      store.setState((state) => ({
        config: { ...state.config, ...patch },
      }));
      onConfigChange(store.getState().config);
    },
    [store, onConfigChange],
  );

  const handleSelectChange = useCallback(
    (field: keyof FireworksConfig, value: string) => {
      if (field === "scaleFactor") {
        updateConfig({ scaleFactor: Number.parseFloat(value) });
      } else {
        updateConfig({ [field]: value } as Partial<FireworksConfig>);
      }
    },
    [updateConfig],
  );

  const handleCheckboxChange = useCallback(
    (field: keyof FireworksConfig, checked: boolean) => {
      updateConfig({ [field]: checked } as Partial<FireworksConfig>);
    },
    [updateConfig],
  );

  const handleHelpClick = useCallback(
    (topic: keyof HelpContent) => {
      onHelpOpen(topic);
    },
    [onHelpOpen],
  );

  const handlePresetClick = useCallback(
    (value: string) => {
      setBackgroundInput(value);
      onBackgroundApply(value);
    },
    [onBackgroundApply],
  );

  const handleCustomBackgroundApply = useCallback(() => {
    if (backgroundInput.trim()) {
      onBackgroundApply(backgroundInput.trim());
    }
  }, [backgroundInput, onBackgroundApply]);

  const handleResetDefaults = useCallback(() => {
    const runtime = {
      isDesktop: window.innerWidth >= 840,
      isHeader: false,
      isHighEndDevice: navigator.hardwareConcurrency >= 8,
      defaultScaleFactor: 1,
      fullscreen: false,
    };
    const defaults = buildDefaultConfig(runtime);
    store.setState({ config: defaults });
    onConfigChange(defaults);
    onBackgroundClear();
    setBackgroundInput("");
  }, [store, onConfigChange, onBackgroundClear]);

  const isHidden = !menuOpen;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.3 },
    }),
  };

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          className="menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="menu__inner-wrap"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <button
              className="btn btn--bright close-menu-btn"
              type="button"
              aria-label="关闭设置"
              onClick={onClose}
            >
              <Icon name="icon-close" size={24} className="text-white" />
            </button>
            <div className="menu__header">设置</div>
            <div className="menu__subheader">若想了解更多信息 请点击任意标签</div>

            <div className="menu__cards">
              <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white/90">烟花设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="form-option form-option--select">
                      <Label className="shell-type-label cursor-pointer text-white/70" onClick={() => handleHelpClick("shellType")}>
                        烟花类型
                      </Label>
                      <Select value={config.shell} onValueChange={(v) => handleSelectChange("shell", v)}>
                        <SelectTrigger className="w-[180px] bg-black/50 border-white/20 text-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20">
                          {shellNames.map((name) => (
                            <SelectItem key={name} value={name} className="text-white/70 focus:text-white focus:bg-white/10">
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="form-option form-option--select">
                      <Label className="shell-size-label cursor-pointer text-white/70" onClick={() => handleHelpClick("shellSize")}>
                        烟花大小
                      </Label>
                      <Select value={config.size} onValueChange={(v) => handleSelectChange("size", v)}>
                        <SelectTrigger className="w-[180px] bg-black/50 border-white/20 text-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20">
                          {SHELL_SIZE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="form-option form-option--select">
                      <Label className="quality-ui-label cursor-pointer text-white/70" onClick={() => handleHelpClick("quality")}>
                        画质
                      </Label>
                      <Select value={config.quality} onValueChange={(v) => handleSelectChange("quality", v)}>
                        <SelectTrigger className="w-[180px] bg-black/50 border-white/20 text-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20">
                          {QUALITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white/90">显示设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="form-option form-option--select">
                      <Label className="sky-lighting-label cursor-pointer text-white/70" onClick={() => handleHelpClick("skyLighting")}>
                        照亮天空
                      </Label>
                      <Select value={config.skyLighting} onValueChange={(v) => handleSelectChange("skyLighting", v)}>
                        <SelectTrigger className="w-[180px] bg-black/50 border-white/20 text-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20">
                          {SKY_LIGHTING_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="form-option form-option--select">
                      <Label className="scaleFactor-label cursor-pointer text-white/70" onClick={() => handleHelpClick("scaleFactor")}>
                        缩放
                      </Label>
                      <Select value={config.scaleFactor.toFixed(2)} onValueChange={(v) => handleSelectChange("scaleFactor", v)}>
                        <SelectTrigger className="w-[180px] bg-black/50 border-white/20 text-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20">
                          {SCALE_FACTOR_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="form-option form-option--checkbox">
                      <Label htmlFor="long-exposure" className="long-exposure-label cursor-pointer text-white/70" onClick={() => handleHelpClick("longExposure")}>
                        保留烟花的火花
                      </Label>
                      <Switch id="long-exposure" checked={config.longExposure} onCheckedChange={(checked) => handleCheckboxChange("longExposure", checked)} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white/90">特效设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="form-option form-option--checkbox">
                      <Label htmlFor="word-shell" className="word-shell-label cursor-pointer text-white/70" onClick={() => handleHelpClick("wordShell")}>
                        文字烟花
                      </Label>
                      <Switch id="word-shell" checked={config.wordShell} onCheckedChange={(checked) => handleCheckboxChange("wordShell", checked)} />
                    </div>

                    <div className="form-option form-option--checkbox">
                      <Label htmlFor="auto-launch" className="auto-launch-label cursor-pointer text-white/70" onClick={() => handleHelpClick("autoLaunch")}>
                        自动放烟花
                      </Label>
                      <Switch id="auto-launch" checked={config.autoLaunch} onCheckedChange={(checked) => handleCheckboxChange("autoLaunch", checked)} />
                    </div>

                    <div className={`form-option form-option--checkbox ${config.autoLaunch ? "opacity-100" : "opacity-40"}`}>
                      <Label htmlFor="finale-mode" className="finale-mode-label cursor-pointer text-white/70" onClick={() => handleHelpClick("finaleMode")}>
                        同时放更多的烟花
                      </Label>
                      <Switch id="finale-mode" checked={config.finale} onCheckedChange={(checked) => handleCheckboxChange("finale", checked)} />
                    </div>

                    <div className="form-option form-option--checkbox">
                      <Label htmlFor="hide-controls" className="hide-controls-label cursor-pointer text-white/70" onClick={() => handleHelpClick("hideControls")}>
                        隐藏控制按钮
                      </Label>
                      <Switch id="hide-controls" checked={config.hideControls} onCheckedChange={(checked) => handleCheckboxChange("hideControls", checked)} />
                    </div>

                    <div className="form-option form-option--checkbox">
                      <Label htmlFor="fullscreen" className="fullscreen-label cursor-pointer text-white/70" onClick={() => handleHelpClick("fullscreen")}>
                        全屏
                      </Label>
                      <Switch id="fullscreen" checked={fullscreen} onCheckedChange={onToggleFullscreen} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white/90">背景设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {BACKGROUND_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          className="h-12 rounded-md border border-white/20 text-xs text-white/70 hover:border-white/40 hover:text-white transition-colors"
                          style={{ background: preset.value }}
                          onClick={() => handlePresetClick(preset.value)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/70 text-xs">自定义背景</Label>
                      <input
                        className="background-input w-full h-9 px-3 rounded-md bg-black/50 border border-white/20 text-white/70 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                        type="text"
                        placeholder="图片 URL 或 CSS 渐变..."
                        value={backgroundInput}
                        onChange={(e) => setBackgroundInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCustomBackgroundApply();
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                          onClick={handleCustomBackgroundApply}
                        >
                          应用
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
                          onClick={() => {
                            onBackgroundClear();
                            setBackgroundInput("");
                          }}
                        >
                          清除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="menu__footer">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white/80"
                onClick={handleResetDefaults}
              >
                恢复默认设置
              </Button>
              <div className="credits">
                <p className="copyright">
                  Copyright&nbsp;&copy;&nbsp;2021 -{" "}
                  <span className="copyright-year">{new Date().getFullYear()}</span>
                  &nbsp;
                  <a target="_blank" href="https://www.nianbroken.top/" rel="noreferrer">
                    碎念_Nian
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
