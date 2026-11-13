mod win32_desktop;

use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::TrayIconBuilder;
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, State, WebviewUrl,
    WebviewWindowBuilder, WindowEvent,
};
use win32_desktop::{
    get_cursor_pos, get_virtual_bounds, set_cursor_pos, snapshot, user_wants_cursor_release,
    CursorHoldRequest, DesktopSnapshot, HitRect, OverlayInteractionState, SharedOverlayState,
};

struct SharedHudBridge(Mutex<Option<String>>);

struct HudToggleLock(Mutex<()>);

#[derive(Clone, Serialize)]
struct LoadingProgressPayload {
    progress: u8,
    status: String,
}

struct LoadingState {
    progress: u8,
    status: String,
    finished: bool,
    started_at: Instant,
}

struct SharedLoadingState(Mutex<LoadingState>);

fn complete_loading_sequence(app: &AppHandle) {
    let mut wait_before_ready = Duration::ZERO;
    if let Some(state) = app.try_state::<SharedLoadingState>() {
        if let Ok(mut guard) = state.0.lock() {
            if guard.finished {
                return;
            }
            guard.finished = true;
            let min_splash = Duration::from_millis(750);
            let elapsed = guard.started_at.elapsed();
            if elapsed < min_splash {
                wait_before_ready = min_splash - elapsed;
            } else {
                guard.progress = 100;
                guard.status = "Ready!".to_string();
            }
        }
    }

    let handle = app.clone();
    std::thread::spawn(move || {
        if !wait_before_ready.is_zero() {
            std::thread::sleep(wait_before_ready);
        }
        if let Some(state) = handle.try_state::<SharedLoadingState>() {
            if let Ok(mut guard) = state.0.lock() {
                guard.progress = 100;
                guard.status = "Ready!".to_string();
            }
        }
        let _ = handle.emit(
            "kitten://loading-progress",
            LoadingProgressPayload {
                progress: 100,
                status: "Ready!".to_string(),
            },
        );
        std::thread::sleep(Duration::from_millis(260));
        let inner_handle = handle.clone();
        let _ = handle.run_on_main_thread(move || {
            if let Some(overlay) = inner_handle.get_webview_window("overlay") {
                let _ = overlay.set_always_on_top(true);
                let _ = overlay.show();
            }
            if let Some(splash) = inner_handle.get_webview_window("splash") {
                let _ = splash.close();
            }
        });
    });
}

fn toggle_hud_window_inner(app: &AppHandle) {
    let lock = app.try_state::<HudToggleLock>();
    let _guard = lock.as_ref().and_then(|s| s.0.lock().ok());

    if let Some(hud) = app.get_webview_window("hud") {
        let visible = hud.is_visible().unwrap_or(false);
        let minimized = hud.is_minimized().unwrap_or(false);
        if visible && !minimized {
            let _ = hud.close();
        } else {
            let _ = hud.unminimize();
            let _ = hud.set_always_on_top(true);
            let _ = hud.show();
            let _ = hud.set_focus();
            let _ = app.emit("kitten://hud-opened", ());
        }
        return;
    }

    if let Ok(win) = WebviewWindowBuilder::new(
        app,
        "hud",
        WebviewUrl::App("index.html?view=hud".into()),
    )
    .title("Kitty Night — Progress & Config")
    .inner_size(410.0, 580.0)
    .min_inner_size(360.0, 480.0)
    .transparent(false)
    .decorations(true)
    .always_on_top(true)
    .skip_taskbar(false)
    .resizable(true)
    .shadow(true)
    .focused(true)
    .visible(false)
    .build()
    {
        let _ = win.center();
        let _ = win.set_always_on_top(true);
        let _ = win.show();
        let _ = win.set_focus();
        let _ = app.emit("kitten://hud-opened", ());
    }
}

fn state_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("kitten_state.json"))
}

#[tauri::command]
fn get_desktop_snapshot(state: State<'_, SharedOverlayState>) -> DesktopSnapshot {
    let own_hwnd = state.lock().map(|s| s.own_hwnd).unwrap_or(0);
    snapshot(own_hwnd)
}

#[tauri::command]
fn update_hit_rects(
    rects: Vec<HitRect>,
    pointer_locked: bool,
    state: State<'_, SharedOverlayState>,
) {
    if let Ok(mut guard) = state.lock() {
        guard.hit_rects = rects;
        guard.pointer_locked = pointer_locked;
        guard.hit_gen = guard.hit_gen.wrapping_add(1);
    }
}

#[tauri::command]
fn set_cursor_hold(req: CursorHoldRequest, state: State<'_, SharedOverlayState>) {
    if let Ok(mut guard) = state.lock() {
        if req.active {
            let abs_x = guard.virtual_x + req.x.round() as i32;
            let abs_y = guard.virtual_y + req.y.round() as i32;
            guard.cursor_hold = Some((abs_x, abs_y));
        } else {
            guard.cursor_hold = None;
            guard.last_hold_cursor = None;
        }
    }
}

#[tauri::command]
fn load_kitten_state(app: AppHandle) -> Result<Option<String>, String> {
    let path = state_file_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    Ok(Some(content))
}

#[tauri::command]
fn save_kitten_state(app: AppHandle, json: String) -> Result<(), String> {
    let path = state_file_path(&app)?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn sync_overlay_bounds(app: AppHandle, state: State<'_, SharedOverlayState>) -> Result<(), String> {
    let (vx, vy, vw, vh) = get_virtual_bounds();
    if let Ok(mut guard) = state.lock() {
        guard.virtual_x = vx;
        guard.virtual_y = vy;
    }
    if let Some(win) = app.get_webview_window("overlay") {
        let _ = win.set_position(PhysicalPosition::new(vx, vy));
        let _ = win.set_size(PhysicalSize::new(vw as u32, vh as u32));
    }
    Ok(())
}

#[tauri::command]
async fn toggle_hud_window(app: AppHandle) {
    let _ = tauri::async_runtime::spawn_blocking(move || {
        toggle_hud_window_inner(&app);
    })
    .await;
}

#[tauri::command]
async fn hide_hud_window(app: AppHandle) {
    let _ = tauri::async_runtime::spawn_blocking(move || {
        let lock = app.try_state::<HudToggleLock>();
        let _guard = lock.as_ref().and_then(|s| s.0.lock().ok());
        if let Some(hud) = app.get_webview_window("hud") {
            let _ = hud.close();
        }
    })
    .await;
}

#[tauri::command]
fn notify_hud_ready(app: AppHandle) {
    let _ = app.emit("kitten://hud-opened", ());
}

#[tauri::command]
fn is_hud_open(app: AppHandle) -> bool {
    app.get_webview_window("hud")
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

#[tauri::command]
fn publish_hud_state(
    app: AppHandle,
    bridge: State<'_, SharedHudBridge>,
    json: String,
) -> Result<(), String> {
    if let Ok(mut guard) = bridge.0.lock() {
        *guard = Some(json.clone());
    }
    if app.get_webview_window("hud").is_some() {
        let _ = app.emit("kitten://state-sync", json);
    }
    Ok(())
}

#[tauri::command]
fn get_hud_state(bridge: State<'_, SharedHudBridge>) -> Option<String> {
    bridge.0.lock().ok().and_then(|g| g.clone())
}

#[tauri::command]
fn dispatch_hud_action(app: AppHandle, action_json: String) {
    let _ = app.emit("kitten://hud-action", action_json);
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn get_loading_state(loading: State<'_, SharedLoadingState>) -> LoadingProgressPayload {
    if let Ok(guard) = loading.0.lock() {
        LoadingProgressPayload {
            progress: guard.progress,
            status: guard.status.clone(),
        }
    } else {
        LoadingProgressPayload {
            progress: 12,
            status: "Starting Kitty Night...".to_string(),
        }
    }
}

#[tauri::command]
fn report_loading_progress(
    app: AppHandle,
    loading: State<'_, SharedLoadingState>,
    progress: u8,
    status: String,
) {
    if let Ok(mut guard) = loading.0.lock() {
        if guard.finished {
            return;
        }
        guard.progress = guard.progress.max(progress.min(99));
        guard.status = status.clone();
    }
    let _ = app.emit(
        "kitten://loading-progress",
        LoadingProgressPayload {
            progress: progress.min(99),
            status,
        },
    );
}

#[tauri::command]
fn finish_loading(app: AppHandle) {
    complete_loading_sequence(&app);
}

#[tauri::command]
fn set_overlay_focusable(app: AppHandle, focusable: bool) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("overlay") {
        let _ = win.set_focusable(focusable);
        if focusable {
            let _ = win.set_focus();
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let overlay_state: SharedOverlayState = Arc::new(Mutex::new(OverlayInteractionState::default()));

    tauri::Builder::default()
        .manage(overlay_state.clone())
        .manage(SharedHudBridge(Mutex::new(None)))
        .manage(HudToggleLock(Mutex::new(())))
        .manage(SharedLoadingState(Mutex::new(LoadingState {
            progress: 12,
            status: "Starting Kitty Night...".to_string(),
            finished: false,
            started_at: Instant::now(),
        })))
        .invoke_handler(tauri::generate_handler![
            get_desktop_snapshot,
            update_hit_rects,
            set_cursor_hold,
            load_kitten_state,
            save_kitten_state,
            sync_overlay_bounds,
            toggle_hud_window,
            hide_hud_window,
            is_hud_open,
            publish_hud_state,
            get_hud_state,
            dispatch_hud_action,
            quit_app,
            get_loading_state,
            report_loading_progress,
            finish_loading,
            set_overlay_focusable,
            notify_hud_ready
        ])
        .on_window_event(|window, event| {
            if window.label() == "hud" {
                if let WindowEvent::Destroyed = event {
                    let _ = window.app_handle().emit("kitten://hud-closed", ());
                }
            }
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            if let Some(splash) = app.get_webview_window("splash") {
                let _ = splash.center();
            }

            if let Some(win) = app.get_webview_window("overlay") {
                let (vx, vy, vw, vh) = get_virtual_bounds();
                let _ = win.set_position(PhysicalPosition::new(vx, vy));
                let _ = win.set_size(PhysicalSize::new(vw as u32, vh as u32));
                let _ = win.set_always_on_top(true);
                let _ = win.set_ignore_cursor_events(true);

                #[cfg(windows)]
                let own_hwnd = win.hwnd().map(|h| h.0 as isize).unwrap_or(0);
                #[cfg(not(windows))]
                let own_hwnd = 0isize;

                if let Ok(mut guard) = overlay_state.lock() {
                    guard.virtual_x = vx;
                    guard.virtual_y = vy;
                    guard.own_hwnd = own_hwnd;
                }
            }

            if let Some(hud) = app.get_webview_window("hud") {
                let _ = hud.center();
            }

            // Safety fallback so the overlay is always shown even if startup takes longer than expected
            let fallback_handle = handle.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_secs(8));
                complete_loading_sequence(&fallback_handle);
            });

            // System tray menu with Menu & Exit options (plus Quick Actions submenu)
            let open_menu = MenuItem::with_id(app, "menu", "Menu", true, None::<&str>)?;
            let poke_kitten = MenuItem::with_id(app, "poke_kitten", "Poke Kitten", true, None::<&str>)?;
            let toss_yarn = MenuItem::with_id(app, "toss_yarn", "Toss Yarn Ball", true, None::<&str>)?;
            let toggle_tease_yarn = MenuItem::with_id(app, "toggle_tease_yarn", "Hold / Drop Yarn (Tease)", true, None::<&str>)?;
            let clear_yarn = MenuItem::with_id(app, "clear_yarn", "Clear / Hide Yarn", true, None::<&str>)?;
            let toggle_feather_wand = MenuItem::with_id(app, "toggle_feather_wand", "Spawn Feather Wand", true, None::<&str>)?;
            let toggle_cushion = MenuItem::with_id(app, "toggle_cushion", "Place / Remove Cushion", true, None::<&str>)?;
            let toss_fish = MenuItem::with_id(app, "toss_fish", "Toss Fish Treat", true, None::<&str>)?;
            let toss_macaron = MenuItem::with_id(app, "toss_macaron", "Toss Macaron Treat", true, None::<&str>)?;
            let toss_boba = MenuItem::with_id(app, "toss_boba", "Toss Taro Boba", true, None::<&str>)?;
            let toss_cake = MenuItem::with_id(app, "toss_cake", "Toss Cream Cake", true, None::<&str>)?;
            let toggle_focus = MenuItem::with_id(app, "toggle_focus", "Toggle Focus / Nap Mode", true, None::<&str>)?;
            let quick_actions = Submenu::with_items(
                app,
                "Quick Actions",
                true,
                &[
                    &poke_kitten,
                    &toss_yarn,
                    &toggle_tease_yarn,
                    &clear_yarn,
                    &toggle_feather_wand,
                    &toggle_cushion,
                    &toss_fish,
                    &toss_macaron,
                    &toss_boba,
                    &toss_cake,
                    &toggle_focus,
                ],
            )?;
            let sep_top = PredefinedMenuItem::separator(app)?;
            let sep_bottom = PredefinedMenuItem::separator(app)?;
            let exit_item = MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&open_menu, &sep_top, &quick_actions, &sep_bottom, &exit_item],
            )?;

            let mut tray_builder = TrayIconBuilder::with_id("kitten-tray")
                .menu(&menu)
                .tooltip("Kitty Night")
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "menu" | "toggle_hud" => {
                        let handle = app.clone();
                        std::thread::spawn(move || {
                            toggle_hud_window_inner(&handle);
                        });
                    }
                    "poke_kitten" => {
                        let _ = app.emit("kitten://tray-action", "poke_kitten");
                    }
                    "toss_yarn" => {
                        let _ = app.emit("kitten://tray-action", "toss_yarn");
                    }
                    "toggle_tease_yarn" => {
                        let _ = app.emit("kitten://tray-action", "toggle_tease_yarn");
                    }
                    "clear_yarn" => {
                        let _ = app.emit("kitten://tray-action", "clear_yarn");
                    }
                    "toggle_feather_wand" => {
                        let _ = app.emit("kitten://tray-action", "toggle_feather_wand");
                    }
                    "toggle_cushion" => {
                        let _ = app.emit("kitten://tray-action", "toggle_cushion");
                    }
                    "toss_fish" => {
                        let _ = app.emit("kitten://tray-action", "toss_fish");
                    }
                    "toss_macaron" => {
                        let _ = app.emit("kitten://tray-action", "toss_macaron");
                    }
                    "toss_boba" => {
                        let _ = app.emit("kitten://tray-action", "toss_boba");
                    }
                    "toss_cake" => {
                        let _ = app.emit("kitten://tray-action", "toss_cake");
                    }
                    "toggle_focus" => {
                        let _ = app.emit("kitten://tray-action", "toggle_focus");
                    }
                    "exit" | "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            } else if let Ok(fallback_icon) = tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png")) {
                tray_builder = tray_builder.icon(fallback_icon);
            }
            let tray = tray_builder.build(app)?;
            app.manage(tray);

            // Background hit-test & safe cursor-hold thread
            let thread_state = overlay_state.clone();
            std::thread::spawn(move || {
                let mut currently_ignoring = true;
                let mut last_cursor = (i32::MIN, i32::MIN);
                let mut last_hit_gen = u64::MAX;
                let mut sleep_ms = 33u64;
                loop {
                    std::thread::sleep(Duration::from_millis(sleep_ms));
                    let (cx, cy) = get_cursor_pos();

                    let mut escaped_hold = false;
                    let mut hold_active = false;
                    let mut next_ignore = currently_ignoring;

                    if let Ok(mut guard) = thread_state.lock() {
                        // Safe real cursor-hold tug with instant escape
                        if let Some((tx, ty)) = guard.cursor_hold {
                            hold_active = true;
                            let moved_far = if let Some((lx, ly)) = guard.last_hold_cursor {
                                (cx - lx).abs() > 26 || (cy - ly).abs() > 26
                            } else {
                                false
                            };
                            if user_wants_cursor_release() || moved_far {
                                guard.cursor_hold = None;
                                guard.last_hold_cursor = None;
                                escaped_hold = true;
                                hold_active = false;
                            } else {
                                // Gentle elastic pull toward the cat's paws
                                let nx = cx + ((tx - cx) as f64 * 0.45).round() as i32;
                                let ny = cy + ((ty - cy) as f64 * 0.45).round() as i32;
                                set_cursor_pos(nx, ny);
                                guard.last_hold_cursor = Some((nx, ny));
                            }
                        }

                        if guard.pointer_locked {
                            next_ignore = false;
                            last_cursor = (cx, cy);
                            last_hit_gen = guard.hit_gen;
                        } else if (cx, cy) != last_cursor || guard.hit_gen != last_hit_gen {
                            last_cursor = (cx, cy);
                            last_hit_gen = guard.hit_gen;
                            let lx = (cx - guard.virtual_x) as f64;
                            let ly = (cy - guard.virtual_y) as f64;
                            let hit = guard.hit_rects.iter().any(|r| {
                                lx >= r.x && lx <= r.x + r.width && ly >= r.y && ly <= r.y + r.height
                            });
                            next_ignore = !hit;
                        }
                    }

                    sleep_ms = if hold_active { 16 } else { 33 };

                    if escaped_hold {
                        let _ = handle.emit("kitten://cursor-hold-escaped", ());
                    }

                    if next_ignore != currently_ignoring {
                        currently_ignoring = next_ignore;
                        if let Some(win) = handle.get_webview_window("overlay") {
                            let _ = win.set_ignore_cursor_events(next_ignore);
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Kitten");
}
