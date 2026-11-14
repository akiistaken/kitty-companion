use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorRect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub work_x: i32,
    pub work_y: i32,
    pub work_width: i32,
    pub work_height: i32,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowPlatform {
    pub hwnd: isize,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub title: String,
    pub z_index: usize,
    pub is_foreground: bool,
    pub is_media: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopSnapshot {
    pub virtual_x: i32,
    pub virtual_y: i32,
    pub virtual_width: i32,
    pub virtual_height: i32,
    pub cursor_x: i32,
    pub cursor_y: i32,
    pub idle_ms: u64,
    pub is_audio_playing: bool,
    pub is_fullscreen_foreground: bool,
    pub monitors: Vec<MonitorRect>,
    pub windows: Vec<WindowPlatform>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HitRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CursorHoldRequest {
    pub active: bool,
    /// Target X in overlay-relative physical coordinates
    pub x: f64,
    /// Target Y in overlay-relative physical coordinates
    pub y: f64,
}

#[derive(Default)]
pub struct OverlayInteractionState {
    pub hit_rects: Vec<HitRect>,
    pub pointer_locked: bool,
    pub virtual_x: i32,
    pub virtual_y: i32,
    pub own_hwnd: isize,
    pub cursor_hold: Option<(i32, i32)>,
    pub last_hold_cursor: Option<(i32, i32)>,
    pub hit_gen: u64,
}

pub type SharedOverlayState = Arc<Mutex<OverlayInteractionState>>;

#[cfg(windows)]
mod imp {
    use super::*;
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM, POINT, RECT};
    use windows::Win32::Graphics::Dwm::{
        DwmGetWindowAttribute, DWMWA_CLOAKED, DWMWA_EXTENDED_FRAME_BOUNDS,
    };
    use windows::Win32::Graphics::Gdi::{
        EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFO,
    };
    use windows::Win32::Media::Audio::Endpoints::IAudioMeterInformation;
    use windows::Win32::Media::Audio::{
        eConsole, eRender, IMMDeviceEnumerator, MMDeviceEnumerator,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED,
    };
    use windows::Win32::System::SystemInformation::GetTickCount64;
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        GetAsyncKeyState, GetLastInputInfo, LASTINPUTINFO, VK_ESCAPE, VK_LBUTTON, VK_MBUTTON,
        VK_RBUTTON,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetCursorPos, GetForegroundWindow, GetSystemMetrics, GetWindowLongW,
        GetWindowRect, GetWindowTextLengthW, GetWindowTextW, IsIconic, IsWindowVisible,
        SetCursorPos, GWL_EXSTYLE, MONITORINFOF_PRIMARY, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN,
        SM_XVIRTUALSCREEN, SM_YVIRTUALSCREEN, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
        WS_EX_TRANSPARENT,
    };

    struct MonitorEnumCtx {
        virtual_x: i32,
        virtual_y: i32,
        monitors: Vec<MonitorRect>,
    }

    unsafe extern "system" fn enum_monitor_cb(
        hmon: HMONITOR,
        _hdc: HDC,
        _rect: *mut RECT,
        lparam: LPARAM,
    ) -> BOOL {
        let ctx = &mut *(lparam.0 as *mut MonitorEnumCtx);
        let mut info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            ..Default::default()
        };
        if GetMonitorInfoW(hmon, &mut info).as_bool() {
            let m = info.rcMonitor;
            let w = info.rcWork;
            ctx.monitors.push(MonitorRect {
                x: m.left - ctx.virtual_x,
                y: m.top - ctx.virtual_y,
                width: m.right - m.left,
                height: m.bottom - m.top,
                work_x: w.left - ctx.virtual_x,
                work_y: w.top - ctx.virtual_y,
                work_width: w.right - w.left,
                work_height: w.bottom - w.top,
                is_primary: (info.dwFlags & MONITORINFOF_PRIMARY) != 0,
            });
        }
        BOOL(1)
    }

    struct WindowEnumCtx {
        own_hwnd: isize,
        fg_hwnd: isize,
        virtual_x: i32,
        virtual_y: i32,
        windows: Vec<WindowPlatform>,
        title_buf: Vec<u16>,
    }

    fn is_ignored_title(title: &str) -> bool {
        let trimmed = title.trim();
        if trimmed.is_empty() {
            return true;
        }
        matches!(
            trimmed,
            "Program Manager"
                | "Windows Input Experience"
                | "Microsoft Text Input Application"
                | "Settings"
                | "NVIDIA GeForce Overlay"
                | "Kitten Overlay"
                | "Kitten — Loading"
                | "Kitten — Progress & Config"
        )
    }

    fn is_media_title(title: &str) -> bool {
        let lower = title.to_ascii_lowercase();
        const KEYWORDS: &[&str] = &[
            "spotify",
            "youtube",
            "soundcloud",
            "apple music",
            "vlc",
            "foobar2000",
            "tidal",
            "deezer",
            "twitch",
            "netflix",
            "music",
            "lo-fi",
            "lofi",
        ];
        KEYWORDS.iter().any(|k| lower.contains(k))
    }

    unsafe extern "system" fn enum_window_cb(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam.0 as *mut WindowEnumCtx);
        if hwnd.0 as isize == ctx.own_hwnd {
            return BOOL(1);
        }
        if !IsWindowVisible(hwnd).as_bool() || IsIconic(hwnd).as_bool() {
            return BOOL(1);
        }

        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE) as u32;
        if (ex_style & WS_EX_TOOLWINDOW.0) != 0 {
            return BOOL(1);
        }
        if (ex_style & WS_EX_TRANSPARENT.0) != 0 && (ex_style & WS_EX_NOACTIVATE.0) != 0 {
            return BOOL(1);
        }

        let mut cloaked: u32 = 0;
        let _ = DwmGetWindowAttribute(
            hwnd,
            DWMWA_CLOAKED,
            &mut cloaked as *mut u32 as *mut _,
            std::mem::size_of::<u32>() as u32,
        );
        if cloaked != 0 {
            return BOOL(1);
        }

        let title_len = GetWindowTextLengthW(hwnd);
        if title_len <= 0 {
            return BOOL(1);
        }
        let needed = (title_len as usize) + 1;
        if ctx.title_buf.len() < needed {
            ctx.title_buf.resize(needed, 0);
        }
        let copied = GetWindowTextW(hwnd, &mut ctx.title_buf[..needed]);
        if copied <= 0 {
            return BOOL(1);
        }
        let title = String::from_utf16_lossy(&ctx.title_buf[..copied as usize]);
        if is_ignored_title(&title) {
            return BOOL(1);
        }

        let mut rect = RECT::default();
        let dwm_res = DwmGetWindowAttribute(
            hwnd,
            DWMWA_EXTENDED_FRAME_BOUNDS,
            &mut rect as *mut RECT as *mut _,
            std::mem::size_of::<RECT>() as u32,
        );
        if dwm_res.is_err() && GetWindowRect(hwnd, &mut rect).is_err() {
            return BOOL(1);
        }

        let w = rect.right - rect.left;
        let h = rect.bottom - rect.top;
        if w < 120 || h < 60 {
            return BOOL(1);
        }

        let z_index = ctx.windows.len();
        let is_media = is_media_title(&title);
        ctx.windows.push(WindowPlatform {
            hwnd: hwnd.0 as isize,
            x: rect.left - ctx.virtual_x,
            y: rect.top - ctx.virtual_y,
            width: w,
            height: h,
            title,
            z_index,
            is_foreground: hwnd.0 as isize == ctx.fg_hwnd,
            is_media,
        });

        BOOL(1)
    }

    pub fn get_virtual_bounds() -> (i32, i32, i32, i32) {
        unsafe {
            let vx = GetSystemMetrics(SM_XVIRTUALSCREEN);
            let vy = GetSystemMetrics(SM_YVIRTUALSCREEN);
            let vw = GetSystemMetrics(SM_CXVIRTUALSCREEN).max(800);
            let vh = GetSystemMetrics(SM_CYVIRTUALSCREEN).max(600);
            (vx, vy, vw, vh)
        }
    }

    pub fn get_cursor_pos() -> (i32, i32) {
        unsafe {
            let mut pt = POINT::default();
            if GetCursorPos(&mut pt).is_ok() {
                (pt.x, pt.y)
            } else {
                (0, 0)
            }
        }
    }

    pub fn set_cursor_pos(x: i32, y: i32) {
        unsafe {
            let _ = SetCursorPos(x, y);
        }
    }

    pub fn user_wants_cursor_release() -> bool {
        unsafe {
            let esc = GetAsyncKeyState(VK_ESCAPE.0 as i32) < 0;
            let lbtn = GetAsyncKeyState(VK_LBUTTON.0 as i32) < 0;
            let mbtn = GetAsyncKeyState(VK_MBUTTON.0 as i32) < 0;
            let rbtn = GetAsyncKeyState(VK_RBUTTON.0 as i32) < 0;
            esc || lbtn || mbtn || rbtn
        }
    }

    use std::cell::RefCell;
    use std::sync::OnceLock;
    use std::time::{Duration, Instant};

    struct AudioMeterCache {
        com_initialized: bool,
        meter: Option<IAudioMeterInformation>,
        last_probe: Option<Instant>,
        last_init_attempt: Option<Instant>,
        last_playing: bool,
    }

    thread_local! {
        static AUDIO_CACHE: RefCell<AudioMeterCache> = const {
            RefCell::new(AudioMeterCache {
                com_initialized: false,
                meter: None,
                last_probe: None,
                last_init_attempt: None,
                last_playing: false,
            })
        };
    }

    struct SnapshotCache {
        virtual_bounds: (i32, i32, i32, i32),
        monitors: Vec<MonitorRect>,
        monitors_at: Option<Instant>,
        windows: Vec<WindowPlatform>,
        windows_at: Option<Instant>,
    }

    static SNAPSHOT_CACHE: OnceLock<Mutex<SnapshotCache>> = OnceLock::new();

    pub fn is_system_audio_playing() -> bool {
        AUDIO_CACHE.with(|cell| {
            let mut cache = cell.borrow_mut();
            let now = Instant::now();
            if let Some(last) = cache.last_probe {
                if now.duration_since(last) < Duration::from_millis(600) {
                    return cache.last_playing;
                }
            }
            cache.last_probe = Some(now);

            unsafe {
                if !cache.com_initialized {
                    let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
                    cache.com_initialized = true;
                }

                if cache.meter.is_none() {
                    if let Some(last_init) = cache.last_init_attempt {
                        if now.duration_since(last_init) < Duration::from_secs(5) {
                            return false;
                        }
                    }
                    cache.last_init_attempt = Some(now);
                    let created = CoCreateInstance::<_, IMMDeviceEnumerator>(
                        &MMDeviceEnumerator,
                        None,
                        CLSCTX_ALL,
                    )
                    .and_then(|enumerator| enumerator.GetDefaultAudioEndpoint(eRender, eConsole))
                    .and_then(|device| device.Activate::<IAudioMeterInformation>(CLSCTX_ALL, None));

                    if let Ok(meter) = created {
                        cache.meter = Some(meter);
                    } else {
                        cache.last_playing = false;
                        return false;
                    }
                }

                if let Some(meter) = &cache.meter {
                    match meter.GetPeakValue() {
                        Ok(peak) => {
                            cache.last_playing = peak > 0.0015;
                            return cache.last_playing;
                        }
                        Err(_) => {
                            cache.meter = None;
                            cache.last_playing = false;
                        }
                    }
                }
                false
            }
        })
    }

    pub fn snapshot(own_hwnd: isize) -> DesktopSnapshot {
        unsafe {
            let now = Instant::now();
            let cache_lock = SNAPSHOT_CACHE.get_or_init(|| {
                Mutex::new(SnapshotCache {
                    virtual_bounds: (0, 0, 1920, 1080),
                    monitors: Vec::new(),
                    monitors_at: None,
                    windows: Vec::new(),
                    windows_at: None,
                })
            });

            let (vx, vy, vw, vh, monitors, windows) = {
                let mut cache = cache_lock.lock().unwrap_or_else(|e| e.into_inner());
                let refresh_monitors = cache
                    .monitors_at
                    .map(|t| now.duration_since(t) >= Duration::from_millis(2500))
                    .unwrap_or(true);

                if refresh_monitors {
                    let bounds = get_virtual_bounds();
                    let mut mon_ctx = MonitorEnumCtx {
                        virtual_x: bounds.0,
                        virtual_y: bounds.1,
                        monitors: Vec::with_capacity(cache.monitors.len().max(2)),
                    };
                    let _ = EnumDisplayMonitors(
                        HDC::default(),
                        None,
                        Some(enum_monitor_cb),
                        LPARAM(&mut mon_ctx as *mut MonitorEnumCtx as isize),
                    );
                    cache.virtual_bounds = bounds;
                    cache.monitors = mon_ctx.monitors;
                    cache.monitors_at = Some(now);
                }

                let refresh_windows = cache
                    .windows_at
                    .map(|t| now.duration_since(t) >= Duration::from_millis(300))
                    .unwrap_or(true);

                if refresh_windows {
                    let fg = GetForegroundWindow().0 as isize;
                    let mut win_ctx = WindowEnumCtx {
                        own_hwnd,
                        fg_hwnd: fg,
                        virtual_x: cache.virtual_bounds.0,
                        virtual_y: cache.virtual_bounds.1,
                        windows: Vec::with_capacity(cache.windows.len().max(16)),
                        title_buf: Vec::with_capacity(128),
                    };
                    let _ = EnumWindows(
                        Some(enum_window_cb),
                        LPARAM(&mut win_ctx as *mut WindowEnumCtx as isize),
                    );
                    cache.windows = win_ctx.windows;
                    cache.windows_at = Some(now);
                }

                (
                    cache.virtual_bounds.0,
                    cache.virtual_bounds.1,
                    cache.virtual_bounds.2,
                    cache.virtual_bounds.3,
                    cache.monitors.clone(),
                    cache.windows.clone(),
                )
            };

            let (cx, cy) = get_cursor_pos();

            let mut lii = LASTINPUTINFO {
                cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };
            let idle_ms = if GetLastInputInfo(&mut lii).as_bool() {
                let tick = GetTickCount64();
                let last = lii.dwTime as u64;
                // Handle 32-bit GetTickCount wrap gracefully
                tick.wrapping_sub(last) & 0xFFFF_FFFF
            } else {
                0
            };

            let is_audio_playing = is_system_audio_playing();
            let is_fullscreen_foreground = windows.iter().any(|w| {
                w.is_foreground
                    && monitors.iter().any(|m| {
                        w.x <= m.x + 2
                            && w.y <= m.y + 2
                            && w.x + w.width >= m.x + m.width - 2
                            && w.y + w.height >= m.y + m.height - 2
                    })
            });

            DesktopSnapshot {
                virtual_x: vx,
                virtual_y: vy,
                virtual_width: vw,
                virtual_height: vh,
                cursor_x: cx - vx,
                cursor_y: cy - vy,
                idle_ms,
                is_audio_playing,
                is_fullscreen_foreground,
                monitors,
                windows,
            }
        }
    }
}

#[cfg(not(windows))]
mod imp {
    use super::*;

    pub fn get_virtual_bounds() -> (i32, i32, i32, i32) {
        (0, 0, 1920, 1080)
    }

    pub fn get_cursor_pos() -> (i32, i32) {
        (0, 0)
    }

    pub fn set_cursor_pos(_x: i32, _y: i32) {}

    pub fn user_wants_cursor_release() -> bool {
        false
    }

    pub fn snapshot(_own_hwnd: isize) -> DesktopSnapshot {
        DesktopSnapshot {
            virtual_x: 0,
            virtual_y: 0,
            virtual_width: 1920,
            virtual_height: 1080,
            cursor_x: 0,
            cursor_y: 0,
            idle_ms: 0,
            is_audio_playing: false,
            is_fullscreen_foreground: false,
            monitors: vec![MonitorRect {
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                work_x: 0,
                work_y: 0,
                work_width: 1920,
                work_height: 1040,
                is_primary: true,
            }],
            windows: vec![],
        }
    }
}

pub use imp::{
    get_cursor_pos, get_virtual_bounds, set_cursor_pos, snapshot, user_wants_cursor_release,
};
