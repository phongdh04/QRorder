'use client';

class SoundEffectsManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private alarmInterval: NodeJS.Timeout | null = null;
  private isAlarmPlaying: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Mở khóa AudioContext khi người dùng nhấn nút (ví dụ: "Bắt đầu ca")
   */
  public unlockAudio(): boolean {
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // Gần như im lặng
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(ctx.currentTime + 0.05);
      return true;
    } catch {
      return false;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Phát âm báo đơn lần (chuông ly hoặc chuông báo khẩn)
   */
  public playTone(type: 'normal' | 'urgent' = 'normal') {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'normal') {
      // Âm chuông 2 nốt trong trẻo (C5 523Hz -> E5 659Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      gain2.gain.setValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } else {
      // Âm báo khẩn cấp (còi gấp đôi nốt cao 880Hz -> 1046Hz)
      for (let i = 0; i < 3; i++) {
        const offset = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1046.5, offset);
        gain.gain.setValueAtTime(0.4, offset);
        gain.gain.exponentialRampToValueAtTime(0.01, offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(offset);
        osc.stop(offset + 0.1);
      }
    }
  }

  /**
   * Bắt đầu chuông lặp lại liên tục cho tới khi nhân viên bấm tắt hoặc có người nhận
   */
  public startAlarm(type: 'normal' | 'urgent' = 'normal') {
    if (this.isMuted || this.isAlarmPlaying) return;

    this.isAlarmPlaying = true;
    this.playTone(type);

    // Lặp lại mỗi 2.5 giây đối với bình thường, 1.5 giây đối với khẩn cấp
    const intervalMs = type === 'urgent' ? 1500 : 2500;
    this.alarmInterval = setInterval(() => {
      this.playTone(type);
    }, intervalMs);
  }

  /**
   * Dừng chuông đang lặp
   */
  public stopAlarm() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.isAlarmPlaying = false;
  }

  public isRinging(): boolean {
    return this.isAlarmPlaying;
  }
}

export const soundManager = new SoundEffectsManager();
export const soundEffects = soundManager;
