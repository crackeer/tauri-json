use tauri::Window;

#[macro_use]
extern crate rust_box;

use rust_box::tauri_command::file::{
    create_dir, create_file, delete_dir, delete_file, file_exists, get_file_content, list_folder,
    rename_file, write_file, write_media_file,
};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![greet, set_window_title, get_file_content, write_file, write_media_file, create_file, create_dir, delete_file, delete_dir, file_exists, list_folder, rename_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_window_title(window: Window, title: String) -> String {
    _ = window.set_title(title.as_str());
    String::from("ok")
}


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}