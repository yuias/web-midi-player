//! Console logger for the `log` facade used by ump-playback.

use wasm_bindgen::JsValue;

struct ConsoleLogger;

impl log::Log for ConsoleLogger {
    fn enabled(&self, _metadata: &log::Metadata) -> bool {
        true
    }

    fn log(&self, record: &log::Record) {
        let line = format!("[{}] {}", record.level(), record.args());
        web_sys::console::log_1(&JsValue::from_str(&line));
    }

    fn flush(&self) {}
}

/// Install the console logger. Later calls are no-ops, so every `Player`
/// constructor can call it.
pub fn init() {
    if log::set_logger(&ConsoleLogger).is_ok() {
        log::set_max_level(log::LevelFilter::Info);
    }
}
