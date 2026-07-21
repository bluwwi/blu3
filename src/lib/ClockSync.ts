export class ClockSync {
  private _offset = 0;
  private _rtt = 0;
  private _calibrated = false;
  private _pendingPings = new Map<number, number>();

  get calibrated() { return this._calibrated; }
  get offset() { return this._offset; }
  get rtt() { return this._rtt; }

  serverNow(): number {
    return Date.now() + this._offset;
  }

  private _resolveCalibrate: (() => void) | null = null;
  private _results: Array<{ offset: number; rtt: number }> = [];
  private _targetCount = 0;

  async calibrate(send: (msg: object) => void): Promise<void> {
    const SAMPLES = 6;
    this._results = [];
    this._targetCount = SAMPLES;

    return new Promise<void>((resolve) => {
      this._resolveCalibrate = resolve;

      for (let i = 0; i < SAMPLES; i++) {
        setTimeout(() => {
          const t0 = Date.now();
          this._pendingPings.set(t0, t0);
          send({ type: "clock:ping", t0 });
        }, i * 20);
      }
    });
  }

  async recalibrate(send: (msg: object) => void): Promise<void> {
    const SAMPLES = 3;
    this._results = [];
    this._targetCount = SAMPLES;

    return new Promise<void>((resolve) => {
      this._resolveCalibrate = resolve;

      for (let i = 0; i < SAMPLES; i++) {
        const t0 = Date.now();
        this._pendingPings.set(t0, t0);
        send({ type: "clock:ping", t0 });
      }
    });
  }

  handlePong(t0: number, serverTime: number) {
    const t1 = Date.now();
    const rtt = t1 - t0;
    const offset = serverTime - (t0 + rtt / 2);
    this._results.push({ offset, rtt });
    this._pendingPings.delete(t0);

    if (this._results.length === this._targetCount) {
      const best = this._results.reduce((a, b) => (a.rtt < b.rtt ? a : b));
      if (this._calibrated) {
        this._offset = this._offset * 0.7 + best.offset * 0.3;
      } else {
        this._offset = best.offset;
        this._rtt = best.rtt;
        this._calibrated = true;
      }
      if (this._resolveCalibrate) {
        this._resolveCalibrate();
        this._resolveCalibrate = null;
      }
    }
  }

  handleClockSync(serverTime: number) {
    if (!this._calibrated) {
      this._offset = serverTime - Date.now();
      this._calibrated = true;
    }
  }
}
