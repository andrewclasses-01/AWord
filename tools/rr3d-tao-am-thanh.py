# Đợt 393 — bộ tiếng "điện ảnh" tổng hợp cho Rocket race Fight 3D (thay tiếng Kenney kiểu arcade).
# Chạy: python synth393.py <thư mục ra>  → *.wav (44.1 kHz stereo) rồi ffmpeg đổi sang mp3.
import sys, os
import numpy as np
import scipy.signal as ss
from scipy.io import wavfile

SR = 44100
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(393)


def T(d): return np.arange(int(d * SR)) / SR
def white(n): return rng.standard_normal(n)
def brown(n):
    b = ss.lfilter([1], [1, -0.997], white(n))
    b -= ss.lfilter([1], [1, -0.9995], b) * 0.0005   # bớt trôi DC
    b = hp(b, 25)
    return b / (np.max(np.abs(b)) + 1e-9)
def sos(kind, f, order=2): return ss.butter(order, f, kind, fs=SR, output="sos")
def lp(x, f, o=2): return ss.sosfilt(sos("low", f, o), x)
def hp(x, f, o=2): return ss.sosfilt(sos("high", f, o), x)
def bp(x, lo, hi, o=2): return ss.sosfilt(sos("band", [lo, hi], o), x)
def norm(x, peak=1.0): return x / (np.max(np.abs(x)) + 1e-9) * peak


def svf(x, fc, q=0.7, mode="lp"):
    """Bộ lọc SVF (TPT) cắt tần THAY ĐỔI theo thời gian: fc là mảng cùng độ dài x."""
    fc = np.broadcast_to(np.clip(fc, 10, SR * 0.45), x.shape)
    g = np.tan(np.pi * fc / SR); k = 1.0 / q
    a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2
    y = np.empty_like(x); ic1 = ic2 = 0.0
    for i in range(len(x)):
        v3 = x[i] - ic2
        v1 = a1[i] * ic1 + a2[i] * v3
        v2 = ic2 + a2[i] * ic1 + a3[i] * v3
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2
        y[i] = v2 if mode == "lp" else v1 if mode == "bp" else x[i] - k * v1 - v2
    return y


def sweep_sine(f0, f1, d, curve=3.0):
    t = T(d); k = (t / d) ** (1 / curve) if curve != 1 else t / d
    f = f0 * (f1 / f0) ** k
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    m = max(1, int(len(y) * 0.35))                 # đuôi tắt êm — không cụt ngang
    y[-m:] *= np.cos(np.linspace(0, np.pi / 2, m)) ** 2
    return y


def env_ad(n, att, tau, hold=0.0):
    t = np.arange(n) / SR
    a = np.clip(t / max(att, 1e-4), 0, 1); a = a * a * (3 - 2 * a)
    d = np.where(t < att + hold, 1.0, np.exp(-(t - att - hold) / tau))
    return a * d


def modal(freqs, taus, amps, d, strike=0.004):
    t = T(d); y = np.zeros_like(t)
    for f, tau, a in zip(freqs, taus, amps):
        y += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / tau)
    ex = white(int(strike * SR)) * np.linspace(1, 0, int(strike * SR))
    y[:len(ex)] += hp(ex, 1500) * 0.6
    return y


def crackles(d, rate, fade_tau, lo=1500, hi=7000, amp=1.0):
    n = int(d * SR); y = np.zeros(n); t = 0.0
    while True:
        t += rng.exponential(1 / rate)
        if t >= d: break
        i = int(t * SR); m = int(rng.uniform(0.001, 0.006) * SR)
        if i + m >= n: break
        y[i:i + m] += white(m) * np.exp(-np.linspace(0, 6, m)) * rng.uniform(0.2, 1) * np.exp(-t / fade_tau)
    return bp(y, lo, hi) * amp


def reverb(x, secs=2.0, mix=0.3, damp=4000, pre=0.012):
    """Hồi âm tổng hợp stereo (đuôi nhiễu tắt dần, càng về sau càng tối)."""
    n = int(secs * SR); t = np.arange(n) / SR
    outs = []
    for ch in range(2):
        ir = white(n) * np.exp(-t * 6.9 / secs)
        dark = lp(ir, damp); darker = lp(ir, damp / 5)
        w = np.clip(t / secs * 1.6, 0, 1)
        ir = dark * (1 - w) + darker * w
        ir = np.concatenate([np.zeros(int(pre * SR)), ir]); ir /= np.sqrt(np.sum(ir ** 2))
        src = x[:, ch] if x.ndim == 2 else x
        outs.append(ss.fftconvolve(src, ir)[:len(src) + len(ir) - 1])
    wet = np.stack(outs, 1)
    dry = x if x.ndim == 2 else np.stack([x, x], 1)
    L = max(len(wet), len(dry))
    out = np.zeros((L, 2)); out[:len(dry)] += dry * (1 - mix * 0.5); out[:len(wet)] += wet * mix
    return out


def st(l, r=None): return np.stack([l, l if r is None else r], 1)
def pad(x, n):
    if len(x) >= n: return x[:n]
    z = np.zeros((n,) + x.shape[1:]); z[:len(x)] = x; return z
def mix(n, *layers):
    out = np.zeros((n, 2))
    for off, x in layers:
        x = x if x.ndim == 2 else st(x)
        i = int(off * SR); m = min(len(x), n - i)
        if m > 0: out[i:i + m] += x[:m]
    return out
def fade_tail(x, secs):
    m = int(secs * SR); x = x.copy(); x[-m:] *= np.linspace(1, 0, m)[:, None] ** 2; return x
def soft(x, drive=1.5): return np.tanh(x * drive) / np.tanh(drive)


def save(name, x, peak=0.89, tail=0.05):
    x = fade_tail(x, tail)
    x = x - np.mean(x, 0)
    x = norm(x, peak)
    wavfile.write(os.path.join(OUT, name + ".wav"), SR, (x * 32767).astype(np.int16))
    rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    print(f"{name:10s} {len(x)/SR:5.2f}s  rms {rms:6.1f} dBFS")


def roar(d, fc, seed_mix=True):
    """Tiếng gầm động cơ tên lửa: nhiễu nâu stereo + lọc thấp theo thời gian + rối khí."""
    n = int(d * SR); ch = []
    for c in range(2):
        b = brown(n) * 0.8 + lp(white(n), 900) * 0.25
        turb = 1 + 0.22 * norm(lp(white(n), 7))
        ch.append(svf(b * turb, fc, 0.6))
    return np.stack(ch, 1)


# ---------------------------------------------------------------- engine (lặp liền mạch)
def engine():
    D, F = 6.0, 1.2
    n = int((D + F) * SR)
    body = roar(D + F, np.full(n, 620.0))
    rumble = st(lp(brown(n), 110, 4) * 0.9, lp(brown(n), 110, 4) * 0.9)
    hiss = st(bp(white(n), 2200, 7000) * 0.05 * (1 + 0.3 * norm(lp(white(n), 5))), bp(white(n), 2200, 7000) * 0.05)
    crk = st(crackles(D + F, 26, 1e9, 1200, 5000, 0.22), crackles(D + F, 26, 1e9, 1200, 5000, 0.22))
    x = soft(body + rumble + hiss + crk, 1.2)
    N = int(D * SR); m = int(F * SR)
    out = x[:N].copy()
    k = np.linspace(0, np.pi / 2, m)[:, None]
    out[:m] = x[:m] * np.sin(k) + x[N:N + m] * np.cos(k)     # nối đuôi vào đầu ⇒ lặp không có vết
    x = out - np.mean(out, 0)
    x = norm(x, 0.8)
    wavfile.write(os.path.join(OUT, "engine.wav"), SR, (x * 32767).astype(np.int16))
    print("engine     loop", D)


# ---------------------------------------------------------------- boost: bùng lửa rồi TẮT DẦN THẬT CHẬM
def boost():
    d = 7.0; n = int(d * SR); t = T(d)
    bright = np.clip(t / 0.18, 0, 1) * np.exp(-np.maximum(0, t - 0.25) / 1.3)
    fc = 480 + 3400 * bright
    body = roar(d, fc)
    amp = env_ad(n, 0.22, 2.1, hold=0.35)
    amp *= np.clip((d - t) / 1.2, 0, 1) ** 1.5                  # chạm 0 êm ở cuối file
    whoomp = sweep_sine(62, 34, 0.9) * env_ad(int(0.9 * SR), 0.01, 0.28) * 0.55
    crk = crackles(2.5, 60, 0.6, 1500, 6000, 0.35)
    x = mix(n, (0, body * amp[:, None]), (0, soft(whoomp, 2)), (0.02, crk))
    save("boost", reverb(x, 1.6, 0.18)[:n], 0.85, 0.3)


# ---------------------------------------------------------------- stall: động cơ hụt hơi + xì khói + tiếng kim loại
def stall():
    d = 2.8; n = int(d * SR); t = T(d)
    gate = np.zeros(n); pos = 0.04
    while pos < 1.5:
        on = rng.uniform(0.05, 0.14) * (1 + pos); off = rng.uniform(0.03, 0.12) * (1 + pos * 0.8)
        i, j = int(pos * SR), int(min(pos + on, d) * SR)
        g = np.ones(j - i); a = min(len(g), int(0.006 * SR)); r = min(len(g), int(0.035 * SR))
        g[:a] = np.linspace(0, 1, a); g[-r:] *= np.linspace(1, 0, r)
        gate[i:j] = g * rng.uniform(0.55, 1.0) * max(0.25, 1 - pos / 1.7)
        pos += on + off
    fc = 1300 * np.exp(-t / 0.9) + 280
    sput = roar(d, fc) * gate[:, None] * 1.1
    clank = modal([233, 587, 1033, 1789, 2677], [0.9, 0.6, 0.42, 0.3, 0.2], [0.5, 0.45, 0.35, 0.25, 0.15], 1.6) * 0.55
    hiss_env = env_ad(int(1.9 * SR), 0.03, 0.55, hold=0.25)
    flutter = 1 + 0.35 * norm(lp(white(len(hiss_env)), 28))
    hissL = bp(white(len(hiss_env)), 1400, 9000) * hiss_env * flutter
    hissR = bp(white(len(hiss_env)), 1400, 9000) * hiss_env * flutter
    thud = sweep_sine(78, 38, 0.35) * env_ad(int(0.35 * SR), 0.004, 0.11) * 0.8
    x = mix(n, (0, sput), (0.0, clank), (0.0, soft(thud, 2)), (0.12, st(hissL, hissR) * 0.42))
    save("stall", reverb(x, 1.3, 0.22)[:n], 0.86, 0.2)


# ---------------------------------------------------------------- turbo: đốt sau BÙNG NỔ dữ dội
def turbo():
    d = 5.8; n = int(d * SR); t = T(d)
    crack = hp(white(int(0.014 * SR)), 900) * np.linspace(1, 0, int(0.014 * SR)) ** 2 * 1.3
    boom = soft(sweep_sine(96, 26, 1.4) * env_ad(int(1.4 * SR), 0.004, 0.55), 2.6) * 1.0
    fc = np.where(t < 0.08, 300 + 7000 * t / 0.08, 1100 + 6200 * np.exp(-(t - 0.08) / 0.5))
    fc = np.maximum(420, fc * np.exp(-np.maximum(0, t - 1.5) / 2.5))
    body = roar(d, fc) * env_ad(n, 0.05, 1.5, hold=0.9)[:, None] * 1.25
    rumble = lp(brown(n), 140, 4) * env_ad(n, 0.02, 1.8, hold=0.3) * 0.9
    crk = st(crackles(3, 90, 0.8, 1500, 8000, 0.5), crackles(3, 90, 0.8, 1500, 8000, 0.5))
    x = mix(n, (0, crack), (0, boom), (0.01, soft(body, 1.6)), (0, rumble), (0.03, crk))
    save("turbo", reverb(x, 2.6, 0.32)[:n], 0.95, 0.4)


# ---------------------------------------------------------------- hit1–3: va chạm điện ảnh
def hit(k):
    d = 3.2; n = int(d * SR)
    base = [150, 190, 125][k]
    freqs = [base * r for r in (1, 2.31, 3.87, 5.43, 7.9, 11.2)]
    ring = modal(freqs, [1.1, 0.8, 0.6, 0.45, 0.3, 0.2], [0.45, 0.4, 0.3, 0.22, 0.16, 0.1], 2.4) * 0.5
    crack = hp(white(int(0.008 * SR)), 700) * 1.2
    thump = soft(sweep_sine([82, 74, 90][k], 40, 0.5) * env_ad(int(0.5 * SR), 0.003, 0.16), 2.2) * 0.95
    body = lp(brown(int(1.0 * SR)), 1600) * env_ad(int(1.0 * SR), 0.002, 0.18) * 0.8
    deb = st(crackles(1.8, 40, 0.5, 1800, 7000, 0.55), crackles(1.8, 40, 0.5, 1800, 7000, 0.55))
    x = mix(n, (0, crack), (0, thump), (0, body), (0.002, ring), (0.05, deb))
    save(f"hit{k+1}", reverb(x, 2.2, 0.3)[:n], 0.95, 0.3)


# ---------------------------------------------------------------- boom: nổ lớn
def boom():
    d = 6.5; n = int(d * SR); t = T(d)
    crack = hp(white(int(0.03 * SR)), 500) * np.linspace(1, 0, int(0.03 * SR)) ** 1.5 * 1.2
    fc = 180 + 6200 * np.exp(-t / 0.55)
    ball = roar(d, fc) * (env_ad(n, 0.008, 1.2) * 0.8 + env_ad(n, 0.05, 3.0) * 0.28)[:, None] * 1.3
    sub = soft(sweep_sine(64, 22, 2.0) * env_ad(int(2.0 * SR), 0.005, 0.8), 2.5) * 1.1
    deb = st(crackles(4, 55, 1.1, 1400, 7500, 0.6), crackles(4, 55, 1.1, 1400, 7500, 0.6))
    x = mix(n, (0, crack), (0, soft(ball, 1.8)), (0, sub), (0.08, deb))
    save("boom", reverb(x, 3.2, 0.35, 3000)[:n], 0.97, 0.6)


def boomlow():
    d = 3.8; n = int(d * SR)
    sub = soft(sweep_sine(84, 20, 2.6) * env_ad(int(2.6 * SR), 0.006, 0.9), 3.0)
    rum = lp(brown(n), 160, 4) * env_ad(n, 0.02, 1.2)
    x = mix(n, (0, sub), (0, rum * 0.7))
    save("boomlow", x, 0.95, 0.4)


# ---------------------------------------------------------------- tap: chạm nhẹ, trong
def tap():
    d = 0.35; n = int(d * SR)
    click = bp(white(int(0.004 * SR)), 2000, 7000) * 0.9
    tone = np.sin(2 * np.pi * 1480 * T(0.2)) * np.exp(-T(0.2) / 0.03) * 0.35
    low = np.sin(2 * np.pi * 190 * T(0.12)) * np.exp(-T(0.12) / 0.035) * 0.5
    x = mix(n, (0, click), (0, tone), (0, low))
    save("tap", reverb(x, 0.5, 0.15)[:n], 0.7, 0.08)


# ---------------------------------------------------------------- gate: cổng CO LẠI — hút ngược rồi sập
def gate():
    d = 2.4; n = int(d * SR); cut = 1.05
    m = int(cut * SR); t = np.arange(m) / SR
    fc = 160 * (2600 / 160) ** (t / cut)
    suckL = svf(white(m), fc, 2.5, "bp"); suckR = svf(white(m), fc * 1.03, 2.5, "bp")
    amp = (t / cut) ** 2.6
    suck = st(suckL * amp, suckR * amp) * 0.9
    suck[-int(0.012 * SR):] *= np.linspace(1, 0, int(0.012 * SR))[:, None]
    thump = soft(sweep_sine(96, 34, 0.6) * env_ad(int(0.6 * SR), 0.003, 0.2), 2.4)
    crack = hp(white(int(0.01 * SR)), 1200) * 0.7
    x = mix(n, (0, suck), (cut, thump), (cut, crack))
    save("gate", reverb(x, 1.8, 0.3)[:n], 0.9, 0.3)


# ---------------------------------------------------------------- portal: xuyên cổng (warp)
def portal():
    d = 3.4; n = int(d * SR); t = T(d)
    pk = 1.0
    fc = np.where(t < pk, 300 * (3000 / 300) ** (t / pk), 3000 * (450 / 3000) ** np.minimum(1, (t - pk) / 1.6))
    amp = np.exp(-((t - pk) / 0.45) ** 2) * (t < pk) + np.exp(-(t - pk) / 0.7) * (t >= pk)
    wL = svf(white(n), fc, 1.8, "bp"); wR = svf(white(n), fc * 1.04, 1.8, "bp")
    pan = np.clip(t / (2 * pk), 0, 1)
    whoosh = np.stack([wL * amp * (1 - pan * 0.6), wR * amp * (0.4 + pan * 0.6)], 1) * 1.1
    glide = 1 + 0.5 * np.clip(t / 1.8, 0, 1)
    dr = sum(np.sin(2 * np.pi * np.cumsum(f * glide * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t + i))) / SR) for i, f in enumerate((110, 164.8, 220)))
    drone = dr * env_ad(n, 0.6, 0.9, hold=0.8) * 0.22
    whoomp = soft(sweep_sine(70, 36, 0.8) * env_ad(int(0.8 * SR), 0.01, 0.3), 2) * 0.6
    x = mix(n, (0, whoosh), (0, drone), (pk - 0.05, whoomp))
    save("portal", reverb(x, 2.4, 0.35)[:n], 0.9, 0.4)


# ---------------------------------------------------------------- win: hợp âm "braam" chiến thắng
def win():
    d = 6.5; n = int(d * SR); t = T(d)
    notes = [55.0, 82.41, 110.0, 138.59, 164.81, 220.0]
    chord = np.zeros(n)
    for i, f in enumerate(notes):
        for cents in (-8, 0, 7):
            ff = f * 2 ** (cents / 1200)
            chord += ss.sawtooth(2 * np.pi * ff * t + rng.uniform(0, 6.28)) * (1.0 if i < 3 else 0.7)
    fc = 160 + 2100 * np.clip(t / 0.55, 0, 1) ** 1.5
    fc = np.where(t > 3.0, fc * np.exp(-(t - 3.0) / 1.4) + 160, fc)
    chordL = svf(chord, fc, 0.9); chordR = svf(np.roll(chord, 37), fc * 1.02, 0.9)
    amp = env_ad(n, 0.14, 1.2, hold=2.5)
    br = soft(np.stack([chordL, chordR], 1) * amp[:, None] * 0.25, 1.8)
    shimmer = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((880, 1), (1318.5, 0.7), (1760, 0.5), (2637, 0.3)))
    shimmer = shimmer * env_ad(n, 0.9, 1.6, hold=1.6) * 0.07 * (1 + 0.2 * np.sin(2 * np.pi * 4.5 * t))
    hitsub = soft(sweep_sine(70, 30, 1.2) * env_ad(int(1.2 * SR), 0.004, 0.45), 2.4) * 0.9
    crack = hp(white(int(0.012 * SR)), 900) * 0.6
    x = mix(n, (0, br), (0.1, shimmer), (0, hitsub), (0, crack))
    save("win", reverb(x, 3.4, 0.38, 3500)[:n], 0.92, 0.8)


# ---------------------------------------------------------------- whoosh (chữ mở màn): hút ngắn + cú đánh trailer
def whoosh():
    d = 3.0; n = int(d * SR); pre = 0.16
    m = int(pre * SR); tt = np.arange(m) / SR
    rise = svf(white(m), 400 * (3500 / 400) ** (tt / pre), 1.5, "bp") * (tt / pre) ** 2 * 0.8
    sub = soft(sweep_sine(66, 30, 1.1) * env_ad(int(1.1 * SR), 0.004, 0.4), 2.2)
    crack = hp(white(int(0.01 * SR)), 1000) * 0.8
    bell = modal([392, 587.3, 784, 1174.7, 1568], [1.6, 1.2, 1.0, 0.7, 0.5], [0.3, 0.25, 0.2, 0.12, 0.08], 2.6) * 0.45
    tl = int(1.2 * SR); tt2 = np.arange(tl) / SR
    tail = svf(white(tl), 2200 * (350 / 2200) ** (tt2 / 1.2), 1.2, "bp") * np.exp(-tt2 / 0.35) * 0.5
    x = mix(n, (0, rise), (pre, sub), (pre, crack), (pre, bell), (pre, tail))
    save("whoosh", reverb(x, 2.8, 0.4)[:n], 0.88, 0.5)


# ---------------------------------------------------------------- ting 3-2-1 và GO
def ting(name, f0, tau, extra=None):
    d = 2.0; n = int(d * SR)
    y = modal([f0, f0 * 2.76, f0 * 5.4, f0 * 8.93], [tau, tau * 0.45, tau * 0.22, tau * 0.12], [1, 0.32, 0.14, 0.06], d, 0.0015)
    layers = [(0, y * 0.6)]
    if extra: layers += extra
    x = mix(n, *layers)
    save(name, reverb(x, 1.8, 0.28, 6000)[:n], 0.75, 0.3)


if __name__ == "__main__":
    engine(); boost(); stall(); turbo()
    for k in range(3): hit(k)
    boom(); boomlow(); tap(); gate(); portal(); win(); whoosh()
    ting("ting", 1760, 0.45)
    go_low = soft(sweep_sine(70, 38, 0.8) * env_ad(int(0.8 * SR), 0.005, 0.25), 2) * 0.5
    g2 = modal([2637, 2637 * 2.76, 2637 * 5.4], [0.8, 0.35, 0.16], [1, 0.3, 0.12], 2.0, 0.0015) * 0.45
    ting("tinggo", 1760, 0.9, [(0, g2), (0, go_low)])
