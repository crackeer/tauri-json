use tauri::Error as TauriError;
use std::fs::File;
use std::io::{Read, Write};
#[cfg_attr(mobile, tauri::mobile_entry_point)]

#[tauri::command]
fn read_file(name: String) -> Result<String, TauriError> {
    let file = File::open(name);
    let mut file = match file {
        Ok(f) => f,
        Err(err) => return Err(TauriError::Io(err)),
    };
    let mut content = String::new();
    if let Err(err) = file.read_to_string(&mut content) {
        return Err(TauriError::Io(err));
    }
    Ok(content)
}

#[tauri::command]
fn write_file(name: String, content: String) -> Result<(), TauriError> {
    match File::create(name) {
        Err(err) => Err(TauriError::Io(err)),
        Ok(mut buffer) => match buffer.write(content.as_bytes()) {
            Ok(_) => Ok(()),
            Err(err) => Err(TauriError::Io(err)),
        },
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![read_file, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


