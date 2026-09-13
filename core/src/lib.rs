//! web-midi-player core (Wasm).
//!
//! Thin wasm-bindgen layer over `ump-playback`, which provides MIDI parsing,
//! sequencing, and SF2 synthesis.

pub mod debug;
pub mod player;

pub use player::Player;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub fn core_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
